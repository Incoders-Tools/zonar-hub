import { Injectable, inject, signal, computed } from '@angular/core';
import { Sport, TournamentModality } from '../../../../core/models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { MockTournamentModalityRepository } from '../../../../core/repositories/mock/mock-tournament-modality.repository';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';

export interface SportFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class SportsFacadeService {
  private readonly repository = inject(ApiSportRepository);
  private readonly modalityRepository = inject(MockTournamentModalityRepository);
  private readonly auth = inject(AuthService);
  private readonly organizationContext = inject(OrganizationContextService);
  private readonly tenantContext = inject(TenantContextService);

  private readonly scopeState = signal<'global' | 'organization' | 'tenant'>('global');
  private readonly scopeIdState = signal<string | null>(null);

  // State signals
  private readonly entitiesState = signal<Sport[]>([]);
  private readonly modalitiesState = signal<TournamentModality[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<SportFilters>({});
  private readonly sortState = signal<string>('sort_order_asc');

  // Public computed properties
  readonly entities = this.entitiesState;
  readonly modalities = this.modalitiesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  readonly filteredSports = computed(() => {
    const sports = this.entitiesState();
    const filters = this.filtersState();

    let result = [...sports];

    // Filter by name (case-insensitive substring match)
    if (filters.name?.trim()) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(searchTerm));
    }

    // Filter by isActive
    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(s => s.isActive === isActive);
    }

