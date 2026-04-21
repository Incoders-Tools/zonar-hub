import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { Role, isSystemRole } from '../../../../core/models';
import { AuthService } from '../../../../core/auth/auth.service';
import { RoleFacadeService, RoleFilters } from './role-facade.service';
import { RolesFormComponent } from './roles-form/roles-form.component';

interface RoleRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  statusLabel: string;
  statusVariant: string;
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
    HelpButtonComponent,
    RolesFormComponent
  ],
  providers: [RoleFacadeService],
  templateUrl: './admin-roles-page.component.html',
  styleUrl: './admin-roles-page.component.scss',
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
export class AdminRolesPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly facade = inject(RoleFacadeService);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingRole = signal<Role | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedRoles = signal<RoleRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.roles.column.name', sortable: true },
    { key: 'description', labelKey: 'admin.roles.column.description', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.roles.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly roleRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly roleActionsFilter = (row: RoleRow) => {
    if (row['isSystem'] && !this.auth.isSystemAdmin()) return [];
    return this.roleRowActions;
  };

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
      statusLabel: role.isActive ? 'admin.roles.status.active' : 'admin.roles.status.inactive',
      statusVariant: role.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedRoles().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.roles.help.description' },
    { titleKey: 'admin.roles.help.systemRoles', contentKey: 'admin.roles.help.systemRolesDescription' }
  ];

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
    this.showFormPanel.set(true);
  }

  openEditForm(row: RoleRow): void {
    const role = this.facade.roles().find(r => r.id === row.id);
    if (role && (!isSystemRole(role.name) || this.auth.isSystemAdmin())) {
      this.editingRole.set(role);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingRole.set(null);
  }

  async onFormSubmitted(formData: Partial<Role>): Promise<void> {
    const existingRole = this.editingRole();
    if (existingRole) {
      const success = await this.facade.updateRole(existingRole.id, formData);
      if (success) { this.closeFormPanel(); }
    } else {
      const success = await this.facade.createRole(formData as any);
      if (success) { this.closeFormPanel(); }
    }
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

}
