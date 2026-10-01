import { Injectable, inject, signal, computed } from '@angular/core';
import { Organization, OrganizationType } from '../../../../core/models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiOrganizationRepository } from '../../../../core/repositories/api/api-organization.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';

export interface OrganizationFilters {
  name?: string;
  type?: string;
  isActive?: string;
}

@Injectable()
export class OrganizationFacadeService {
  private readonly repo = inject(ApiOrganizationRepository);
  private readonly sportsRepo = inject(ApiSportRepository);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  private readonly notification = inject(NotificationService);

  private readonly organizationsState = signal<Organization[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly filtersState = signal<OrganizationFilters>({});
  private readonly sortState = signal<{ key: string; direction: 'asc' | 'desc' }>({ key: 'displayName', direction: 'asc' });

  readonly organizations = this.organizationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();

  readonly filteredOrganizations = computed(() => {
    const all = this.organizationsState();
    const f = this.filtersState();
    const sort = this.sortState();
    let result = [...all];

    if (f.name) {
      const term = f.name.toLowerCase();
      result = result.filter(o =>
        o.displayName.toLowerCase().includes(term) ||
        (o.legalName?.toLowerCase().includes(term) ?? false)
      );
    }

    if (f.type) {
      result = result.filter(o => o.type === f.type);
    }

    if (f.isActive === 'true') {
      result = result.filter(o => o.isActive);
    } else if (f.isActive === 'false') {
      result = result.filter(o => !o.isActive);
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
      const data = await this.repo.getAll();
      this.organizationsState.set(data);
    } catch {
      this.errorState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: OrganizationFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  sort(key: string, direction: 'asc' | 'desc'): void {
    this.sortState.set({ key, direction });
  }

  async createOrganization(
    data: Pick<Organization, 'displayName' | 'legalName' | 'description' | 'type' | 'isActive'>,
    selectedSportIds: string[]
  ): Promise<boolean> {
    this.savingState.set(true);
    try {
      const user = this.auth.currentUser();
      const fullData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        tenantId: user?.tenantId || null as unknown as string,
        createdByUserId: user?.id || null as unknown as string,
        logoUrl: undefined
      };
      const created = await this.repo.create(fullData);
      await this.sportsRepo.setForOrganization(created.id, selectedSportIds);

      // Auto-assign the new org to the admin who created it
      const currentUser = this.auth.currentUser();
      if (currentUser) {
        const existingIds = new Set<string>([
          ...(currentUser.tenantIds ?? []),
          ...(currentUser.organizationId ? [currentUser.organizationId] : [])
        ]);
        existingIds.add(created.id);
        const updatedTenantIds = Array.from(existingIds);
        this.auth.updateCurrentOrganizationAssignments(currentUser.organizationId ?? created.id, updatedTenantIds);
        if (!currentUser.organizationId) {
          // The backend assigns the first organization as primary.
          this.auth.updatePrimaryOrganization(created.id);
          this.activeOrg.setOnboardingOrganization(created.id);
        } else {
          this.activeOrg.refreshOrganizations();
        }
      }

      this.notification.success('admin.organizations.toast.created');
      await this.load();
      return true;
    } catch {
      this.notification.error('admin.organizations.toast.createError');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateOrganization(
    id: string,
    data: Partial<Organization> & { selectedSportIds?: string[] }
  ): Promise<boolean> {
    this.savingState.set(true);
    try {
      await this.repo.update(id, data);
      if (data.selectedSportIds) {
        await this.sportsRepo.setForOrganization(id, data.selectedSportIds);
      }
      this.notification.success('admin.organizations.toast.updated');
      await this.load();
      this.activeOrg.refreshOrganizations();
      return true;
    } catch {
      this.notification.error('admin.organizations.toast.updateError');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.deletingState.set(true);
    try {
      await this.repo.delete(id);
      this.notification.success('admin.organizations.toast.deleted');
      await this.load();
    } catch {
      this.notification.error('admin.organizations.toast.deleteError');
    } finally {
      this.deletingState.set(false);
    }
  }

  async deactivate(id: string): Promise<void> {
    this.savingState.set(true);
    try {
      await this.repo.deactivate(id);
      this.notification.success('admin.organizations.toast.deactivated');
      await this.load();
    } catch {
      this.notification.error('admin.organizations.toast.deactivateError');
    } finally {
      this.savingState.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.deletingState.set(true);
    try {
      for (const id of ids) {
        await this.repo.delete(id);
      }
      this.notification.success('admin.organizations.toast.bulkDeleted');
      await this.load();
    } catch {
      this.notification.error('admin.organizations.toast.deleteError');
    } finally {
      this.deletingState.set(false);
    }
  }
}
