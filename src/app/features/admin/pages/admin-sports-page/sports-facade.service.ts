import { Injectable, inject, signal, computed } from '@angular/core';
import { Sport, TournamentModality } from '../../../../core/models';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';
import { MockTournamentModalityRepository } from '../../../../core/repositories/mock/mock-tournament-modality.repository';

export interface SportFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class SportsFacadeService {
  private readonly repository = inject(MockSportRepository);
  private readonly modalityRepository = inject(MockTournamentModalityRepository);

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
      const [sports, modalities] = await Promise.all([
        this.repository.getAll(),
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

  async saveSport(sport: Sport | Omit<Sport, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      // Check if this is create or update based on presence of 'id'
      const isUpdate = 'id' in sport && sport.id;

      if (isUpdate) {
        const updated = await this.repository.update((sport as Sport).id, sport);
        // Update in local state
        const idx = this.entitiesState().findIndex(s => s.id === (sport as Sport).id);
        if (idx !== -1) {
          const updatedSports = [...this.entitiesState()];
          updatedSports[idx] = updated;
          this.entitiesState.set(updatedSports);
        }
      } else {
        const created = await this.repository.create(sport as Omit<Sport, 'id' | 'createdAt' | 'updatedAt'>);
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

  async deleteSport(id: string): Promise<boolean> {
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

  getNextSortOrder(): number {
    const max = Math.max(0, ...this.entitiesState().map(s => s.sortOrder ?? 0));
    return max + 1;
  }
}