    // Apply sorting
    const sortOption = this.sortState();
    if (sortOption === 'sort_order_asc') {
      result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    } else if (sortOption === 'sort_order_desc') {
      result.sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));
    } else if (sortOption === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  });

  async load(): Promise<void> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const scope = this.resolveScope();
      this.scopeState.set(scope.type);
      this.scopeIdState.set(scope.id ?? null);

      const [sports, modalities] = await Promise.all([
        scope.type === 'organization' && scope.id
          ? this.repository.getForOrganization(scope.id)
          : scope.type === 'tenant' && scope.id
            ? this.repository.getForTenant(scope.id)
            : this.repository.getAll(),
        this.modalityRepository.getAll()
      ]);
      this.entitiesState.set(sports);
      this.modalitiesState.set(modalities);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: SportFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  /**
   * Persist the global catalog entry. Restricted to system_admin.
   * Always hits POST /api/admin/sports or PUT /api/admin/sports/{id}, regardless of scope.
   */
  async saveSport(sport: Sport | Omit<Sport, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      if (!this.auth.isSystemAdmin()) {
        return false;
      }

      const isUpdate = 'id' in sport && sport.id;

      if (isUpdate) {
        await this.repository.update((sport as Sport).id, sport);
      } else {
        await this.repository.create(sport as Omit<Sport, 'id' | 'createdAt' | 'updatedAt'>);
      }

      // Reload from the active scope so the list reflects the canonical view
      // (organization-enabled flags, tenant filtering, etc.)
      await this.load();
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  /**
   * Toggle the active flag honoring the current scope:
   * - global   → updates the catalog entry's isActive (PUT /api/admin/sports/{id})
   * - org      → updates the organization's enabledSportIds list
   * - tenant   → updates the tenant's enabledSportIds list
   */
  async toggleSportEnabled(sportId: string, nextActive: boolean): Promise<boolean> {
    const scope = this.scopeState();
    const scopeId = this.scopeIdState();

    try {
      this.savingState.set(true);
      this.errorState.set(null);

      if (scope === 'organization' || scope === 'tenant') {
        if (!scopeId) return false;
        const local = this.entitiesState().map(s =>
          s.id === sportId ? { ...s, isActive: nextActive } : s
        );
        this.entitiesState.set(local);
        const enabledSportIds = local.filter(s => s.isActive).map(s => s.id);
        await this.persistScopedSelection(enabledSportIds);
        return true;
      }

      const sport = this.entitiesState().find(s => s.id === sportId);
      if (!sport) return false;
      await this.repository.update(sport.id, { ...sport, isActive: nextActive });
      this.entitiesState.set(
        this.entitiesState().map(s => (s.id === sportId ? { ...s, isActive: nextActive } : s))
      );
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async deleteSport(id: string): Promise<boolean> {
    if (this.scopeState() !== 'global') {
      return false;
    }

    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await this.repository.delete(id);
      this.entitiesState.set(this.entitiesState().filter(s => s.id !== id));
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<boolean> {
    if (this.scopeState() !== 'global') {
      return false;
    }

    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await Promise.all(ids.map(id => this.repository.delete(id)));
      this.entitiesState.set(this.entitiesState().filter(s => !ids.includes(s.id)));
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }

  async checkKeyExists(key: string, currentId?: string): Promise<boolean> {
    try {
      const existingKeys = await this.repository.getExistingKeys();
      if (currentId) {
        // When editing, allow the current key if it belongs to this entity
        const currentEntity = this.entitiesState().find(s => s.id === currentId);
        return existingKeys.includes(key) && currentEntity?.key !== key;
      }
      return existingKeys.includes(key);
    } catch {
      return false;
    }
  }

  async checkNameExists(name: string, currentId?: string): Promise<boolean> {
    try {
      if (currentId) {
        return this.entitiesState().some(
          s => s.name.toLowerCase() === name.toLowerCase() && s.id !== currentId
        );
      }
      return this.entitiesState().some(s => s.name.toLowerCase() === name.toLowerCase());
    } catch {
      return false;
    }
  }

  async checkSortOrderExists(sortOrder: number | null, currentId?: string): Promise<boolean> {
    try {
      if (!sortOrder || sortOrder === 0) {
        return false; // 0 and null are allowed to repeat
      }
      if (currentId) {
        return this.entitiesState().some(
          s => s.sortOrder === sortOrder && s.id !== currentId
        );
      }
      return this.entitiesState().some(s => s.sortOrder === sortOrder);
    } catch {
      return false;
    }
  }

  /**
   * Fetch the canonical catalog entry (global) for editing.
   * In org/tenant scope the listing endpoint omits fields like modalityIds, so
   * we resolve them from the global endpoint when sysadmin opens the form.
   */
  async getCatalogSport(id: string): Promise<Sport | undefined> {
    if (!this.auth.isSystemAdmin()) {
      return this.entitiesState().find(s => s.id === id);
    }

    if (this.scopeState() === 'global') {
      return this.entitiesState().find(s => s.id === id);
    }

    try {
      return await this.repository.getById(id);
    } catch {
      return this.entitiesState().find(s => s.id === id);
    }
  }

  getNextSortOrder(): number {
    const max = Math.max(0, ...this.entitiesState().map(s => s.sortOrder ?? 0));
    return max + 1;
  }

  private resolveScope(): { type: 'global' | 'organization' | 'tenant'; id?: string } {
    const organizationId = this.organizationContext.organizationId();
    if (organizationId) {
      return { type: 'organization', id: organizationId };
    }

    if (this.auth.isSystemAdmin()) {
      return { type: 'global' };
    }

    const tenantId = this.auth.session()?.tenant?.id
      ?? this.auth.currentUser()?.tenantId
      ?? this.tenantContext.tenantId();

    if (tenantId) {
      return { type: 'tenant', id: tenantId };
    }

    return { type: 'global' };
  }

  private async persistScopedSelection(enabledSportIds: string[]): Promise<void> {
    const scope = this.scopeState();
    const scopeId = this.scopeIdState();

    if (!scopeId) {
      return;
    }

    if (scope === 'organization') {
      await this.repository.setForOrganization(scopeId, enabledSportIds);
      return;
    }

    if (scope === 'tenant') {
      await this.repository.setForTenant(scopeId, enabledSportIds);
    }
  }
}
