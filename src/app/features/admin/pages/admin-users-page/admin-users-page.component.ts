import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { ActiveToggleComponent } from '../../../../shared/components/active-toggle/active-toggle.component';
import { PermissionMatrixComponent } from '../../../../shared/components/permission-matrix/permission-matrix.component';
import { ChildCollectionGridComponent, ChildGridColumn } from '../../../../shared/components/child-collection-grid/child-collection-grid.component';
import { CollapsibleSectionComponent } from '../../../../shared/components/collapsible-section/collapsible-section.component';
import { AdminUser } from '../../../../core/models/admin-user.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { DEFAULT_ROLE_PERMISSIONS } from '../../../../core/auth/permissions.model';
import { UsersFacadeService, UsersFilters } from './users-facade.service';

interface UserRow extends Record<string, unknown> {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName?: string;
  role?: string;
  complexName?: string;
  organizations?: string;
  isActive: boolean;
  status: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    HelpButtonComponent,
    PhoneInputComponent,
    ActiveToggleComponent,
    PermissionMatrixComponent,
    ChildCollectionGridComponent,
    CollapsibleSectionComponent
  ],
  providers: [UsersFacadeService],
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss',
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
export class AdminUsersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly facade = inject(UsersFacadeService);
  private readonly auth = inject(AuthService);
  private readonly permissions = inject(PermissionService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly selectedUsers = signal<UserRow[]>([]);
  readonly editingUser = signal<AdminUser | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly userPermissions = signal<string[]>([]);
  readonly userTenantIds = signal<Set<string>>(new Set());
  readonly orderedTenantIds = signal<string[]>([]);

  readonly tenantColumns: ChildGridColumn[] = [
    { key: 'name', labelKey: 'admin.users.company.name', type: 'display' },
    { key: 'contactEmail', labelKey: 'admin.users.company.email', type: 'display' }
  ];

  readonly tenantItems = computed(() => {
    const all = this.facade.tenants().filter(t => t.isActive);
    const user = this.auth.currentUser();
    // Admins only see their assigned tenants
    if (user && user.role !== 'system_admin' && user.tenantIds?.length) {
      const allowed = new Set(user.tenantIds);
      return all.filter(t => allowed.has(t.id));
    }
    if (user && user.role !== 'system_admin' && user.tenantId) {
      return all.filter(t => t.id === user.tenantId);
    }
    return all;
  });

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  readonly columns: DataTableColumn[] = [
    { key: 'email', labelKey: 'admin.users.column.email', sortable: true },
    { key: 'fullName', labelKey: 'admin.users.column.name', sortable: true },
    { key: 'roleName', labelKey: 'admin.users.column.role', sortable: true },
    { key: 'organizations', labelKey: 'admin.users.column.organizations', sortable: false },
    { key: 'status', labelKey: 'admin.users.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly rowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly userRowActionsFilter = (row: UserRow) => {
    // Non-sysadmin users cannot edit or delete sysadmin accounts
    if (!this.isSystemAdmin() && row.role === 'system_admin') {
      return [];
    }
    return this.rowActions;
  };

  readonly filterFields = computed<FilterField[]>(() => {
    const roleOptions = this.isSystemAdmin()
      ? [
          { value: 'role001', labelKey: 'admin.users.role.systemAdmin' },
          { value: 'role002', labelKey: 'admin.users.role.admin' },
          { value: 'role003', labelKey: 'admin.users.role.viewer' }
        ]
      : [
          { value: 'role002', labelKey: 'admin.users.role.admin' },
          { value: 'role003', labelKey: 'admin.users.role.viewer' }
        ];
    return [
      { key: 'search', labelKey: 'admin.users.filter.search', type: 'text' as const },
      { key: 'roleId', labelKey: 'admin.users.filter.role', type: 'select' as const, options: roleOptions },
      { key: 'isActive', labelKey: 'admin.users.filter.status', type: 'select' as const,
        options: [
          { value: 'true', labelKey: 'admin.users.status.active' },
          { value: 'false', labelKey: 'admin.users.status.inactive' }
        ]
      }
    ];
  });

  readonly tableData = computed<UserRow[]>(() =>
    this.facade.filteredUsers().map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId || '',
      roleName: user.roleName,
      role: user.role,
      complexName: user.complexName,
      organizations: user.tenantNames?.join(', ') || user.complexName || '',
      isActive: user.isActive,
      status: user.isActive ? 'admin.users.status.active' : 'admin.users.status.inactive',
      statusVariant: user.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedUsers().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.users.help.description' },
    { titleKey: 'admin.users.help.roles', items: [
      'admin.users.help.roleSystemAdmin',
      'admin.users.help.roleAdmin',
      'admin.users.help.roleViewer'
    ]}
  ];

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required]],
      phone: [''],
      roleId: [''],
      isActive: [true]
    });
  }

  private populateForm(): void {
    const user = this.editingUser();
    if (user) {
      this.isEditing = true;
      this.form.patchValue({
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || '',
        roleId: user.roleId || '',
        isActive: user.isActive
      });
      this.form.get('email')?.disable();

      // Load permission overrides or role defaults
      const override = this.permissions.getUserPermissions(user.id);
      if (override) {
        this.userPermissions.set([...override.allowedTools]);
      } else {
        const roleKey = user.role || 'admin';
        this.userPermissions.set([...(DEFAULT_ROLE_PERMISSIONS[roleKey] || [])]);
      }

      // Load company assignment
      if (user.tenantIds?.length) {
        this.userTenantIds.set(new Set(user.tenantIds));
      } else if (user.complexId) {
        this.userTenantIds.set(new Set([user.complexId]));
      } else {
        this.userTenantIds.set(new Set());
      }
    } else {
      this.isEditing = false;
      this.form.reset({ email: '', fullName: '', phone: '', roleId: '', isActive: true });
      this.form.get('email')?.enable();
      this.userPermissions.set([...(DEFAULT_ROLE_PERMISSIONS['admin'] || [])]);
      this.userTenantIds.set(new Set());
    }
    this.submitted = false;
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: UsersFilters = {
      search: filters['search'] || undefined,
      roleId: filters['roleId'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onSelectionChanged(rows: UserRow[]): void {
    this.selectedUsers.set(rows);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.sort(event.key, event.direction);
  }

  onRowActionClicked(event: { action: string; row: UserRow }): void {
    if (event.action === 'edit') {
      this.openEditForm(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreateForm(): void {
    this.editingUser.set(null);
    this.showFormPanel.set(true);
    this.populateForm();
  }

  openEditForm(row: UserRow): void {
    const user = this.facade.users().find(u => u.id === row.id);
    if (user) {
      this.editingUser.set(user);
      this.showFormPanel.set(true);
      this.populateForm();
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingUser.set(null);
    this.submitted = false;
  }

  async onFormSave(): Promise<void> {
    this.submitted = true;
    if (!this.form.valid) return;

    const formValue = this.form.getRawValue();

    // Resolve tenant assignment
    const tenantIds = Array.from(this.userTenantIds());
    const allTenants = this.facade.tenants();
    const tenantNames = tenantIds
      .map(id => allTenants.find(t => t.id === id)?.name)
      .filter((n): n is string => !!n);

    if (this.isEditing) {
      const existingUser = this.editingUser();
      if (existingUser) {
        const success = await this.facade.updateUser(existingUser.id, {
          fullName: formValue.fullName,
          phone: formValue.phone || undefined,
          roleId: formValue.roleId || undefined,
          isActive: formValue.isActive,
          tenantIds,
          tenantNames
        });
        if (success) {
          this.permissions.setUserPermissions(existingUser.id, this.userPermissions());
          this.closeFormPanel();
        }
      }
    } else {
      const success = await this.facade.createUser({
        email: formValue.email,
        fullName: formValue.fullName,
        phone: formValue.phone || undefined,
        roleId: formValue.roleId || ''
      });
      if (success) {
        this.closeFormPanel();
      }
    }
  }

  onPermissionsChanged(tools: string[]): void {
    this.userPermissions.set(tools);
  }

  onTenantSelectionChanged(ids: Set<string>): void {
    this.userTenantIds.set(ids);
  }

  onTenantOrderChanged(orderedIds: string[]): void {
    this.orderedTenantIds.set(orderedIds);
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && !!control?.invalid;
  }

  confirmDelete(row: UserRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  executeDelete(): void {
    const id = this.deletingId();
    if (id) {
      this.facade.deleteUser(id);
      this.closeDeleteDialog();
    }
  }

  cancelDelete(): void {
    this.closeDeleteDialog();
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  openBulkDelete(): void {
    this.showBulkDeleteDialog.set(true);
  }

  executeBulkDelete(): void {
    const ids = this.selectedUsers().map(r => r.id);
    this.facade.bulkDelete(ids);
    this.closeBulkDeleteDialog();
  }

  cancelBulkDelete(): void {
    this.closeBulkDeleteDialog();
  }

  closeBulkDeleteDialog(): void {
    this.showBulkDeleteDialog.set(false);
    this.selectedUsers.set([]);
  }

}
