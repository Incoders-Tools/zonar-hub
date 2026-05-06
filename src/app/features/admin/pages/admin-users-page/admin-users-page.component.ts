import { Component, inject, signal, OnInit, computed, effect } from '@angular/core';
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
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { ApiPermissionRepository } from '../../../../core/repositories/api/api-permission.repository';
import { PermissionModule, UserOrganizationPermissionAssignment } from '../../../../core/models';
import { DEFAULT_ROLE_PERMISSIONS, SYSTEM_ADMIN_ONLY_TOOLS } from '../../../../core/auth/permissions.model';
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
  private readonly activeOrg = inject(ActiveOrganizationService);
  private readonly permissionRepository = inject(ApiPermissionRepository);
  readonly isSystemAdmin = this.auth.isSystemAdmin;
  readonly canManageOrganizationAssignments = this.auth.isAdmin;

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly selectedUsers = signal<UserRow[]>([]);
  readonly editingUser = signal<AdminUser | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly userTenantIds = signal<Set<string>>(new Set());
  readonly orderedTenantIds = signal<string[]>([]);
  readonly permissionCatalog = signal<PermissionModule[]>([]);
  readonly permissionsByOrganization = signal<Record<string, string[]>>({});
  readonly selectedPermissionOrganizationId = signal<string | null>(null);
  readonly copySourceOrganizationId = signal<string>('');
  readonly loadingPermissionCatalog = signal(false);
  readonly loadingUserPermissions = signal(false);

  readonly selectedOrganizationPermissionTools = computed(() => {
    const organizationId = this.selectedPermissionOrganizationId();
    if (!organizationId) {
      return [];
    }

    return this.permissionsByOrganization()[organizationId] ?? [];
  });

  readonly selectedTenantItems = computed(() => {
    const selected = this.userTenantIds();
    const order = this.orderedTenantIds();
    const orderIndex = new Map(order.map((id, index) => [id, index]));

    return this.tenantItems()
      .filter(tenant => selected.has(tenant.id))
      .sort((left, right) => {
        const leftIndex = orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
        const rightIndex = orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
        return leftIndex - rightIndex;
      });
  });

  readonly restrictedToolKeys = computed(() => {
    const catalog = this.permissionCatalog();
    if (catalog.length === 0) {
      return [...SYSTEM_ADMIN_ONLY_TOOLS];
    }

    return catalog
      .flatMap(module => module.tools)
      .filter(tool => tool.isSystemAdminOnly)
      .map(tool => tool.key);
  });

  readonly disabledToolKeys = computed(() => {
    const roleId = this.form?.get('roleId')?.value as string | undefined;
    if (roleId === 'role001') {
      return [];
    }

    return this.restrictedToolKeys();
  });

  readonly canCopyPermissions = computed(() => {
    const source = this.copySourceOrganizationId();
    const target = this.selectedPermissionOrganizationId();
    return !!source && !!target && source !== target;
  });

  readonly hasValidPermissionSelection = computed(() => {
    const organizations = this.selectedTenantItems();
    if (organizations.length === 0) {
      return true;
    }

    const matrix = this.permissionsByOrganization();
    return organizations.every(org => (matrix[org.id]?.length ?? 0) > 0);
  });

  constructor() {
    // Reload data whenever organization changes
    effect(() => {
      this.activeOrg.organizationChanged();
      void this.facade.load();
    });
  }

  readonly tenantColumns: ChildGridColumn[] = [
    { key: 'name', labelKey: 'admin.users.company.name', type: 'display' },
    { key: 'contactEmail', labelKey: 'admin.users.company.email', type: 'display' }
  ];

  readonly tenantItems = computed(() => {
    return this.facade.tenants().filter(t => t.isActive);
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
          { value: 'role003', labelKey: 'admin.users.role.viewer' },
          { value: 'role004', labelKey: 'admin.users.role.editor' }
        ]
      : [
          { value: 'role002', labelKey: 'admin.users.role.admin' },
          { value: 'role003', labelKey: 'admin.users.role.viewer' },
          { value: 'role004', labelKey: 'admin.users.role.editor' }
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
      'admin.users.help.roleEditor',
      'admin.users.help.roleViewer'
    ]}
  ];

  ngOnInit(): void {
    this.initializeForm();
    void this.loadPermissionCatalog();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required]],
      phone: [''],
      roleId: ['role002', [Validators.required]],
      isActive: [true]
    });

    this.form.get('roleId')?.valueChanges.subscribe(() => {
      this.applyRoleRestrictionsToPermissions();
      this.syncPermissionOrganizations(Array.from(this.userTenantIds()));
    });
  }

  private async populateForm(): Promise<void> {
    const user = this.editingUser();
    if (user) {
      this.isEditing = true;
      this.form.patchValue({
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || '',
        roleId: user.roleId || 'role002',
        isActive: user.isActive
      });
      this.form.get('email')?.disable();

      // Load company assignment
      if (user.tenantIds?.length) {
        this.userTenantIds.set(new Set(user.tenantIds));
        this.orderedTenantIds.set([...user.tenantIds]);
      } else if (user.complexId) {
        this.userTenantIds.set(new Set([user.complexId]));
        this.orderedTenantIds.set([user.complexId]);
      } else {
        this.userTenantIds.set(new Set());
        this.orderedTenantIds.set([]);
      }

      await this.loadUserPermissions(user.id);
    } else {
      this.isEditing = false;
      this.form.reset({ email: '', fullName: '', phone: '', roleId: 'role002', isActive: true });
      this.form.get('email')?.enable();
      this.userTenantIds.set(new Set());
      this.orderedTenantIds.set([]);
      this.permissionsByOrganization.set({});
      this.selectedPermissionOrganizationId.set(null);
      this.copySourceOrganizationId.set('');
    }

    this.syncPermissionOrganizations(Array.from(this.userTenantIds()));
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
    void this.populateForm();
  }

  openEditForm(row: UserRow): void {
    const user = this.facade.users().find(u => u.id === row.id);
    if (user) {
      this.editingUser.set(user);
      this.showFormPanel.set(true);
      void this.populateForm();
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingUser.set(null);
    this.submitted = false;
  }

  async onFormSave(): Promise<void> {
    this.submitted = true;
    if (!this.form.valid || !this.hasValidPermissionSelection()) return;

    const formValue = this.form.getRawValue();

    // Resolve tenant assignment
    const tenantIds = Array.from(this.userTenantIds());
    const orderedIds = this.orderedTenantIds();
    const primaryOrganizationId = orderedIds.find(id => tenantIds.includes(id)) ?? tenantIds[0];
    const allTenants = this.facade.tenants();
    const tenantNames = tenantIds
      .map(id => allTenants.find(t => t.id === id)?.name)
      .filter((n): n is string => !!n);
    const permissionsByOrganization = this.buildPermissionsPayload(tenantIds);

    if (this.isEditing) {
      const existingUser = this.editingUser();
      if (existingUser) {
        const success = await this.facade.updateUser(existingUser.id, {
          fullName: formValue.fullName,
          phone: formValue.phone || undefined,
          roleId: formValue.roleId || undefined,
          isActive: formValue.isActive,
          organizationId: primaryOrganizationId,
          tenantIds,
          tenantNames,
          permissionsByOrganization
        });
        if (success) {
          if (existingUser.id === this.auth.currentUser()?.id) {
            this.auth.updateCurrentOrganizationAssignments(primaryOrganizationId, tenantIds);
          }
          this.closeFormPanel();
        }
      }
    } else {
      const success = await this.facade.createUser({
        email: formValue.email,
        fullName: formValue.fullName,
        phone: formValue.phone || undefined,
        roleId: formValue.roleId || '',
        organizationId: primaryOrganizationId,
        tenantIds,
        tenantNames,
        permissionsByOrganization
      });
      if (success) {
        this.closeFormPanel();
      }
    }
  }

  onPermissionsChanged(tools: string[]): void {
    const organizationId = this.selectedPermissionOrganizationId();
    if (!organizationId) {
      return;
    }

    this.permissionsByOrganization.update(current => ({
      ...current,
      [organizationId]: this.normalizeToolKeys(tools)
    }));
  }

  onTenantSelectionChanged(ids: Set<string>): void {
    this.userTenantIds.set(ids);
    this.syncPermissionOrganizations(Array.from(ids));
  }

  onTenantOrderChanged(orderedIds: string[]): void {
    this.orderedTenantIds.set(orderedIds);
    this.syncPermissionOrganizations(Array.from(this.userTenantIds()));
  }

  onPermissionOrganizationChanged(organizationId: string): void {
    this.selectedPermissionOrganizationId.set(organizationId || null);
  }

  onCopySourceOrganizationChanged(organizationId: string): void {
    this.copySourceOrganizationId.set(organizationId);
  }

  copyPermissionsFromOrganization(): void {
    if (!this.canCopyPermissions()) {
      return;
    }

    const sourceId = this.copySourceOrganizationId();
    const targetId = this.selectedPermissionOrganizationId();
    if (!sourceId || !targetId) {
      return;
    }

    const matrix = this.permissionsByOrganization();
    const sourceTools = matrix[sourceId] ?? [];

    this.permissionsByOrganization.update(current => ({
      ...current,
      [targetId]: this.normalizeToolKeys(sourceTools)
    }));
  }

  private async loadPermissionCatalog(): Promise<void> {
    this.loadingPermissionCatalog.set(true);
    try {
      const catalog = await this.permissionRepository.getCatalog();
      this.permissionCatalog.set(catalog.modules);
      this.applyRoleRestrictionsToPermissions();
      this.syncPermissionOrganizations(Array.from(this.userTenantIds()));
    } catch {
      this.permissionCatalog.set([]);
    } finally {
      this.loadingPermissionCatalog.set(false);
    }
  }

  private async loadUserPermissions(userId: string): Promise<void> {
    this.loadingUserPermissions.set(true);
    try {
      const response = await this.permissionRepository.getUserPermissions(userId);
      const map = response.permissionsByOrganization.reduce<Record<string, string[]>>((acc, item) => {
        acc[item.organizationId] = this.normalizeToolKeys(item.toolKeys);
        return acc;
      }, {});

      this.permissionsByOrganization.set(map);
    } catch {
      this.permissionsByOrganization.set({});
    } finally {
      this.loadingUserPermissions.set(false);
    }
  }

  private syncPermissionOrganizations(organizationIds: string[]): void {
    const roleId = (this.form?.get('roleId')?.value as string | undefined) ?? 'role002';
    const defaults = this.defaultToolsForRole(roleId);
    const selected = new Set(organizationIds);
    const preferredOrder = this.orderedTenantIds().filter(id => selected.has(id));
    const effectiveOrder = [
      ...preferredOrder,
      ...organizationIds.filter(id => !preferredOrder.includes(id))
    ];

    const next: Record<string, string[]> = {};
    const current = this.permissionsByOrganization();

    for (const organizationId of effectiveOrder) {
      next[organizationId] = this.normalizeToolKeys(current[organizationId] ?? defaults);
    }

    this.permissionsByOrganization.set(next);

    const activePermissionOrg = this.selectedPermissionOrganizationId();
    if (!activePermissionOrg || !selected.has(activePermissionOrg)) {
      this.selectedPermissionOrganizationId.set(effectiveOrder[0] ?? null);
    }

    const source = this.copySourceOrganizationId();
    if (source && !selected.has(source)) {
      this.copySourceOrganizationId.set('');
    }
  }

  private applyRoleRestrictionsToPermissions(): void {
    const roleId = (this.form?.get('roleId')?.value as string | undefined) ?? 'role002';
    if (roleId === 'role001') {
      return;
    }

    const restricted = new Set(this.restrictedToolKeys());
    this.permissionsByOrganization.update(current => {
      const next: Record<string, string[]> = {};
      for (const [organizationId, tools] of Object.entries(current)) {
        next[organizationId] = tools.filter(tool => !restricted.has(tool));
      }
      return next;
    });
  }

  private buildPermissionsPayload(organizationIds: string[]): UserOrganizationPermissionAssignment[] {
    const matrix = this.permissionsByOrganization();
    return organizationIds.map(organizationId => ({
      organizationId,
      toolKeys: this.normalizeToolKeys(matrix[organizationId] ?? this.defaultToolsForRole(this.form.get('roleId')?.value || 'role002'))
    }));
  }

  private normalizeToolKeys(toolKeys: string[]): string[] {
    const roleId = (this.form?.get('roleId')?.value as string | undefined) ?? 'role002';
    const restricted = new Set(this.restrictedToolKeys());
    const normalized = [...new Set(toolKeys.map(tool => tool.trim()).filter(Boolean))];

    if (roleId === 'role001') {
      return normalized;
    }

    return normalized.filter(tool => !restricted.has(tool));
  }

  private defaultToolsForRole(roleId: string): string[] {
    const roleKey = this.toRoleName(roleId);
    return this.normalizeToolKeys([...(DEFAULT_ROLE_PERMISSIONS[roleKey] ?? [])]);
  }

  private toRoleName(roleId: string): string {
    switch (roleId) {
      case 'role001':
        return 'system_admin';
      case 'role003':
        return 'viewer';
      case 'role004':
        return 'editor';
      case 'role005':
        return 'user';
      case 'role006':
        return 'player';
      default:
        return 'admin';
    }
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
