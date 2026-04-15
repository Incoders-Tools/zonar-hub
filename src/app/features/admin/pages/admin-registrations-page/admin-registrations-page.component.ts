import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { MatIcon } from '@angular/material/icon';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField, SortOption } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { RegistrationFacadeService, RegistrationFilters } from './registration-facade.service';
import { RegistrationFormPanelComponent } from './registration-form-panel/registration-form-panel.component';
import { Registration, RegistrationToken } from '../../../../core/models';
import { TournamentService } from '../../../../core/services/tournament.service';
import { TenantFilterService } from '../../../../core/services/tenant-filter.service';
import { SocialSharePreviewComponent, SocialSharePayload } from '../../../../shared/components/social-share-preview/social-share-preview.component';

export type AdminRegistrationsTab = 'list' | 'importer' | 'tokens';

interface RegistrationRow extends Record<string, unknown> {
  id: string;
  player1: string;
  player2: string;
  statusId: string;
  statusLabel: string;
  source: string;
  registeredAt: string;
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

@Component({
  selector: 'app-admin-registrations-page',
  standalone: true,
  imports: [
    TranslatePipe,
    MatIcon,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    HelpButtonComponent,
    RegistrationFormPanelComponent,
    SocialSharePreviewComponent
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
export class AdminRegistrationsPageComponent implements OnInit {
  readonly facade = inject(RegistrationFacadeService);
  private readonly tournamentService = inject(TournamentService);
  private readonly tenantFilter = inject(TenantFilterService);

  /** Dynamic tournament options for the filter panel */
  readonly tournamentFilterOptions = computed(() =>
    this.tournamentService.tournaments().map(t => ({
      value: t.id,
      labelKey: t.name
    }))
  );

  readonly activeTab = signal<AdminRegistrationsTab>('list');
  readonly showDeleteDialog = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly selectedRegistrations = signal<RegistrationRow[]>([]);
  readonly showFormPanel = signal(false);
  readonly editingRegistration = signal<Registration | null>(null);
  readonly highlightedRowId = signal<string | null>(null);
  readonly sharePayload = signal<SocialSharePayload | null>(null);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'registrations.help.section1Title', contentKey: 'registrations.help.section1Text' },
    { titleKey: 'registrations.help.section2Title', contentKey: 'registrations.help.section2Text' },
    { titleKey: 'registrations.help.section3Title', items: [
      'registrations.help.section3Item1',
      'registrations.help.section3Item2',
      'registrations.help.section3Item3'
    ] }
  ];

  // List tab
  readonly listColumns: DataTableColumn[] = [
    { key: 'player1', labelKey: 'registrations.column.player1', sortable: true },
    { key: 'player2', labelKey: 'registrations.column.player2', sortable: true },
    { key: 'statusLabel', labelKey: 'registrations.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusId' },
    { key: 'source', labelKey: 'registrations.column.source', sortable: true, translate: true },
    { key: 'registeredAt', labelKey: 'registrations.column.registeredAt', sortable: true, renderType: 'date' }
  ];

  readonly listRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'share', labelKey: 'share.label', action: 'share', variant: 'default' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields = computed<FilterField[]>(() => {
    const fields: FilterField[] = [
      { key: 'search', labelKey: 'registrations.filter.search', type: 'text' },
      {
        key: 'tournamentId', labelKey: 'registrations.filter.tournament', type: 'select',
        options: [
          { value: '', labelKey: 'registrations.filter.allTournaments' },
          ...this.tournamentFilterOptions()
        ]
      },
      {
        key: 'statusId', labelKey: 'registrations.filter.status', type: 'select',
        options: [
          { value: 'rs1', labelKey: 'registrations.status.confirmed' },
          { value: 'rs2', labelKey: 'registrations.status.pending' },
          { value: 'rs3', labelKey: 'registrations.status.rejected' }
        ]
      },
      {
        key: 'source', labelKey: 'registrations.filter.source', type: 'select',
        options: [
          { value: 'wizard', labelKey: 'registrations.source.wizard' },
          { value: 'admin', labelKey: 'registrations.source.admin' },
          { value: 'excel', labelKey: 'registrations.source.excel' }
        ]
      }
    ];
    const tf = this.tenantFilter.tenantFilterField();
    return tf ? [tf, ...fields] : fields;
  });

  readonly listSortOptions: SortOption[] = [
    { key: 'player1Name', labelKey: 'registrations.column.player1' },
    { key: 'registeredAt', labelKey: 'registrations.column.registeredAt' },
    { key: 'statusLabel', labelKey: 'registrations.column.status' },
    { key: 'source', labelKey: 'registrations.column.source' }
  ];

  readonly tableData = computed<RegistrationRow[]>(() =>
    this.facade.filteredRegistrations().map(r => ({
      id: r.id,
      player1: `${r.player1Name} · ${r.categoryName} ${r.genderLabel}`,
      player2: `${r.player2Name} · ${r.categoryName} ${r.genderLabel}`,
      statusId: r.statusId,
      statusLabel: this.getStatusLabelKey(r.statusId),
      source: this.getSourceLabelKey(r.source),
      registeredAt: r.registeredAt
    }))
  );

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

  readonly hasSelection = computed(() => this.selectedRegistrations().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  setTab(tab: AdminRegistrationsTab): void {
    this.activeTab.set(tab);
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: RegistrationFilters = {
      search: filters['search'] || undefined,
      tournamentId: filters['tournamentId'] || undefined,
      statusId: filters['statusId'] || undefined,
      source: filters['source'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onTokenFiltersApplied(filters: Record<string, string>): void {
    this.facade.applyTokenFilters(filters['tokenStatus'] || undefined);
  }

  onTokenFiltersCleared(): void {
    this.facade.clearTokenFilters();
  }

  onRowActionClicked(event: { action: string; row: RegistrationRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'share') {
      this.openShare(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingRegistration.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: RegistrationRow): void {
    const reg = this.facade.filteredRegistrations().find(r => r.id === row.id);
    if (reg) {
      this.editingRegistration.set(reg);
      this.showFormPanel.set(true);
    }
  }

  closeForm(): void {
    this.showFormPanel.set(false);
    this.editingRegistration.set(null);
  }

  onFormSaved(): void {
    this.closeForm();
  }

  confirmDelete(row: RegistrationRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async onDeleteConfirmed(): Promise<void> {
    const id = this.deletingId();
    if (!id) return;
    const success = await this.facade.deleteRegistration(id);
    if (success) {
      this.showDeleteDialog.set(false);
      this.deletingId.set(null);
    }
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  onSelectionChanged(rows: RegistrationRow[]): void {
    this.selectedRegistrations.set(rows);
  }

  // Token actions
  async generateToken(): Promise<void> {
    await this.facade.generateToken('t1');
  }

  onTokenAction(event: { action: string; row: TokenRow }): void {
    if (event.action === 'copy') {
      this.facade.copyTokenToClipboard(event.row.code);
    } else if (event.action === 'deactivate') {
      this.facade.deactivateToken(event.row.id);
    }
  }

  private getStatusLabelKey(statusId: string): string {
    const map: Record<string, string> = {
      rs1: 'registrations.status.confirmed',
      rs2: 'registrations.status.pending',
      rs3: 'registrations.status.rejected'
    };
    return map[statusId] ?? statusId;
  }

  openShare(row: RegistrationRow): void {
    this.sharePayload.set({
      type: 'registration',
      title: row.player1,
      subtitle: row.player2,
      lines: [
        `📋 ${row.source}`,
        `📅 ${row.registeredAt}`
      ]
    });
  }

  closeSharePreview(): void {
    this.sharePayload.set(null);
  }

  private getSourceLabelKey(source: string): string {
    const map: Record<string, string> = {
      wizard: 'registrations.source.wizard',
      admin: 'registrations.source.admin',
      excel: 'registrations.source.excel'
    };
    return map[source] ?? source;
  }
}
