import { Component, inject, signal, OnInit, computed, ElementRef, viewChild, effect } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField, SortOption, SortRule } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { PlayerFacadeService, PlayerFilters } from './player-facade.service';
import { PlayerFormPanelComponent } from './player-form-panel/player-form-panel.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { Player } from '../../../../core/models';

export type AdminPlayersTab = 'list' | 'importer' | 'agent';

interface PlayerRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  categoryName: string;
  genderLabel: string;
  sportName: string;
  ranking: number | undefined;
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
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    PlayerFormPanelComponent,
    HelpButtonComponent
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
export class AdminPlayersPageComponent implements OnInit {
  readonly facade = inject(PlayerFacadeService);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly tournamentService = inject(TournamentService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  constructor() {
    // Reload data whenever organization changes
    effect(() => {
      this.activeOrg.organizationChanged();
      void this.facade.load();
    });
  }

  // Tabs
  readonly activeTab = signal<AdminPlayersTab>('list');

  // Importer state
  readonly importerFile = signal<File | null>(null);
  readonly importerFileName = signal('');
  readonly importerImporting = signal(false);
  readonly importerPreview = signal<Record<string, unknown>[]>([]);
  readonly importerDone = signal(false);
  readonly importerTournamentId = signal('');
  readonly importerError = signal('');

  readonly tournamentOptions = computed(() =>
    this.tournamentService.tournaments().map(t => ({ value: t.id, label: t.name }))
  );

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingPlayer = signal<Player | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedPlayers = signal<PlayerRow[]>([]);
  readonly formPanelRef = viewChild<ElementRef>('formPanel');

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.players.column.name', sortable: true },
    { key: 'email', labelKey: 'admin.players.column.email', sortable: true },
    { key: 'categoryName', labelKey: 'admin.players.column.category', sortable: true },
    { key: 'genderLabel', labelKey: 'admin.players.column.gender', sortable: true },
    { key: 'sportName', labelKey: 'admin.players.column.sport', sortable: true },
    { key: 'birthDate', labelKey: 'admin.players.column.birthDate', sortable: true, renderType: 'date' },
    { key: 'ranking', labelKey: 'admin.players.column.ranking', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.players.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly playerRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields = computed<FilterField[]>(() => {
    const genderOptions = this.facade.genders()
      .filter(g => g.isActive)
      .map(g => ({ value: g.id, labelKey: g.name }));
    const categoryOptions = this.facade.categories()
      .filter(c => c.isActive)
      .map(c => ({ value: c.id, labelKey: c.name }));
    const sportOptions = this.facade.sports()
      .filter(s => s.isActive)
      .map(s => ({ value: s.id, labelKey: s.name }));

    return [
      { key: 'search', labelKey: 'admin.players.filter.search', type: 'text' as const },
      {
        key: 'genderId', labelKey: 'admin.players.filter.gender', type: 'select' as const,
        options: genderOptions
      },
      {
        key: 'categoryId', labelKey: 'admin.players.filter.category', type: 'select' as const,
        options: categoryOptions
      },
      {
        key: 'sportId', labelKey: 'admin.players.filter.sport', type: 'select' as const,
        options: sportOptions
      },
      {
        key: 'isActive', labelKey: 'admin.players.filter.status', type: 'select' as const,
        options: [
          { value: 'true', labelKey: 'admin.players.status.active' },
          { value: 'false', labelKey: 'admin.players.status.inactive' }
        ]
      }
    ];
  });

  readonly tableData = computed<PlayerRow[]>(() =>
    this.facade.filteredPlayers().map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      categoryName: p.categoryName,
      genderLabel: p.genderLabel,
      sportName: p.sportName ?? '',
      ranking: p.ranking,
      isActive: p.isActive,
      statusLabel: p.isActive ? 'admin.players.status.active' : 'admin.players.status.inactive',
      statusVariant: p.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedPlayers().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.players.help.whatTitle', contentKey: 'admin.players.help.whatDescription' },
    { titleKey: 'admin.players.help.fieldsTitle', contentKey: 'admin.players.help.fieldsDescription' },
    { titleKey: 'admin.players.help.managementTitle', contentKey: 'admin.players.help.managementDescription' }
  ];

  readonly sortFields: SortOption[] = [
    { key: 'lastName', labelKey: 'admin.players.column.name' },
    { key: 'email', labelKey: 'admin.players.column.email' },
    { key: 'categoryName', labelKey: 'admin.players.column.category' },
    { key: 'ranking', labelKey: 'admin.players.column.ranking' }
  ];

  readonly defaultSortRules: SortRule[] = [
    { field: 'lastName', dir: 'asc' }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: PlayerFilters = {
      search: filters['search'] || undefined,
      genderId: filters['genderId'] || undefined,
      categoryId: filters['categoryId'] || undefined,
      sportId: filters['sportId'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: PlayerRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingPlayer.set(null);
    this.showFormPanel.set(true);
    this.scrollToFormPanel();
  }

  openEdit(row: PlayerRow): void {
    const player = this.facade.filteredPlayers().find(p => p.id === row.id);
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

  confirmDelete(row: PlayerRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deletePlayer(id);
      if (success) {
        this.showDeleteDialog.set(false);
        this.deletingId.set(null);
      }
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  onSelectionChanged(rows: PlayerRow[]): void {
    this.selectedPlayers.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedPlayers().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedPlayers.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }

  onSortRulesChanged(rules: SortRule[]): void {
    this.facade.applySortRules(rules);
  }

  getStatusForRow(row: PlayerRow): string {
    return row.isActive ? 'active' : 'inactive';
  }

  setTab(tab: AdminPlayersTab): void {
    this.activeTab.set(tab);
  }

  // ---- Importer ----

  onImporterFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.importerFile.set(file);
    this.importerFileName.set(file?.name ?? '');
    this.importerError.set('');
    this.importerDone.set(false);
    this.importerPreview.set([]);
    if (file) {
      // Simulate parsing: show a placeholder preview
      this.importerPreview.set([
        { firstName: 'Ana', lastName: 'García', email: 'ana@example.com', phone: '+54911000001', sport: 'Pádel', category: 'A', gender: 'Femenino' },
        { firstName: 'Carlos', lastName: 'López', email: 'carlos@example.com', phone: '+54911000002', sport: 'Pádel', category: 'B', gender: 'Masculino' }
      ]);
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
    if (!this.importerFile() || this.importerImporting()) return;
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
    this.importerPreview.set([]);
    this.importerDone.set(false);
    this.importerError.set('');
  }
}
