import { Component, inject, signal, OnInit, computed, ElementRef, viewChild } from '@angular/core';
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
import { Player } from '../../../../core/models';

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
  readonly isSystemAdmin = this.auth.isSystemAdmin;

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
}
