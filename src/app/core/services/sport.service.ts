import { Injectable, inject, signal, computed } from '@angular/core';
import { Sport } from '../models';
import { AuthService } from '../auth/auth.service';
import { ApiSportRepository } from '../repositories/api/api-sport.repository';
import { OrganizationContextService } from './organization-context.service';
import { TenantContextService } from './tenant-context.service';

@Injectable({ providedIn: 'root' })
export class SportService {
  private readonly repo = inject(ApiSportRepository);
  private readonly auth = inject(AuthService);
  private readonly organizationContext = inject(OrganizationContextService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly sportsState = signal<Sport[]>([]);
  private readonly loadingState = signal(false);

  readonly sports = this.sportsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  readonly activeSports = computed(() =>
    this.sportsState()
      .filter(s => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  );

  async loadSports(): Promise<void> {
    this.loadingState.set(true);
    try {
      const isSystemAdmin = this.auth.isSystemAdmin();
      const organizationId = this.organizationContext.organizationId();
      const tenantId = this.auth.session()?.tenant?.id
        ?? this.auth.currentUser()?.tenantId
        ?? this.tenantContext.tenantId();

      const data = isSystemAdmin
        ? await this.repo.getAll()
        : organizationId
        ? await this.repo.getForOrganization(organizationId)
        : tenantId
          ? await this.repo.getForTenant(tenantId)
          : await this.repo.getAll();

      this.sportsState.set(data);
    } finally {
      this.loadingState.set(false);
    }
  }
}
