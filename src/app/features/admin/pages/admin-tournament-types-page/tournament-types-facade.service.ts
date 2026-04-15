import { Injectable, inject, signal, computed } from '@angular/core';
import { TournamentType } from '../../../../core/models';
import { Sport } from '../../../../core/models';
import { MockTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';

export interface TournamentTypeFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class TournamentTypesFacadeService {
  private readonly repository = inject(MockTournamentTypeRepository);
  private readonly sportRepo = inject(MockSportRepository);

  // State signals
  private readonly entitiesState = signal<TournamentType[]>([]);
  private readonly sportsState = signal<Sport[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<TournamentTypeFilters>({});
  private readonly sortState = signal<string>('sort_order_asc');

  // Public computed properties
  readonly entities = this.entitiesState;
  readonly sports = this.sportsState.asReadonly();
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  readonly filteredTypes = computed(() => {
    const types = this.entitiesState();
    const filters = this.filtersState();

    let result = [...types];

    // Filter by name (case-insensitive substring match)
    if (filters.name?.trim()) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(searchTerm));
    }

    // Filter by isActive
    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(t => t.isActive === isActive);
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
      const [types, sports] = await Promise.all([
        this.repository.getAll(),
        this.sportRepo.getAll()
      ]);
      this.entitiesState.set(types);
      this.sportsState.set(sports);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: TournamentTypeFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  async saveType(type: TournamentType | Omit<TournamentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      // Check if this is create or update based on presence of 'id'
      const isUpdate = 'id' in type && type.id;

      if (isUpdate) {
        const updated = await this.repository.update((type as TournamentType).id, type);
        // Update in local state
        const idx = this.entitiesState().findIndex(t => t.id === (type as TournamentType).id);
        if (idx !== -1) {
          const updated_types = [...this.entitiesState()];
          updated_types[idx] = updated;
          this.entitiesState.set(updated_types);
        }
      } else {
        const created = await this.repository.create(type as Omit<TournamentType, 'id' | 'createdAt' | 'updatedAt'>);
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

  async deleteType(id: string): Promise<boolean> {
    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await this.repository.delete(id);
      this.entitiesState.set(this.entitiesState().filter(t => t.id !== id));
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
      this.entitiesState.set(this.entitiesState().filter(t => !ids.includes(t.id)));
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
        const currentEntity = this.entitiesState().find(t => t.id === currentId);
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
        const currentEntity = this.entitiesState().find(t => t.id === currentId);
        return this.entitiesState().some(
          t => t.name.toLowerCase() === name.toLowerCase() && t.id !== currentId
        );
      }
      return this.entitiesState().some(t => t.name.toLowerCase() === name.toLowerCase());
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
          t => t.sortOrder === sortOrder && t.id !== currentId
        );
      }
      return this.entitiesState().some(t => t.sortOrder === sortOrder);
    } catch {
      return false;
    }
  }

  getNextSortOrder(): number {
    const max = Math.max(0, ...this.entitiesState().map(t => t.sortOrder ?? 0));
    return max + 1;
  }
}
