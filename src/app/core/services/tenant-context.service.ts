import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Tenant, PlanType } from '../models';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly auth = inject(AuthService);

  readonly tenant = computed<Tenant | null>(() => this.auth.session()?.tenant ?? null);
  readonly tenantId = computed<string | null>(() => this.tenant()?.id ?? this.auth.currentUser()?.tenantId ?? null);
  readonly tenantName = computed<string>(() => this.tenant()?.name ?? '');
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
