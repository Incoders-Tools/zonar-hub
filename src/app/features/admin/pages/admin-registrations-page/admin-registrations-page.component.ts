import { Component, inject, signal, computed, OnDestroy, effect, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { MatIcon } from '@angular/material/icon';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionRowAction, ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { FilterPanelComponent, FilterField, SortOption } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { ZhSelectComponent, ZhSelectOption } from '../../../../shared/components/zh-select/zh-select.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RegistrationFacadeService } from './registration-facade.service';
import { RegistrationFormPanelComponent } from './registration-form-panel/registration-form-panel.component';
import {
  RegistrationPaymentStatus,
  TournamentRegistration,
  TournamentRegistrationStatus,
  allowedManualPayments,
  allowedRegistrationTransitions
} from '../../../../core/models';
import { TournamentService } from '../../../../core/services/tournament.service';
import { SocialSharePreviewComponent, SocialSharePayload } from '../../../../shared/components/social-share-preview/social-share-preview.component';
import { ChatbotBubbleComponent, ChatbotMode } from '../../../../shared/components/chatbot-bubble/chatbot-bubble.component';

export type AdminRegistrationsTab = 'list' | 'agent' | 'importer' | 'tokens';

/** Row actions of the list: the D2 transitions, the manual payment marks, the explanation of a full tournament and share. */
export type RegistrationRowAction =
  'confirm' | 'confirmBlocked' | 'waitlist' | 'reject' | 'cancel' | 'markPaid' | 'markRefunded' | 'share';

/** Actions that cannot be undone from this screen; they run only after the confirm-dialog. */
export type DestructiveRegistrationAction = 'reject' | 'cancel' | 'markRefunded';

const DESTRUCTIVE_ACTIONS: ReadonlySet<string> = new Set<DestructiveRegistrationAction>(['reject', 'cancel', 'markRefunded']);

const STATUSES: TournamentRegistrationStatus[] = ['pending', 'confirmed', 'waitlisted', 'rejected', 'cancelled'];
const PAYMENT_STATUSES: RegistrationPaymentStatus[] = ['notRequired', 'pending', 'paid', 'refunded', 'failed'];

/** Shared pill variants (`data-table` pills and `.zh-list-card__status--*`). */
const STATUS_VARIANTS: Record<TournamentRegistrationStatus, string> = {
  pending: 'warning', confirmed: 'active', waitlisted: 'info', rejected: 'danger', cancelled: 'inactive'
};
const PAYMENT_VARIANTS: Record<RegistrationPaymentStatus, string> = {
  notRequired: 'inactive', pending: 'warning', paid: 'active', refunded: 'info', failed: 'danger'
};

interface RegistrationRow extends Record<string, unknown> {
  id: string;
  participantsDisplay: string;
  clubs: string;
  status: TournamentRegistrationStatus;
  statusLabel: string;
  statusVariant: string;
  paymentStatus: RegistrationPaymentStatus;
  paymentLabel: string;
  paymentVariant: string;
  sourceLabel: string;
  contactEmail: string;
  notes: string;
  createdAt: string;
}

interface TokenRow extends Record<string, unknown> {
  id: string;
  code: string;
  isActive: boolean;
  statusLabel: string;
  statusVariant: string;
  assignedTo: string;
  createdBy: string;
  expiresAt: string;
  createdAt: string;
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

/**
 * Registrations of one tournament (S4): pick the tournament, read its places (confirmed over `maxPairs`, pending,
 * waiting list), filter by status and payment, and move each registration through the transitions D2 allows for its
 * status. Reject, cancel and refund go through the confirm-dialog; confirm is replaced by an explanation while the
 * places are taken. New registrations are created from organization players in the inline form panel.
 */
@Component({
  selector: 'app-admin-registrations-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatIcon,
    ZhCollectionViewComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    HelpButtonComponent,
    ZhSelectComponent,
    EmptyStateComponent,
    RegistrationFormPanelComponent,
    SocialSharePreviewComponent,
    ChatbotBubbleComponent
  ],
  providers: [RegistrationFacadeService],
  templateUrl: './admin-registrations-page.component.html',
  styleUrl: './admin-registrations-page.component.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('250ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class AdminRegistrationsPageComponent implements OnDestroy {
  readonly facade = inject(RegistrationFacadeService);
  private readonly tournamentService = inject(TournamentService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  /** Tournament whose registrations are shown. */
  readonly tournamentControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.tournamentControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(id => {
      this.closeForm();
      this.pendingAction.set(null);
      void this.facade.selectTournament(id || null);
    });

    // The tournament belongs to the organization: a new organization starts without a selection
    effect(() => {
      this.activeOrg.organizationChanged();
      untracked(() => {
        this.closeForm();
        this.pendingAction.set(null);
        if (this.tournamentService.tournaments().length === 0) void this.tournamentService.loadTournaments();
        if (this.tournamentControl.value) {
          this.tournamentControl.setValue('');
        } else {
          void this.facade.selectTournament(null);
        }
      });
    });
  }

  /** Tournaments of the active organization (every loaded tournament without one). */
  readonly tournaments = computed(() => {
    const activeOrgId = this.activeOrg.activeOrganizationId();
    const all = this.tournamentService.tournaments();
    return activeOrgId ? all.filter(t => t.organizationId === activeOrgId) : all;
  });

  readonly tournamentOptions = computed<ZhSelectOption[]>(() =>
    this.tournaments().map(t => ({ value: t.id, label: t.name })));

  /** Options of the importer tab's tournament selector. */
  readonly tournamentFilterOptions = computed(() =>
    this.tournaments().map(t => ({ value: t.id, labelKey: t.name })));

  readonly selectedTournament = computed(() => {
    const id = this.facade.tournamentId();
    return id ? this.tournaments().find(t => t.id === id) ?? null : null;
  });

  readonly activeTab = signal<AdminRegistrationsTab>('list');
  readonly showFormPanel = signal(false);
  /** Destructive action waiting for the confirm-dialog. */
  readonly pendingAction = signal<{ action: DestructiveRegistrationAction; registrationId: string } | null>(null);
  readonly sharePayload = signal<SocialSharePayload | null>(null);

  // Importer state
  readonly importerFile = signal<File | null>(null);
  readonly importerFileName = signal('');
  readonly importerProcessing = signal(false);
  readonly importerImporting = signal(false);
  readonly importerPreview = signal<Record<string, unknown>[]>([]);
  readonly importerDone = signal(false);
  readonly importerTournamentId = signal('');
  readonly importerError = signal('');

  // Agent tab state
  readonly showEmbeddedChat = signal(false);
  readonly chatbotMode = signal<ChatbotMode>('floating');

  readonly helpSections: HelpSection[] = [
    { titleKey: 'registrations.help.section1Title', contentKey: 'registrations.help.section1Text' },
    { titleKey: 'registrations.help.statusesTitle', contentKey: 'registrations.help.statusesText' },
    { titleKey: 'registrations.help.capacityTitle', contentKey: 'registrations.help.capacityText' },
    { titleKey: 'registrations.help.paymentTitle', contentKey: 'registrations.help.paymentText' },
    { titleKey: 'registrations.help.concurrencyTitle', contentKey: 'registrations.help.concurrencyText' },
    { titleKey: 'registrations.help.section2Title', contentKey: 'registrations.help.section2Text' },
    { titleKey: 'registrations.help.section3Title', items: [
      'registrations.help.section3Item1',
      'registrations.help.section3Item2',
      'registrations.help.section3Item3'
    ] }
  ];

  // List tab
  readonly listColumns: DataTableColumn[] = [
    { key: 'participantsDisplay', labelKey: 'registrations.column.participants', sortable: true },
    { key: 'statusLabel', labelKey: 'registrations.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' },
    { key: 'paymentLabel', labelKey: 'registrations.column.payment', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'paymentVariant' },
    { key: 'sourceLabel', labelKey: 'registrations.column.source', sortable: true, translate: true },
    { key: 'createdAt', labelKey: 'registrations.column.registeredAt', sortable: true, renderType: 'date' }
  ];

  private readonly actions: Record<RegistrationRowAction, ZhCollectionRowAction> = {
    confirm: { icon: 'check_circle', labelKey: 'registrations.action.confirm', action: 'confirm', variant: 'primary' },
    confirmBlocked: { icon: 'block', labelKey: 'registrations.action.confirmFull', action: 'confirmBlocked', variant: 'default' },
    waitlist: { icon: 'hourglass_top', labelKey: 'registrations.action.waitlist', action: 'waitlist', variant: 'default' },
    reject: { icon: 'thumb_down', labelKey: 'registrations.action.reject', action: 'reject', variant: 'danger' },
    cancel: { icon: 'cancel', labelKey: 'registrations.action.cancel', action: 'cancel', variant: 'danger' },
    markPaid: { icon: 'payments', labelKey: 'registrations.action.markPaid', action: 'markPaid', variant: 'default' },
    markRefunded: { icon: 'undo', labelKey: 'registrations.action.markRefunded', action: 'markRefunded', variant: 'warn' },
    share: { icon: 'share', labelKey: 'share.label', action: 'share', variant: 'default' }
  };

  /** Every action a row may show; `listRowActionsFilter` narrows them to the row's status and payment. */
  readonly listRowActions = Object.values(this.actions);

  /** D2 transitions of the status (confirm becomes its explanation while full), then the D5 payment marks. */
  readonly listRowActionsFilter = (row: RegistrationRow): ZhCollectionRowAction[] => {
    const transitions = allowedRegistrationTransitions(row.status).map(t =>
      t === 'confirm' && this.facade.capacityFull() ? this.actions.confirmBlocked : this.actions[t]);
    const payments = allowedManualPayments(row.paymentStatus).map(p =>
      p === 'paid' ? this.actions.markPaid : this.actions.markRefunded);
    return [...transitions, ...payments, this.actions.share];
  };

  readonly filterFields: FilterField[] = [
    { key: 'search', labelKey: 'registrations.filter.search', type: 'text' },
    {
      key: 'status', labelKey: 'registrations.filter.status', type: 'select',
      options: STATUSES.map(value => ({ value, labelKey: `registrations.status.${value}` }))
    },
    {
      key: 'paymentStatus', labelKey: 'registrations.filter.payment', type: 'select',
      options: PAYMENT_STATUSES.map(value => ({ value, labelKey: `registrations.payment.${value}` }))
    }
  ];

  readonly listSortOptions: SortOption[] = [
    { key: 'participantsDisplay', labelKey: 'registrations.column.participants' },
    { key: 'createdAt', labelKey: 'registrations.column.registeredAt' },
    { key: 'statusLabel', labelKey: 'registrations.column.status' },
    { key: 'paymentLabel', labelKey: 'registrations.column.payment' }
  ];

  readonly tableData = computed<RegistrationRow[]>(() =>
    this.facade.filteredRegistrations().map(r => ({
      id: r.id,
      participantsDisplay: r.participants.map(p => p.displayName).join(' / '),
      clubs: [...new Set(r.participants.map(p => p.club).filter((club): club is string => !!club))].join(', '),
      status: r.status,
      statusLabel: `registrations.status.${r.status}`,
      statusVariant: STATUS_VARIANTS[r.status] ?? 'neutral',
      paymentStatus: r.paymentStatus,
      paymentLabel: `registrations.payment.${r.paymentStatus}`,
      paymentVariant: PAYMENT_VARIANTS[r.paymentStatus] ?? 'neutral',
      sourceLabel: `registrations.source.${r.source}`,
      contactEmail: r.contactEmail ?? '',
      notes: r.notes ?? '',
      createdAt: r.createdAt
    }))
  );

  /** "3 / 8" or "3" without a limit. */
  readonly confirmedText = computed(() => {
    const capacity = this.facade.capacity();
    if (!capacity) return '';
    return capacity.maxPairs == null ? String(capacity.confirmed) : `${capacity.confirmed} / ${capacity.maxPairs}`;
  });

  readonly placesLeftText = computed(() => {
    const capacity = this.facade.capacity();
    if (!capacity) return '';
    return capacity.placesLeft == null
      ? this.i18n.translate('registrations.capacity.unlimited')
      : String(capacity.placesLeft);
  });

  readonly pendingActionKeys = computed(() => {
    const pending = this.pendingAction();
    if (!pending) return null;
    const base = `registrations.confirmAction.${pending.action}`;
    return {
      title: `${base}.title`,
      message: `${base}.message`,
      warning: `${base}.warning`,
      confirm: `registrations.action.${pending.action}`
    };
  });

  // Tokens tab
  readonly tokenColumns: DataTableColumn[] = [
    { key: 'code', labelKey: 'registrations.tokens.column.code', sortable: true },
    { key: 'statusLabel', labelKey: 'registrations.tokens.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' },
    { key: 'assignedTo', labelKey: 'registrations.tokens.column.assignedTo', sortable: true },
    { key: 'createdBy', labelKey: 'registrations.tokens.column.createdBy', sortable: false },
    { key: 'expiresAt', labelKey: 'registrations.tokens.column.expiresAt', sortable: true, renderType: 'date' },
    { key: 'createdAt', labelKey: 'registrations.tokens.column.createdAt', sortable: true, renderType: 'date' }
  ];

  readonly tokenRowActions = [
    { icon: 'content_copy', labelKey: 'registrations.tokens.copy', action: 'copy', variant: 'primary' as const },
    { icon: 'block', labelKey: 'registrations.tokens.deactivate', action: 'deactivate', variant: 'danger' as const }
  ];

  readonly tokenFilterFields: FilterField[] = [
    {
      key: 'tokenStatus', labelKey: 'registrations.tokens.column.status', type: 'select',
      options: [
        { value: 'active', labelKey: 'registrations.tokens.active' },
        { value: 'inactive', labelKey: 'registrations.tokens.inactive' }
      ]
    }
  ];

  readonly tokenSortOptions: SortOption[] = [
    { key: 'code', labelKey: 'registrations.tokens.column.code' },
    { key: 'createdAt', labelKey: 'registrations.tokens.column.createdAt' },
    { key: 'expiresAt', labelKey: 'registrations.tokens.column.expiresAt' },
    { key: 'assignedTo', labelKey: 'registrations.tokens.column.assignedTo' }
  ];

  readonly tokenTableData = computed<TokenRow[]>(() =>
    this.facade.filteredTokens().map(t => ({
      id: t.id,
      code: t.code,
      isActive: t.isActive,
      statusLabel: t.isActive ? 'registrations.tokens.active' : 'registrations.tokens.inactive',
      statusVariant: t.isActive ? 'active' : 'inactive',
      assignedTo: t.assignedTo ?? '—',
      createdBy: t.createdBy,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt
    }))
  );

  ngOnDestroy(): void {
    if (this.chatbotMode() === 'embedded') {
      window.dispatchEvent(new CustomEvent('zh-switch-chatbot-mode', {
        detail: { mode: 'floating', source: 'registrations' }
      }));
    }
  }

  setTab(tab: AdminRegistrationsTab): void {
    this.activeTab.set(tab);
    if (tab !== 'agent') {
      this.showEmbeddedChat.set(false);
      if (this.chatbotMode() === 'embedded') {
        this.chatbotMode.set('floating');
        window.dispatchEvent(new CustomEvent('zh-switch-chatbot-mode', {
          detail: { mode: 'floating', source: 'registrations' }
        }));
      }
    }
  }

  onFiltersApplied(filters: Record<string, string>): void {
    void this.facade.applyFilters({
      search: filters['search']?.trim() || undefined,
      status: (filters['status'] || undefined) as TournamentRegistrationStatus | undefined,
      paymentStatus: (filters['paymentStatus'] || undefined) as RegistrationPaymentStatus | undefined
    });
  }

  onFiltersCleared(): void {
    void this.facade.clearFilters();
  }

  onTokenFiltersApplied(filters: Record<string, string>): void {
    this.facade.applyTokenFilters(filters['tokenStatus'] || undefined);
  }

  onTokenFiltersCleared(): void {
    this.facade.clearTokenFilters();
  }

  onRowActionClicked(event: { action: string; row: RegistrationRow }): void {
    const registration = this.findRegistration(event.row.id);
    if (!registration) return;
    const action = event.action as RegistrationRowAction;
    if (DESTRUCTIVE_ACTIONS.has(action)) {
      this.pendingAction.set({ action: action as DestructiveRegistrationAction, registrationId: registration.id });
    } else if (action === 'confirm' || action === 'waitlist') {
      void this.facade.transition(registration, action);
    } else if (action === 'markPaid') {
      void this.facade.setPayment(registration, 'paid');
    } else if (action === 'confirmBlocked') {
      this.notifications.warning(this.i18n.translate('registrations.capacity.fullExplanation'));
    } else if (action === 'share') {
      this.openShare(event.row);
    }
  }

  async onPendingActionConfirmed(): Promise<void> {
    const pending = this.pendingAction();
    const registration = pending ? this.findRegistration(pending.registrationId) : undefined;
    if (!pending || !registration) {
      this.pendingAction.set(null);
      return;
    }
    if (pending.action === 'markRefunded') {
      await this.facade.setPayment(registration, 'refunded');
    } else {
      await this.facade.transition(registration, pending.action);
    }
    this.pendingAction.set(null);
  }

  onPendingActionCancelled(): void {
    this.pendingAction.set(null);
  }

  openCreate(): void {
    if (!this.selectedTournament()) return;
    this.showFormPanel.set(true);
  }

  closeForm(): void {
    this.showFormPanel.set(false);
  }

  onFormSaved(): void {
    this.closeForm();
  }

  // Token actions
  async generateToken(): Promise<void> {
    const tournamentId = this.facade.tournamentId();
    if (tournamentId) await this.facade.generateToken(tournamentId);
  }

  onTokenAction(event: { action: string; row: TokenRow }): void {
    if (event.action === 'copy') {
      this.facade.copyTokenToClipboard(event.row.code);
    } else if (event.action === 'deactivate') {
      this.facade.deactivateToken(event.row.id);
    }
  }

  openShare(row: RegistrationRow): void {
    this.sharePayload.set({
      type: 'registration',
      title: row.participantsDisplay,
      subtitle: this.selectedTournament()?.name ?? '',
      lines: [
        `📋 ${this.i18n.translate(row.statusLabel)}`,
        `📅 ${row.createdAt}`
      ]
    });
  }

  closeSharePreview(): void {
    this.sharePayload.set(null);
  }

  capacitySummary(key: string, value: string | number): string {
    return interpolate(this.i18n.translate(key), { value });
  }

  private findRegistration(id: string): TournamentRegistration | undefined {
    return this.facade.registrations().find(r => r.id === id);
  }

  // Agent tab methods
  openEmbeddedChat(): void {
    this.showEmbeddedChat.set(true);
    this.chatbotMode.set('embedded');

    // Get reference to the main chatbot instance (if visible) and hide it
    window.dispatchEvent(new CustomEvent('zh-switch-chatbot-mode', {
      detail: { mode: 'embedded', source: 'registrations' }
    }));
  }

  onChatbotModeChanged(mode: ChatbotMode): void {
    if (mode === 'floating') {
      // User closed the embedded chat
      this.showEmbeddedChat.set(false);
      this.chatbotMode.set('floating');

      // Notify main chatbot to restore
      window.dispatchEvent(new CustomEvent('zh-switch-chatbot-mode', {
        detail: { mode: 'floating', source: 'registrations' }
      }));
    }
  }

  // ---- Importer ----

  onImporterFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.importerFile.set(file);
    this.importerFileName.set(file?.name ?? '');
    this.importerError.set('');
    this.importerDone.set(false);
    this.importerProcessing.set(false);
    this.importerPreview.set([]);
  }

  async processImporterFile(): Promise<void> {
    if (!this.importerFile() || !this.importerTournamentId() || this.importerProcessing()) return;

    this.importerProcessing.set(true);
    this.importerError.set('');
    this.importerPreview.set([]);

    try {
      // Simulate parsing stage before import confirmation.
      await new Promise(resolve => setTimeout(resolve, 1200));
      this.importerPreview.set([
        { participants: 'García Ana / López Carlos', phone: '+54911000001', availability: 'Sábados y Domingos - Mañana' },
        { participants: 'Martínez Sofía / Rodríguez Juan', phone: '+54911000002', availability: 'Sábados - Todo el día' }
      ]);
    } catch {
      this.importerError.set('registrations.importer.error');
    } finally {
      this.importerProcessing.set(false);
    }
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    fileInput.click();
  }

  downloadRegistrationTemplate(): void {
    const tournamentId = this.importerTournamentId();
    const tournament = this.tournamentService.getTournamentById(tournamentId);
    const tournamentName = tournament?.name ?? 'torneo';

    // Build CSV with headers matching registration fields (excluding tournament)
    const headers = ['Jugador 1 - Nombre', 'Jugador 1 - Apellido', 'Jugador 1 - Email', 'Jugador 1 - Teléfono',
                     'Jugador 2 - Nombre', 'Jugador 2 - Apellido', 'Jugador 2 - Email', 'Jugador 2 - Teléfono',
                     'Disponibilidad (días)', 'Disponibilidad (horario)'];
    const example = ['María', 'González', 'maria@ejemplo.com', '+5491100000001',
                     'Carlos', 'López', 'carlos@ejemplo.com', '+5491100000002',
                     'Sábado,Domingo', 'Mañana'];
    const csv = [headers, example].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_inscripciones_${tournamentName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async confirmImport(): Promise<void> {
    if (!this.importerFile() || this.importerPreview().length === 0 || this.importerImporting()) return;
    this.importerImporting.set(true);
    this.importerError.set('');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.importerDone.set(true);
      await this.facade.load();
    } catch {
      this.importerError.set('registrations.importer.error');
    } finally {
      this.importerImporting.set(false);
    }
  }

  resetImporter(): void {
    this.importerFile.set(null);
    this.importerFileName.set('');
    this.importerProcessing.set(false);
    this.importerPreview.set([]);
    this.importerDone.set(false);
    this.importerError.set('');
    this.importerTournamentId.set('');
  }
}
