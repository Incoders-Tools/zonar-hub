import { Injectable, inject, signal, computed } from '@angular/core';
import { TournamentEligibilityProfile } from '../../../../core/models';
import { MockTournamentEligibilityProfileRepository } from '../../../../core/repositories/tournament-admin.repository';

export interface TournamentEligibilityProfileFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class TournamentEligibilityProfilesFacadeService {
  private readonly repository = inject(MockTournamentEligibilityProfileRepository);

  // State signals
  private readonly entitiesState = signal<TournamentEligibilityProfile[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<TournamentEligibilityProfileFilters>({});
  private readonly sortState = signal<string>('sort_order_asc');

  // Public computed properties
  readonly entities = this.entitiesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  readonly filteredProfiles = computed(() => {
    const profiles = this.entitiesState();
    const filters = this.filtersState();

    let result = [...profiles];

    // Filter by name (case-insensitive substring match)
    if (filters.name?.trim()) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    // Filter by isActive
    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(p => p.isActive === isActive);
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

      // Load profiles and supporting data (genders, categories)
      const profiles = await this.repository.getAll();
      this.entitiesState.set(profiles);

      // TODO: Load genders and categories from their respective repositories
      // This would be used by the form dialog to populate select fields
      // const genders = await this.genderRepository.getAll();
      // const categories = await this.categoryRepository.getAll();
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: TournamentEligibilityProfileFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  async saveProfile(profile: TournamentEligibilityProfile | Omit<TournamentEligibilityProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      // Check if this is create or update based on presence of 'id'
      const isUpdate = 'id' in profile && profile.id;

      if (isUpdate) {
        const updated = await this.repository.update((profile as TournamentEligibilityProfile).id, profile);
        // Update in local state
        const idx = this.entitiesState().findIndex(p => p.id === (profile as TournamentEligibilityProfile).id);
        if (idx !== -1) {
          const updated_profiles = [...this.entitiesState()];
          updated_profiles[idx] = updated;
          this.entitiesState.set(updated_profiles);
        }
      } else {
        const created = await this.repository.create(profile as Omit<TournamentEligibilityProfile, 'id' | 'createdAt' | 'updatedAt'>);
        this.entitiesState.set([...this.entitiesState(), created]);
      }

      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async deleteProfile(id: string): Promise<boolean> {
    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await this.repository.delete(id);
      this.entitiesState.set(this.entitiesState().filter(p => p.id !== id));
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<boolean> {
    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await Promise.all(ids.map(id => this.repository.delete(id)));
      this.entitiesState.set(this.entitiesState().filter(p => !ids.includes(p.id)));
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
        const currentEntity = this.entitiesState().find(p => p.id === currentId);
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
        const currentEntity = this.entitiesState().find(p => p.id === currentId);
        return this.entitiesState().some(
          p => p.name.toLowerCase() === name.toLowerCase() && p.id !== currentId
        );
      }
      return this.entitiesState().some(p => p.name.toLowerCase() === name.toLowerCase());
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
          p => p.sortOrder === sortOrder && p.id !== currentId
        );
      }
      return this.entitiesState().some(p => p.sortOrder === sortOrder);
    } catch {
      return false;
    }
  }

  getNextSortOrder(): number {
    const max = Math.max(0, ...this.entitiesState().map(p => p.sortOrder ?? 0));
    return max + 1;
  }
}
