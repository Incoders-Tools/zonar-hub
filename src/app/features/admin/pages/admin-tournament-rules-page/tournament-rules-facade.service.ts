import { Injectable, inject, signal, computed } from '@angular/core';
import { TournamentRuleSet, TournamentType } from '../../../../core/models';
import { MockTournamentRuleSetRepository } from '../../../../core/repositories/mock/mock-tournament-rule-set.repository';
import { MockTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';

export interface TournamentRuleSetFilters {
  tournamentTypeName?: string;
  isActive?: string;
}

@Injectable()
export class TournamentRulesFacadeService {
  private readonly repository = inject(MockTournamentRuleSetRepository);
  private readonly tournamentTypeRepository = inject(MockTournamentTypeRepository);

  // State signals
  private readonly entitiesState = signal<TournamentRuleSet[]>([]);
  private readonly tournamentTypesState = signal<TournamentType[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<TournamentRuleSetFilters>({});
  private readonly sortState = signal<string>('createdAt_desc');

  // Public computed properties
  readonly entities = this.entitiesState;
  readonly tournamentTypes = this.tournamentTypesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  readonly filteredRuleSets = computed(() => {
    const ruleSets = this.entitiesState();
    const filters = this.filtersState();

    let result = [...ruleSets];

    // Filter by tournamentTypeName (case-insensitive substring match)
    if (filters.tournamentTypeName?.trim()) {
      const searchTerm = filters.tournamentTypeName.toLowerCase();
      result = result.filter(r => r.tournamentTypeName.toLowerCase().includes(searchTerm));
    }

    // Filter by isActive
    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(r => r.isActive === isActive);
    }

    // Apply sorting
    const sortOption = this.sortState();
    if (sortOption === 'tournamentTypeName_asc') {
      result.sort((a, b) => a.tournamentTypeName.localeCompare(b.tournamentTypeName));
    } else if (sortOption === 'tournamentTypeName_desc') {
      result.sort((a, b) => b.tournamentTypeName.localeCompare(a.tournamentTypeName));
    } else if (sortOption === 'createdAt_asc') {
      result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else if (sortOption === 'createdAt_desc') {
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return result;
  });

  async load(): Promise<void> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const [ruleSets, tournamentTypes] = await Promise.all([
        this.repository.getAll(),
        this.tournamentTypeRepository.getAll()
      ]);
      this.entitiesState.set(ruleSets);
      this.tournamentTypesState.set(tournamentTypes);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: TournamentRuleSetFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  async saveRuleSet(ruleSet: TournamentRuleSet | Omit<TournamentRuleSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      // Resolve tournament type name from selected id
      const tournamentType = this.tournamentTypesState().find(t => t.id === ruleSet.tournamentTypeId);
      if (tournamentType) {
        (ruleSet as TournamentRuleSet).tournamentTypeName = tournamentType.name;
      }

      const isUpdate = 'id' in ruleSet && ruleSet.id;

      if (isUpdate) {
        const updated = await this.repository.update((ruleSet as TournamentRuleSet).id, ruleSet);
        const idx = this.entitiesState().findIndex(r => r.id === (ruleSet as TournamentRuleSet).id);
        if (idx !== -1) {
          const updatedRuleSets = [...this.entitiesState()];
          updatedRuleSets[idx] = updated;
          this.entitiesState.set(updatedRuleSets);
        }
      } else {
        const created = await this.repository.create(ruleSet as Omit<TournamentRuleSet, 'id' | 'createdAt' | 'updatedAt'>);
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

  async deleteRuleSet(id: string): Promise<boolean> {
    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await this.repository.delete(id);
      this.entitiesState.set(this.entitiesState().filter(r => r.id !== id));
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
      this.entitiesState.set(this.entitiesState().filter(r => !ids.includes(r.id)));
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }
}
