import { Component, inject, signal, OnInit, computed, ElementRef, viewChild, effect } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField, SortOption, SortRule } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { TeamFacadeService, TeamFilters } from './team-facade.service';
import { TeamFormPanelComponent } from './team-form-panel/team-form-panel.component';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { Team } from '../../../../core/models';

interface TeamRow extends Record<string, unknown> {
  id: string;
  name: string;
  sportName: string;
  categoryName: string;
  playerCount: number;
  captainName: string;
  statusLabel: string;
  statusVariant: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-teams-page',
  standalone: true,
  imports: [
    TranslatePipe,
    MatIcon,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    TeamFormPanelComponent,
    HelpButtonComponent
  ],
  providers: [TeamFacadeService],
  templateUrl: './admin-teams-page.component.html',
  styleUrl: './admin-teams-page.component.scss',
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
export class AdminTeamsPageComponent implements OnInit {
  readonly facade = inject(TeamFacadeService);
  private readonly activeOrg = inject(ActiveOrganizationService);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingTeam = signal<Team | null>(null);
  readonly deletingId = signal<string | null>(null);

  constructor() {
    // Reload data and reset transient UI whenever the active organization changes
    effect(() => {
      this.activeOrg.organizationChanged();
      this.showFormPanel.set(false);
      this.showDeleteDialog.set(false);
      this.showBulkDeleteDialog.set(false);
      this.editingTeam.set(null);
      this.deletingId.set(null);
      void this.facade.load();
    });
  }
  readonly selectedTeams = signal<TeamRow[]>([]);
  readonly formPanelRef = viewChild<ElementRef>('formPanel');

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.teams.column.name', sortable: true },
    { key: 'sportName', labelKey: 'admin.teams.column.sport', sortable: true },
    { key: 'categoryName', labelKey: 'admin.teams.column.category', sortable: true },
    { key: 'playerCount', labelKey: 'admin.teams.column.players', sortable: false },
    { key: 'captainName', labelKey: 'admin.teams.column.captain', sortable: false },
    { key: 'statusLabel', labelKey: 'admin.teams.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly teamRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields = computed<FilterField[]>(() => {
    const sportOptions = this.facade.sports()
      .filter(s => s.isActive)
      .map(s => ({ value: s.id, labelKey: s.name }));
    const categoryOptions = this.facade.categories()
      .filter(c => c.isActive)
      .map(c => ({ value: c.id, labelKey: c.name }));

    return [
      { key: 'search', labelKey: 'admin.teams.filter.search', type: 'text' as const },
      { key: 'sportId', labelKey: 'admin.teams.filter.sport', type: 'select' as const, options: sportOptions },
      { key: 'categoryId', labelKey: 'admin.teams.filter.category', type: 'select' as const, options: categoryOptions },
      {
        key: 'isActive', labelKey: 'admin.teams.filter.status', type: 'select' as const,
        options: [
          { value: 'true', labelKey: 'admin.teams.status.active' },
          { value: 'false', labelKey: 'admin.teams.status.inactive' }
        ]
      }
    ];
  });

  readonly tableData = computed<TeamRow[]>(() =>
    this.facade.filteredTeams().map(t => ({
      id: t.id,
      name: t.name,
      sportName: t.sportName,
      categoryName: t.categoryName ?? '—',
      playerCount: t.players.length,
      captainName: t.captainName ?? '—',
      isActive: t.isActive,
      statusLabel: t.isActive ? 'admin.teams.status.active' : 'admin.teams.status.inactive',
      statusVariant: t.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedTeams().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.teams.help.whatTitle', contentKey: 'admin.teams.help.whatDescription' },
    { titleKey: 'admin.teams.help.fieldsTitle', contentKey: 'admin.teams.help.fieldsDescription' },
    { titleKey: 'admin.teams.help.managementTitle', contentKey: 'admin.teams.help.managementDescription' }
  ];

  readonly sortFields: SortOption[] = [
    { key: 'name', labelKey: 'admin.teams.column.name' },
    { key: 'sportName', labelKey: 'admin.teams.column.sport' },
    { key: 'categoryName', labelKey: 'admin.teams.column.category' }
  ];

  readonly defaultSortRules: SortRule[] = [
    { field: 'name', dir: 'asc' }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: TeamFilters = {
      search: filters['search'] || undefined,
      sportId: filters['sportId'] || undefined,
      categoryId: filters['categoryId'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: TeamRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingTeam.set(null);
    this.showFormPanel.set(true);
    this.scrollToFormPanel();
  }

  openEdit(row: TeamRow): void {
    const team = this.facade.filteredTeams().find(t => t.id === row.id);
    if (team) {
      this.editingTeam.set(team);
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
    this.editingTeam.set(null);
  }

  confirmDelete(row: TeamRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteTeam(id);
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

  onSelectionChanged(rows: TeamRow[]): void {
    this.selectedTeams.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedTeams().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedTeams.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSortRulesChanged(rules: SortRule[]): void {
    this.facade.applySortRules(rules);
  }
}
