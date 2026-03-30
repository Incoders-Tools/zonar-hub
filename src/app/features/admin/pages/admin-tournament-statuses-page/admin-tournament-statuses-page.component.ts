import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { TournamentStatus } from '../../../../core/models';
import { TournamentStatusesFacadeService, TournamentStatusFilters } from './tournament-statuses-facade.service';
import { TournamentStatusesFormDialogComponent } from './tournament-statuses-form-dialog/tournament-statuses-form-dialog.component';
import { TournamentStatusesHelpDialogComponent } from './tournament-statuses-help-dialog/tournament-statuses-help-dialog.component';

interface TournamentStatusRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  statusLabel: string;
}

@Component({
  selector: 'app-admin-tournament-statuses-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    TournamentStatusesFormDialogComponent,
    TournamentStatusesHelpDialogComponent
  ],
  providers: [TournamentStatusesFacadeService],
  templateUrl: './admin-tournament-statuses-page.component.html',
  styleUrl: './admin-tournament-statuses-page.component.scss'
})
export class AdminTournamentStatusesPageComponent implements OnInit {
  readonly facade = inject(TournamentStatusesFacadeService);

  readonly showFormDialog = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly showHelpDialog = signal(false);
  readonly editingStatus = signal<TournamentStatus | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedStatuses = signal<TournamentStatusRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.tournament-statuses.column.name', sortable: true },
    { key: 'key', labelKey: 'admin.tournament-statuses.column.key', sortable: true },
    { key: 'description', labelKey: 'admin.tournament-statuses.column.description', sortable: false },
    { key: 'sortOrder', labelKey: 'admin.tournament-statuses.column.sortOrder', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.tournament-statuses.column.status', sortable: true }
  ];

  readonly statusRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.tournament-statuses.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.tournament-statuses.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.tournament-statuses.status.active' },
        { value: 'false', labelKey: 'admin.tournament-statuses.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<TournamentStatusRow[]>(() =>
    this.facade.filteredStatuses().map(s => ({
      id: s.id,
      name: s.name,
      key: s.key,
      description: s.description,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      statusLabel: s.isActive ? 'admin.tournament-statuses.status.active' : 'admin.tournament-statuses.status.inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedStatuses().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: TournamentStatusFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: TournamentStatusRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingStatus.set(null);
    this.showFormDialog.set(true);
  }

  openEdit(row: TournamentStatusRow): void {
    const status = this.facade.filteredStatuses().find(s => s.id === row.id);
    if (status) {
      this.editingStatus.set(status);
      this.showFormDialog.set(true);
    }
  }

  closeFormDialog(): void {
    this.showFormDialog.set(false);
    this.editingStatus.set(null);
  }

  confirmDelete(row: TournamentStatusRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteStatus(id);
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

  onSelectionChanged(rows: TournamentStatusRow[]): void {
    this.selectedStatuses.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedStatuses().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedStatuses.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  openHelp(): void {
    this.showHelpDialog.set(true);
  }

  closeHelp(): void {
    this.showHelpDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }
}
