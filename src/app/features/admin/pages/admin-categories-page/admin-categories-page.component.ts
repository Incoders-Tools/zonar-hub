import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { CategoryFacadeService, CategoryFilters } from './category-facade.service';
import { CategoryFormDialogComponent } from './category-form-dialog/category-form-dialog.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { Category } from '../../../../core/models';

interface CategoryRow extends Record<string, unknown> {
  id: string;
  name: string;
  shortName: string;
  key: string;
  level: number;
  isActive: boolean;
  sortOrder: number;
  statusLabel: string;
}

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: [
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    CategoryFormDialogComponent,
    HelpButtonComponent
  ],
  providers: [CategoryFacadeService],
  templateUrl: './admin-categories-page.component.html',
  styleUrl: './admin-categories-page.component.scss'
})
export class AdminCategoriesPageComponent implements OnInit {
  readonly facade = inject(CategoryFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly showFormDialog = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingCategory = signal<Category | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedCategories = signal<CategoryRow[]>([]);

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'shortName', labelKey: 'categories.column.shortName', sortable: true },
      { key: 'name', labelKey: 'categories.column.name', sortable: true },
      { key: 'level', labelKey: 'categories.column.level', sortable: true },
      { key: 'statusLabel', labelKey: 'categories.column.status', sortable: true }
    ];
    if (this.isSystemAdmin()) {
      base.push(
        { key: 'sortOrder', labelKey: 'categories.column.sortOrder', sortable: true }
      );
    }
    return base;
  });

  readonly categoryRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'categories.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'categories.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'categories.status.active' },
        { value: 'false', labelKey: 'categories.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<CategoryRow[]>(() =>
    this.facade.filteredCategories().map(c => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      key: c.key,
      level: c.level,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      statusLabel: c.isActive ? 'categories.status.active' : 'categories.status.inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedCategories().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'categories.help.whatTitle', contentKey: 'categories.help.whatDescription' },
    { titleKey: 'categories.help.impactTitle', contentKey: 'categories.help.impactDescription' },
    { titleKey: 'categories.help.keyTitle', contentKey: 'categories.help.keyDescription' }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: CategoryFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: CategoryRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingCategory.set(null);
    this.showFormDialog.set(true);
  }

  openEdit(row: CategoryRow): void {
    const category = this.facade.filteredCategories().find(c => c.id === row.id);
    if (category) {
      this.editingCategory.set(category);
      this.showFormDialog.set(true);
    }
  }

  closeFormDialog(): void {
    this.showFormDialog.set(false);
    this.editingCategory.set(null);
  }

  confirmDelete(row: CategoryRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteCategory(id);
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

  onSelectionChanged(rows: CategoryRow[]): void {
    this.selectedCategories.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedCategories().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedCategories.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }

  getStatusForRow(row: CategoryRow): string {
    return row.isActive ? 'active' : 'inactive';
  }
}
