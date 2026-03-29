import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { GenderFacadeService, GenderFilters } from './gender-facade.service';
import { GenderFormDialogComponent } from './gender-form-dialog/gender-form-dialog.component';
import { GenderHelpDialogComponent } from './gender-help-dialog/gender-help-dialog.component';
import { Gender } from '../../../../core/models';

interface GenderRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  sortOrder: number;
  statusLabel: string;
}

@Component({
  selector: 'app-admin-genders-page',
  standalone: true,
  imports: [
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    GenderFormDialogComponent,
    GenderHelpDialogComponent
  ],
  providers: [GenderFacadeService],
  templateUrl: './admin-genders-page.component.html',
  styleUrl: './admin-genders-page.component.scss'
})
export class AdminGendersPageComponent implements OnInit {
  readonly facade = inject(GenderFacadeService);

  readonly showFormDialog = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly showHelpDialog = signal(false);
  readonly editingGender = signal<Gender | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedGenders = signal<GenderRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'genders.column.name', sortable: true },
    { key: 'key', labelKey: 'genders.column.key', sortable: true },
    { key: 'statusLabel', labelKey: 'genders.column.status', sortable: true },
    { key: 'sortOrder', labelKey: 'genders.column.sortOrder', sortable: true }
  ];

  readonly genderRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'genders.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'genders.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'genders.status.active' },
        { value: 'false', labelKey: 'genders.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<GenderRow[]>(() =>
    this.facade.filteredGenders().map(g => ({
      id: g.id,
      name: g.name,
      key: g.key,
      isActive: g.isActive,
      sortOrder: g.sortOrder,
      statusLabel: g.isActive ? 'genders.status.active' : 'genders.status.inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedGenders().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: GenderFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: GenderRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingGender.set(null);
    this.showFormDialog.set(true);
  }

  openEdit(row: GenderRow): void {
    const gender = this.facade.filteredGenders().find(g => g.id === row.id);
    if (gender) {
      this.editingGender.set(gender);
      this.showFormDialog.set(true);
    }
  }

  closeFormDialog(): void {
    this.showFormDialog.set(false);
    this.editingGender.set(null);
  }

  confirmDelete(row: GenderRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteGender(id);
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

  onSelectionChanged(rows: GenderRow[]): void {
    this.selectedGenders.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedGenders().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedGenders.set([]);
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

  getStatusForRow(row: GenderRow): string {
    return row.isActive ? 'active' : 'inactive';
  }
}
