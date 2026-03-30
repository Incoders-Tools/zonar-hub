import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { Role, isSystemRole } from '../../../../core/models';
import { RoleFacadeService, RoleFilters } from './role-facade.service';
import { RolesFormDialogComponent } from './roles-form-dialog/roles-form-dialog.component';
import { RolesHelpDialogComponent } from './roles-help-dialog/roles-help-dialog.component';

interface RoleRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  statusLabel: string;
  isSystem: boolean;
}

@Component({
  selector: 'app-admin-roles-page',
  standalone: true,
  imports: [
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    RolesFormDialogComponent,
    RolesHelpDialogComponent
  ],
  providers: [RoleFacadeService],
  templateUrl: './admin-roles-page.component.html',
  styleUrl: './admin-roles-page.component.scss'
})
export class AdminRolesPageComponent implements OnInit {
  readonly facade = inject(RoleFacadeService);

  readonly showFormDialog = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly showHelpDialog = signal(false);
  readonly editingRole = signal<Role | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedRoles = signal<RoleRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.roles.column.name', sortable: true },
    { key: 'description', labelKey: 'admin.roles.column.description', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.roles.column.status', sortable: true }
  ];

  readonly roleRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.roles.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.roles.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.roles.status.active' },
        { value: 'false', labelKey: 'admin.roles.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<RoleRow[]>(() =>
    this.facade.filteredRoles().map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isSystem: isSystemRole(role.name),
      statusLabel: role.isActive ? 'admin.roles.status.active' : 'admin.roles.status.inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedRoles().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: RoleFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onSelectionChanged(rows: RoleRow[]): void {
    this.selectedRoles.set(rows);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.sort(event.key, event.direction);
  }

  onRowActionClicked(event: { action: string; row: RoleRow }): void {
    if (event.action === 'edit') {
      this.openEditForm(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreateForm(): void {
    this.editingRole.set(null);
    this.showFormDialog.set(true);
  }

  openEditForm(row: RoleRow): void {
    const role = this.facade.roles().find(r => r.id === row.id);
    if (role && !isSystemRole(role.name)) {
      this.editingRole.set(role);
      this.showFormDialog.set(true);
    }
  }

  closeFormDialog(): void {
    this.showFormDialog.set(false);
    this.editingRole.set(null);
  }

  openBulkDelete(): void {
    this.showBulkDeleteDialog.set(true);
  }

  confirmDelete(row: RoleRow): void {
    if (!isSystemRole(row.name)) {
      this.deletingId.set(row.id);
      this.showDeleteDialog.set(true);
    }
  }

  executeDelete(): void {
    const id = this.deletingId();
    if (id) {
      this.facade.delete(id);
      this.closeDeleteDialog();
    }
  }

  executeBulkDelete(): void {
    const ids = this.selectedRoles().map(r => r.id);
    this.facade.bulkDelete(ids);
    this.closeBulkDeleteDialog();
  }

  cancelDelete(): void {
    this.closeDeleteDialog();
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  cancelBulkDelete(): void {
    this.closeBulkDeleteDialog();
  }

  closeBulkDeleteDialog(): void {
    this.showBulkDeleteDialog.set(false);
  }

  openHelp(): void {
    this.showHelpDialog.set(true);
  }

  closeHelp(): void {
    this.showHelpDialog.set(false);
  }
}
