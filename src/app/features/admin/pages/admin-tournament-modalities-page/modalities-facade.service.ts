import { Injectable, inject, signal, computed } from '@angular/core';
import { TournamentModality } from '../../../../core/models';
import { MockTournamentModalityRepository } from '../../../../core/repositories/mock/mock-tournament-modality.repository';

export interface ModalityFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class ModalitiesFacadeService {
  private readonly repository = inject(MockTournamentModalityRepository);

  private readonly entitiesState = signal<TournamentModality[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<ModalityFilters>({});
  private readonly sortState = signal<string>('sort_order_asc');

  readonly entities = this.entitiesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  readonly filteredModalities = computed(() => {
    const modalities = this.entitiesState();
    const filters = this.filtersState();

    let result = [...modalities];

    if (filters.name?.trim()) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter(m =>
        m.nameEs.toLowerCase().includes(searchTerm) ||
        m.nameEn.toLowerCase().includes(searchTerm) ||
        m.namePt.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(m => m.isActive === isActive);
    }

    const sortOption = this.sortState();
    if (sortOption === 'sort_order_asc') {
      result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    } else if (sortOption === 'sort_order_desc') {
      result.sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));
    } else if (sortOption === 'nameEs_asc') {
      result.sort((a, b) => a.nameEs.localeCompare(b.nameEs));
    } else if (sortOption === 'nameEs_desc') {
      result.sort((a, b) => b.nameEs.localeCompare(a.nameEs));
    }

    return result;
  });

  async load(): Promise<void> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const modalities = await this.repository.getAll();
      this.entitiesState.set(modalities);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: ModalityFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  async saveModality(modality: TournamentModality | Omit<TournamentModality, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      const isUpdate = 'id' in modality && modality.id;

      if (isUpdate) {
        const updated = await this.repository.update((modality as TournamentModality).id, modality);
        const idx = this.entitiesState().findIndex(m => m.id === (modality as TournamentModality).id);
        if (idx !== -1) {
          const updatedList = [...this.entitiesState()];
          updatedList[idx] = updated;
          this.entitiesState.set(updatedList);
        }
      } else {
        const created = await this.repository.create(modality as Omit<TournamentModality, 'id' | 'createdAt' | 'updatedAt'>);
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

  async deleteModality(id: string): Promise<boolean> {
    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await this.repository.delete(id);
      this.entitiesState.set(this.entitiesState().filter(m => m.id !== id));
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
      this.entitiesState.set(this.entitiesState().filter(m => !ids.includes(m.id)));
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
        const currentEntity = this.entitiesState().find(m => m.id === currentId);
        return existingKeys.includes(key) && currentEntity?.key !== key;
      }
      return existingKeys.includes(key);
    } catch {
      return false;
    }
  }

  async checkSortOrderExists(sortOrder: number | null, currentId?: string): Promise<boolean> {
    try {
      if (!sortOrder || sortOrder === 0) return false;
      if (currentId) {
        return this.entitiesState().some(m => m.sortOrder === sortOrder && m.id !== currentId);
      }
      return this.entitiesState().some(m => m.sortOrder === sortOrder);
    } catch {
      return false;
    }
  }

  getNextSortOrder(): number {
    const max = Math.max(0, ...this.entitiesState().map(m => m.sortOrder ?? 0));
    return max + 1;
  }
}
