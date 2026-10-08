import { Injectable, inject, signal, effect, untracked } from '@angular/core';
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
  isActive?: string;
}

const USERS_PAGE_SIZE = 20;

/**
 * Server-paged Users list in the active organization scope. The API decides
 * visibility (including unassigned users): pages are rendered as returned,
 * with no client filtering, sorting or self-injection.
 */
@Injectable()
export class UsersFacadeService {
  private readonly repository = inject(ApiAdminUserRepository);
  private readonly organizationRepository = inject(ApiOrganizationRepository);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);

  readonly pageSize = USERS_PAGE_SIZE;

  /** Items of the current server page. */
  readonly users = signal<AdminUser[]>([]);
  readonly tenants = signal<Tenant[]>([]);
  readonly page = signal(1);
  /** Server count of every user matching the scope and filters. */
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  private readonly filters = signal<UsersFilters>({});

  // Monotonic id of the latest load; older responses are ignored when superseded
  private loadRequestId = 0;
  private loadedOrganizationId: string | null | undefined;

  constructor() {
    // Organizations are read once; paging and filtering never re-read them
    void this.loadOrganizations();

    // Single owner of reloads: once on init and once per active organisation change
    effect(() => {
      this.activeOrg.activeOrganizationId(); // reactive dependency
      untracked(() => {
        this.page.set(1);
        void this.load();
      });
    });
  }

  async load(): Promise<void> {
    const requestId = ++this.loadRequestId;
    const organizationId = this.activeOrg.activeOrganizationId();
    if (organizationId !== this.loadedOrganizationId) {
      // Never show the previous organisation's users while the new one loads
      this.users.set([]);
      this.totalCount.set(0);
      this.loadedOrganizationId = organizationId;
    }

    if (!organizationId) {
      // Without an active organization there is no scope to list; never widen to `all`
      this.loading.set(false);
      this.error.set(null);
      return;
    }

    const filters = this.filters();
    try {
      this.loading.set(true);
      this.error.set(null);
      const result = await this.repository.getPage({
        scope: { kind: 'organization', organizationId },
        page: this.page(),
        pageSize: this.pageSize,
        search: filters.search,
        roleId: filters.roleId,
        isActive: filters.isActive === undefined ? undefined : filters.isActive === 'true'
      });
      if (requestId !== this.loadRequestId) return;
      this.users.set(result.items);
      this.totalCount.set(result.totalCount);
    } catch (err) {
      if (requestId !== this.loadRequestId) return;
      this.error.set(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      if (requestId === this.loadRequestId) {
        this.loading.set(false);
      }
    }
  }

  goToPage(page: number): void {
    if (!Number.isInteger(page) || page < 1) return;
    this.page.set(page);
    void this.load();
  }

  applyFilters(filters: UsersFilters): void {
    this.filters.set(filters);
    this.page.set(1);
    void this.load();
  }

  clearFilters(): void {
    this.applyFilters({});
  }

  async createUser(data: AdminUserCreatePayload): Promise<boolean> {
    try {
      this.saving.set(true);
      this.error.set(null);
      await this.repository.create(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to create user');
      return false;
    } finally {
      this.saving.set(false);
    }
    await this.load();
    return true;
  }

  async updateUser(id: string, data: AdminUserUpdatePayload): Promise<boolean> {
    try {
      this.saving.set(true);
      this.error.set(null);
      await this.repository.update(id, data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update user');
      return false;
    } finally {
      this.saving.set(false);
    }
    await this.load();
    return true;
  }

  async deleteUser(id: string): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.delete(id);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete user');
      return;
    } finally {
      this.deleting.set(false);
    }
    this.clampPageAfterRemoval(1);
    await this.load();
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.deleteMany(ids);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete users');
      return;
    } finally {
      this.deleting.set(false);
    }
    this.clampPageAfterRemoval(ids.length);
    await this.load();
  }

  /** Moves back to the new last page when removals empty the current one. */
  private clampPageAfterRemoval(removed: number): void {
    const remaining = Math.max(0, this.totalCount() - removed);
    const lastPage = Math.max(1, Math.ceil(remaining / this.pageSize));
    if (this.page() > lastPage) {
      this.page.set(lastPage);
    }
  }

  private async loadOrganizations(): Promise<void> {
    try {
      const organizations = await this.organizationRepository.getAll();
      this.tenants.set(this.toAssignableTenants(organizations));
    } catch {
      // Assignment options stay empty; the users list remains usable
      this.tenants.set([]);
    }
  }

  private toAssignableTenants(organizations: Organization[]): Tenant[] {
    const user = this.auth.currentUser();
    const active = organizations.filter(org => org.isActive);

    if (!user || user.role === 'system_admin') {
      return active.map(org => this.toTenant(org));
    }

    const assignedIds = new Set(user.tenantIds ?? []);
    if (user.organizationId) {
      assignedIds.add(user.organizationId);
    }

    if (assignedIds.size === 0) {
      return [];
    }

    return active
      .filter(org => assignedIds.has(org.id))
      .map(org => this.toTenant(org));
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
}
