import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { FilterField } from '../../shared/components/filter-panel/filter-panel.component';
import { MockTenantRepository } from '../repositories/mock/mock-tenant.repository';

/**
 * Provides a tenant filter field for filter panels.
 *
 * Shows the filter when the current user is a sysadmin
 * or an admin with access to more than one tenant.
 */
@Injectable({ providedIn: 'root' })
export class TenantFilterService {
  private readonly auth = inject(AuthService);
  private readonly tenantRepo = inject(MockTenantRepository);

  /** Whether the current user should see a tenant filter */
  readonly showTenantFilter = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    if (user.role === 'system_admin') return true;
    return (user.tenantIds?.length ?? 0) > 1;
  });

  /** Available tenant options for the filter, scoped to user access */
  readonly tenantFilterField = computed<FilterField | null>(() => {
    if (!this.showTenantFilter()) return null;
    const user = this.auth.currentUser();
    const allTenants = this.tenantRepo.getAllSync();
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
}
