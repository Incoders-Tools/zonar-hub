import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ActiveOrganizationService } from './active-organization.service';
import { Tenant, PlanType } from '../models';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);

  /** The active organization (tenant), derived from the global org context */
  readonly tenant = computed<Tenant | null>(() => this.activeOrg.activeOrganization() ?? this.auth.session()?.tenant ?? null);
  readonly tenantId = computed<string | null>(() =>
    this.activeOrg.activeOrganization()?.id
    ?? this.auth.session()?.tenant?.id
    ?? this.auth.currentUser()?.tenantId
    ?? null
  );
  readonly tenantName = computed<string>(() => this.activeOrg.activeOrganizationName() || (this.auth.session()?.tenant?.name ?? ''));
  readonly planType = computed<PlanType | null>(() => this.tenant()?.planType ?? null);
  readonly isActive = computed<boolean>(() => this.tenant()?.isActive ?? false);
  readonly hasTenant = computed<boolean>(() => this.tenantId() !== null);

  readonly hasDedicatedServer = computed(() => false);
  readonly hasDedicatedDatabase = computed(() => false);
  readonly hasDedicatedAI = computed(() => false);

  readonly isEnterprise = computed(() => this.planType() === 'enterprise');
  readonly isSingleUse = computed(() => this.planType() === 'single_use');
  readonly isTrial = computed(() => {
    const t = this.tenant();
    return t !== null && this.planType() === 'starter';
  });
}
