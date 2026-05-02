import { Component, inject, computed, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { Sport } from '../../../../core/models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { SportsFacadeService, SportFilters } from './sports-facade.service';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { SportsFormPanelComponent } from './sports-form-panel/sports-form-panel.component';

interface SportRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-sports-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    HelpButtonComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    SportsFormPanelComponent
  ],
  providers: [SportsFacadeService],
  templateUrl: './admin-sports-page.component.html',
  styleUrl: './admin-sports-page.component.scss'
})
export class AdminSportsPageComponent implements OnInit {
  readonly facade = inject(SportsFacadeService);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly editingSport = signal<Sport | null>(null);
  readonly deletingId = signal<string | null>(null);

  constructor() {
    // Reload data whenever organization changes
    effect(() => {
      this.activeOrg.organizationChanged();
      void this.facade.load();
    });
  }

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'name', labelKey: 'admin.sports.column.name', sortable: true },
      { key: 'key', labelKey: 'admin.sports.column.key', sortable: true },
      { key: 'icon', labelKey: 'admin.sports.column.icon', sortable: false },
      { key: 'sortOrder', labelKey: 'admin.sports.column.sortOrder', sortable: true },
      { key: 'isActive', labelKey: 'admin.sports.column.status', sortable: true, renderType: 'toggle', toggleAction: 'toggleActive' }
    ];
    return base;
  });

  readonly sportRowActions = computed(() => {
    if (!this.isSystemAdmin()) {
      return [];
    }

    return [
      { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
      { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
    ];
  });

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.sports.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.sports.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.sports.status.active' },
        { value: 'false', labelKey: 'admin.sports.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<SportRow[]>(() =>
    this.facade.filteredSports().map(s => ({
      id: s.id,
      name: s.name,
      key: s.key,
      icon: s.icon,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      statusLabel: s.isActive ? 'admin.sports.status.active' : 'admin.sports.status.inactive',
      statusVariant: s.isActive ? 'active' : 'inactive'
    }))
  );

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.sports.help.section1Title', contentKey: 'admin.sports.help.section1Text' },
    { titleKey: 'admin.sports.help.section2Title', contentKey: 'admin.sports.help.section2Text' },
    { titleKey: 'admin.sports.help.section3Title', items: [
      'admin.sports.help.section3Item1',
      'admin.sports.help.section3Item2',
      'admin.sports.help.section3Item3'
    ] }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: SportFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: SportRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    } else if (event.action === 'toggleActive') {
      this.toggleSportActive(event.row);
    }
  }

  openCreate(): void {
    this.editingSport.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: SportRow): void {
    const sport = this.facade.filteredSports().find(s => s.id === row.id);
    if (sport) {
      this.editingSport.set(sport);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingSport.set(null);
  }

  async toggleSportActive(row: SportRow): Promise<void> {
    const sport = this.facade.filteredSports().find(s => s.id === row.id);
    if (sport) {
      await this.facade.saveSport({ ...sport, isActive: !sport.isActive });
    }
  }

  confirmDelete(row: SportRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (!id) {
      return;
    }

    const success = await this.facade.deleteSport(id);
    if (success) {
      this.cancelDelete();
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }
}
