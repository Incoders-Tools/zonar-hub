import { Injectable, inject, signal, computed } from '@angular/core';
import { Tenant } from '../../../../core/models';
import { MockTenantRepository } from '../../../../core/repositories/mock/mock-tenant.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/auth/auth.service';

export interface TenantFilters {
  name?: string;
  planType?: string;
  isActive?: string;
}

@Injectable()
export class TenantFacadeService {
  private readonly repo = inject(MockTenantRepository);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);

  private readonly tenantsState = signal<Tenant[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly filtersState = signal<TenantFilters>({});
  private readonly sortState = signal<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  readonly tenants = this.tenantsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();

  readonly filteredTenants = computed(() => {
    const all = this.tenantsState();
    const f = this.filtersState();
    const sort = this.sortState();
    let result = [...all];

    if (f.name) {
      const term = f.name.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.key.toLowerCase().includes(term) ||
        t.contactEmail.toLowerCase().includes(term)
      );
    }

    if (f.planType) {
      result = result.filter(t => t.planType === f.planType);
    }

    if (f.isActive === 'true') {
      result = result.filter(t => t.isActive);
    } else if (f.isActive === 'false') {
      result = result.filter(t => !t.isActive);
    }

    const multiplier = sort.direction === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sort.key];
      const bVal = (b as unknown as Record<string, unknown>)[sort.key];
      return String(aVal ?? '').localeCompare(String(bVal ?? '')) * multiplier;
    });

    return result;
  });

  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(false);
    try {
      let data = await this.repo.getAll();
      // Admins only see their assigned tenants
      const user = this.auth.currentUser();
      if (user && user.role !== 'system_admin' && user.tenantIds?.length) {
        const allowed = new Set(user.tenantIds);
        data = data.filter(t => allowed.has(t.id));
      } else if (user && user.role !== 'system_admin' && user.tenantId) {
        data = data.filter(t => t.id === user.tenantId);
      }
      this.tenantsState.set(data);
    } catch {
      this.errorState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: TenantFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  sort(key: string, direction: 'asc' | 'desc'): void {
    this.sortState.set({ key, direction });
  }

  async createTenant(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    this.savingState.set(true);
    try {
      await this.repo.create(data);
      this.notification.success('admin.tenants.toast.created');
      await this.load();
      return true;
    } catch {
      this.notification.error('admin.tenants.toast.createError');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<boolean> {
    this.savingState.set(true);
    try {
      await this.repo.update(id, data);
      this.notification.success('admin.tenants.toast.updated');
      await this.load();
      return true;
    } catch {
      this.notification.error('admin.tenants.toast.updateError');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.deletingState.set(true);
    try {
      await this.repo.delete(id);
      this.notification.success('admin.tenants.toast.deleted');
      await this.load();
    } catch {
      this.notification.error('admin.tenants.toast.deleteError');
    } finally {
      this.deletingState.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.deletingState.set(true);
    try {
      for (const id of ids) {
        await this.repo.delete(id);
      }
      this.notification.success('admin.tenants.toast.bulkDeleted');
      await this.load();
    } catch {
      this.notification.error('admin.tenants.toast.deleteError');
    } finally {
      this.deletingState.set(false);
    }
  }
}
