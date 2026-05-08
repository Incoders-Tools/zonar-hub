import { Injectable, inject, computed, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { FilterField } from '../../shared/components/filter-panel/filter-panel.component';
import { ApiTenantRepository } from '../repositories/api/api-tenant.repository';
import { Tenant } from '../models';

/**
 * Provides a tenant filter field for filter panels.
 *
 * Shows the filter when the current user is a sysadmin
 * or an admin with access to more than one tenant.
 */
@Injectable({ providedIn: 'root' })
export class TenantFilterService {
  private readonly auth = inject(AuthService);
  private readonly tenantRepo = inject(ApiTenantRepository);
  private readonly tenantsCache = signal<Tenant[]>([]);

  constructor() {
    void this.refreshTenants();
  }

  readonly showTenantFilter = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    if (user.role === 'system_admin') return true;
    return (user.tenantIds?.length ?? 0) > 1;
  });

  readonly tenantFilterField = computed<FilterField | null>(() => {
    if (!this.showTenantFilter()) return null;
    const user = this.auth.currentUser();
    const allTenants = this.tenantsCache();
    let options: { value: string; labelKey: string }[];

    if (user?.role === 'system_admin') {
      options = allTenants
        .filter(t => t.isActive)
        .map(t => ({ value: t.id, labelKey: t.name }));
    } else {
      const allowed = new Set(user?.tenantIds ?? []);
      options = allTenants
        .filter(t => t.isActive && allowed.has(t.id))
        .map(t => ({ value: t.id, labelKey: t.name }));
    }

    return {
      key: 'tenantId',
      labelKey: 'common.filter.tenant',
      type: 'select' as const,
      options
    };
  });

  private async refreshTenants(): Promise<void> {
    try {
      const tenants = await this.tenantRepo.getAll();
      this.tenantsCache.set(tenants);
    } catch {
      this.tenantsCache.set([]);
    }
  }
}
