import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '../../../../core/models/admin-user.model';
import { Organization } from '../../../../core/models';
import { Tenant } from '../../../../core/models/user.model';
import { ApiAdminUserRepository } from '../../../../core/repositories/api/api-admin-user.repository';
import { ApiOrganizationRepository } from '../../../../core/repositories/api/api-organization.repository';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';

export interface UsersFilters {
  search?: string;
  roleId?: string;
  complexId?: string;
  isActive?: string;
}

@Injectable()
export class UsersFacadeService {
  private readonly repository = inject(ApiAdminUserRepository);
  private readonly organizationRepository = inject(ApiOrganizationRepository);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);

  readonly users = signal<AdminUser[]>([]);
  readonly tenants = signal<Tenant[]>([]);

  constructor() {
    // Reload users whenever the active organisation changes
    effect(() => {
      this.activeOrg.activeOrganizationId(); // reactive dependency
      void this.load();
    });
  }
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  private readonly filters = signal<UsersFilters>({});
  private readonly sortKey = signal<string>('email');
  private readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly filteredUsers = computed(() => {
    const allUsers = this.users();
    const appliedFilters = this.filters();
    const activeOrgId = this.activeOrg.activeOrganizationId();

    let result = allUsers.filter(user => {
      // Non-sysadmin users cannot see sysadmin accounts
      if (!this.auth.isSystemAdmin() && user.role === 'system_admin') {
        return false;
      }

      // Filter by active organization
      if (activeOrgId) {
        const assignedOrganizations = new Set<string>();
        if (user.organizationId) {
          assignedOrganizations.add(user.organizationId);
        }
        for (const id of user.tenantIds ?? []) {
          assignedOrganizations.add(id);
        }

        if (assignedOrganizations.size === 0 || !assignedOrganizations.has(activeOrgId)) {
          return false;
        }
      }

      if (appliedFilters.search) {
        const search = appliedFilters.search.toLowerCase();
        const match = user.email.toLowerCase().includes(search) ||
          user.fullName.toLowerCase().includes(search);
        if (!match) {
          return false;
        }
      }
      if (appliedFilters.roleId && user.roleId !== appliedFilters.roleId) {
        return false;
      }
      if (appliedFilters.complexId !== undefined) {
        const userComplex = user.complexId || 'none';
        if (userComplex !== appliedFilters.complexId) {
          return false;
        }
      }
      if (appliedFilters.isActive !== undefined) {
        const filterValue = appliedFilters.isActive === 'true';
        if (user.isActive !== filterValue) {
          return false;
        }
      }
      return true;
    });

    // Sort
    const key = this.sortKey();
    const dir = this.sortDirection();
    result.sort((a, b) => {
      let aVal: any = a[key as keyof AdminUser];
      let bVal: any = b[key as keyof AdminUser];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
      }
      if (typeof bVal === 'string') {
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  async load(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.repository.getAll();
      const organizations = await this.organizationRepository.getAll();
      this.tenants.set(this.toAssignableTenants(organizations));
      this.users.set(this.withCurrentAuthenticatedUser(data));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  async createUser(data: AdminUserCreatePayload): Promise<boolean> {
    try {
      this.saving.set(true);
      this.error.set(null);
      const newUser = await this.repository.create(data);
      const current = this.users();
      this.users.set([...current, newUser]);
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to create user');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  async updateUser(id: string, data: AdminUserUpdatePayload): Promise<boolean> {
    try {
      this.saving.set(true);
      this.error.set(null);
      const updated = await this.repository.update(id, data);
      const current = this.users();
      const idx = current.findIndex(u => u.id === id);
      if (idx !== -1) {
        current[idx] = updated;
        this.users.set([...current]);
      }
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update user');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.delete(id);
      const current = this.users();
      this.users.set(current.filter(u => u.id !== id));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      this.deleting.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.deleteMany(ids);
      const current = this.users();
      this.users.set(current.filter(u => !ids.includes(u.id)));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete users');
    } finally {
      this.deleting.set(false);
    }
  }

  sort(key: string, direction: 'asc' | 'desc'): void {
    this.sortKey.set(key);
    this.sortDirection.set(direction);
  }

  applyFilters(filters: UsersFilters): void {
    this.filters.set(filters);
  }

  clearFilters(): void {
    this.filters.set({});
  }

  private withCurrentAuthenticatedUser(users: AdminUser[]): AdminUser[] {
    const current = this.auth.currentUser();
    if (!current) {
      return users;
    }

    const roleMeta = this.toRoleMeta(current.role);
    const availableOrganizations = this.tenants();

    const assignedOrgIds = new Set<string>(current.tenantIds ?? []);
    if (current.organizationId) {
      assignedOrgIds.add(current.organizationId);
    }

    const tenantNames = assignedOrgIds.size > 0
      ? availableOrganizations
        .filter(org => assignedOrgIds.has(org.id))
        .map(org => org.name)
      : availableOrganizations.map(org => org.name);

    const fallbackOrgId = current.organizationId ?? this.activeOrg.activeOrganizationId() ?? undefined;
    const fallbackOrgName = this.activeOrg.activeOrganizationName() || undefined;

    const currentAsAdminUser: AdminUser = {
      id: current.id,
      email: current.email,
      fullName: current.fullName,
      phone: current.phone,
      roleId: roleMeta.roleId,
      roleName: roleMeta.roleName,
      role: current.role,
      organizationId: fallbackOrgId,
      organizationName: fallbackOrgName,
      tenantIds: assignedOrgIds.size > 0 ? [...assignedOrgIds] : fallbackOrgId ? [fallbackOrgId] : [],
      tenantNames,
      isActive: current.isActive,
      createdAt: current.createdAt
    };

    const existingIndex = users.findIndex(user => user.id === current.id || user.email === current.email);
    if (existingIndex === -1) {
      return [currentAsAdminUser, ...users];
    }

    const merged = [...users];
    merged[existingIndex] = {
      ...merged[existingIndex],
      ...currentAsAdminUser,
      updatedAt: merged[existingIndex].updatedAt
    };
    return merged;
  }

  private toAssignableTenants(organizations: Organization[]): Tenant[] {
    const user = this.auth.currentUser();
    const active = organizations.filter(org => org.isActive);

    if (!user || user.role === 'system_admin') {
      return active.map(org => this.toTenant(org));
    }

    const knownIds = new Set<string>(user.tenantIds ?? []);
    if (user.tenantId) {
      knownIds.add(user.tenantId);
    }
    if (user.organizationId) {
      knownIds.add(user.organizationId);
    }

    const visible = knownIds.size > 0
      ? active.filter(org => knownIds.has(org.id))
      : active;

    const fromApi = visible.map(org => this.toTenant(org));
    const knownFromSession = (user.tenantIds ?? []).map((id, index) => {
      const knownName = id;
      return {
        id,
        name: knownName,
        key: this.toKey(knownName),
        contactEmail: user.email,
        planId: 'plan-1',
        planType: 'starter',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } satisfies Tenant;
    });

    const merged = new Map<string, Tenant>();
    fromApi.forEach(tenant => merged.set(tenant.id, tenant));
    knownFromSession.forEach(tenant => {
      if (!merged.has(tenant.id)) {
        merged.set(tenant.id, tenant);
      }
    });

    return Array.from(merged.values());
  }

  private toTenant(org: Organization): Tenant {
    return {
      id: org.id,
      name: org.displayName,
      key: this.toKey(org.displayName),
      contactEmail: this.auth.currentUser()?.email ?? '',
      planId: 'plan-1',
      planType: 'starter',
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    };
  }

  private toKey(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  }

  private toRoleMeta(role: string): { roleId: string; roleName: string } {
    switch (role) {
      case 'system_admin':
        return { roleId: 'role001', roleName: 'system_admin' };
      case 'viewer':
        return { roleId: 'role003', roleName: 'viewer' };
      default:
        return { roleId: 'role002', roleName: 'admin' };
    }
  }
}
