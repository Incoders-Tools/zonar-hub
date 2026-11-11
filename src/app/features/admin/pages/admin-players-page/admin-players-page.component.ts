import { Component, inject, signal, OnDestroy, computed, ElementRef, viewChild, effect, untracked } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionRowAction, ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { ChatbotBubbleComponent, ChatbotMode } from '../../../../shared/components/chatbot-bubble/chatbot-bubble.component';
import { PlayerFacadeService } from './player-facade.service';
import { PlayerFormPanelComponent } from './player-form-panel/player-form-panel.component';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { Player } from '../../../../core/models';

export type AdminPlayersTab = 'list' | 'agent' | 'importer';

export interface PlayerRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  documentId: string;
  categoryName: string;
  genderLabel: string;
  club: string;
  birthDate: string;
  isActive: boolean;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-players-page',
  standalone: true,
  imports: [
    TranslatePipe,
    MatIcon,
    ZhCollectionViewComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    PlayerFormPanelComponent,
    HelpButtonComponent,
    ChatbotBubbleComponent
  ],
  providers: [PlayerFacadeService],
  templateUrl: './admin-players-page.component.html',
  styleUrl: './admin-players-page.component.scss',
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
export class AdminPlayersPageComponent implements OnDestroy {
  readonly facade = inject(PlayerFacadeService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly tournamentService = inject(TournamentService);

  constructor() {
    // Single owner of list loads: once on init and once per active organization change
    effect(() => {
      this.activeOrg.organizationChanged();
      untracked(() => {
        this.showFormPanel.set(false);
        this.showDeactivateDialog.set(false);
        this.showBulkDeactivateDialog.set(false);
        this.editingPlayer.set(null);
        this.selectedPlayers.set([]);
        this.facade.goToPage(1);
      });
    });
  }

  // Tabs
  readonly activeTab = signal<AdminPlayersTab>('list');

  // Embedded chatbot state
  readonly showEmbeddedChat = signal(false);
  readonly chatbotMode = signal<ChatbotMode>('floating');

  // Importer state
  readonly importerFile = signal<File | null>(null);
  readonly importerFileName = signal('');
  readonly importerProcessing = signal(false);
  readonly importerImporting = signal(false);
  readonly importerPreview = signal<Record<string, unknown>[]>([]);
  readonly importerDone = signal(false);
  readonly importerTournamentId = signal('');
  readonly importerError = signal('');

  readonly tournamentOptions = computed(() =>
    this.tournamentService.tournaments().map(t => ({ value: t.id, label: t.name }))
  );

  readonly showFormPanel = signal(false);
  readonly showDeactivateDialog = signal(false);
  readonly showBulkDeactivateDialog = signal(false);
  readonly editingPlayer = signal<Player | null>(null);
  readonly deactivatingId = signal<string | null>(null);
  readonly selectedPlayers = signal<PlayerRow[]>([]);
  readonly formPanelRef = viewChild<ElementRef>('formPanel');

  /** The API orders players by last name and first name; columns are not sortable client-side. */
  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.players.column.name' },
    { key: 'email', labelKey: 'admin.players.column.email' },
    { key: 'documentId', labelKey: 'admin.players.column.documentId' },
    { key: 'categoryName', labelKey: 'admin.players.column.category' },
    { key: 'genderLabel', labelKey: 'admin.players.column.gender' },
    { key: 'club', labelKey: 'admin.players.column.club' },
    { key: 'birthDate', labelKey: 'admin.players.column.birthDate', renderType: 'date' },
    { key: 'statusLabel', labelKey: 'admin.players.column.status', renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  private readonly editAction: ZhCollectionRowAction = { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' };
  private readonly deactivateAction: ZhCollectionRowAction = { icon: 'person_off', labelKey: 'admin.players.action.deactivate', action: 'deactivate', variant: 'danger' };
  private readonly reactivateAction: ZhCollectionRowAction = { icon: 'person_add', labelKey: 'admin.players.action.reactivate', action: 'reactivate', variant: 'default' };

  /** Every action a row may show; `playerRowActionsFilter` narrows them to the row's status. */
  readonly playerRowActions = [this.editAction, this.deactivateAction, this.reactivateAction];

  readonly playerRowActionsFilter = (row: PlayerRow): ZhCollectionRowAction[] =>
    [this.editAction, row.isActive ? this.deactivateAction : this.reactivateAction];

  readonly filterFields: FilterField[] = [
    { key: 'search', labelKey: 'admin.players.filter.search', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.players.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.players.status.active' },
        { value: 'false', labelKey: 'admin.players.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<PlayerRow[]>(() =>
    this.facade.players().map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      documentId: p.documentId ?? '',
      categoryName: p.categoryName,
      genderLabel: p.genderLabel,
      club: p.club ?? '',
      birthDate: p.birthDate ?? '',
      isActive: p.isActive,
      statusLabel: p.isActive ? 'admin.players.status.active' : 'admin.players.status.inactive',
      statusVariant: p.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasActiveSelection = computed(() => this.selectedPlayers().some(r => r.isActive));

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.players.help.whatTitle', contentKey: 'admin.players.help.whatDescription' },
    { titleKey: 'admin.players.help.fieldsTitle', contentKey: 'admin.players.help.fieldsDescription' },
    { titleKey: 'admin.players.help.eligibilityTitle', contentKey: 'admin.players.help.eligibilityDescription' },
    { titleKey: 'admin.players.help.managementTitle', contentKey: 'admin.players.help.managementDescription' }
  ];

  ngOnDestroy(): void {
    if (this.chatbotMode() === 'embedded') {
      window.dispatchEvent(new CustomEvent('zh-switch-chatbot-mode', { detail: { mode: 'floating' } }));
    }
  }

  onFiltersApplied(filters: Record<string, string>): void {
    this.selectedPlayers.set([]);
    this.facade.applyFilters({
      search: filters['search']?.trim() || undefined,
      isActive: filters['isActive'] || undefined
    });
  }

  onFiltersCleared(): void {
    this.selectedPlayers.set([]);
    this.facade.clearFilters();
  }

  onPageChange(page: number): void {
    this.selectedPlayers.set([]);
    this.facade.goToPage(page);
  }

  onRowActionClicked(event: { action: string; row: PlayerRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'deactivate') {
      this.confirmDeactivate(event.row);
    } else if (event.action === 'reactivate') {
      void this.facade.setActive([event.row.id], true);
    }
  }

  openCreate(): void {
    this.editingPlayer.set(null);
    this.showFormPanel.set(true);
    this.scrollToFormPanel();
  }

  openEdit(row: PlayerRow): void {
    const player = this.facade.players().find(p => p.id === row.id);
    if (player) {
      this.editingPlayer.set(player);
      this.showFormPanel.set(true);
      this.scrollToFormPanel();
    }
  }

  private scrollToFormPanel(): void {
    setTimeout(() => {
      this.formPanelRef()?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingPlayer.set(null);
  }

  confirmDeactivate(row: PlayerRow): void {
    this.deactivatingId.set(row.id);
    this.showDeactivateDialog.set(true);
  }

  async executeDeactivate(): Promise<void> {
    const id = this.deactivatingId();
    if (id && await this.facade.setActive([id], false)) {
      this.showDeactivateDialog.set(false);
      this.deactivatingId.set(null);
    }
  }

  cancelDeactivate(): void {
    this.showDeactivateDialog.set(false);
    this.deactivatingId.set(null);
  }

  onSelectionChanged(rows: PlayerRow[]): void {
    this.selectedPlayers.set(rows);
  }

  openBulkDeactivate(): void {
    if (this.hasActiveSelection()) {
      this.showBulkDeactivateDialog.set(true);
    }
  }

  async executeBulkDeactivate(): Promise<void> {
    const ids = this.selectedPlayers().filter(r => r.isActive).map(r => r.id);
    if (await this.facade.setActive(ids, false)) {
      this.showBulkDeactivateDialog.set(false);
      this.selectedPlayers.set([]);
    }
  }

  cancelBulkDeactivate(): void {
    this.showBulkDeactivateDialog.set(false);
  }

  setTab(tab: AdminPlayersTab): void {
    this.activeTab.set(tab);
    if (tab !== 'agent') {
      this.showEmbeddedChat.set(false);
      if (this.chatbotMode() === 'embedded') {
        this.chatbotMode.set('floating');
        window.dispatchEvent(new CustomEvent('zh-switch-chatbot-mode', { detail: { mode: 'floating' } }));
      }
    }
  }

  openEmbeddedChat(): void {
    this.showEmbeddedChat.set(true);
    this.chatbotMode.set('embedded');
    window.dispatchEvent(new CustomEvent('zh-switch-chatbot-mode', { detail: { mode: 'embedded' } }));
  }

  onChatbotModeChanged(mode: ChatbotMode): void {
    if (mode === 'floating') {
      this.showEmbeddedChat.set(false);
      this.chatbotMode.set('floating');
      window.dispatchEvent(new CustomEvent('zh-switch-chatbot-mode', { detail: { mode: 'floating' } }));
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
    if (!this.importerFile() || this.importerProcessing()) return;

    this.importerProcessing.set(true);
    this.importerError.set('');
    this.importerPreview.set([]);

    try {
      // Simulate parse stage before applying import.
      await new Promise(resolve => setTimeout(resolve, 1200));
      this.importerPreview.set([
        { firstName: 'Ana', lastName: 'García', email: 'ana@example.com', phone: '+54911000001', sport: 'Pádel', category: 'A', gender: 'Femenino' },
        { firstName: 'Carlos', lastName: 'López', email: 'carlos@example.com', phone: '+54911000002', sport: 'Pádel', category: 'B', gender: 'Masculino' }
      ]);
    } catch {
      this.importerError.set('players.importer.error');
    } finally {
      this.importerProcessing.set(false);
    }
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    fileInput.click();
  }

  downloadPlayerTemplate(): void {
    // Build CSV template
    const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Fecha de nacimiento (YYYY-MM-DD)', 'Deporte', 'Categoría', 'Género'];
    const example = ['María', 'González', 'maria@ejemplo.com', '+5491100000000', '1990-05-20', 'Pádel', 'A', 'Femenino'];
    const csv = [headers, example].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_jugadores.csv';
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
      this.notifications.success(this.i18n.translate('players.importer.success'));
      await this.facade.load();
    } catch {
      this.importerError.set('players.importer.error');
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
  }
}
