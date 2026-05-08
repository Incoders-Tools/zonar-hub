import { Injectable, inject, signal, computed } from '@angular/core';
import { TournamentRule } from '../../../../core/models/tournament-rule.model';
import { ApiTournamentRuleRepository } from '../../../../core/repositories/api/api-tournament-rule.repository';

export interface TournamentRulesFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class TournamentRulesFacadeService {
  private readonly repository = inject(ApiTournamentRuleRepository);

  private readonly entitiesState = signal<TournamentRule[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<TournamentRulesFilters>({});
  private readonly sortState = signal<string>('sortOrder_asc');

  readonly entities = this.entitiesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly filteredRules = computed(() => {
    const all = this.entitiesState();
    const filters = this.filtersState();
    let result = [...all];

    if (filters.name?.trim()) {
      const term = filters.name.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(term));
    }

    if (filters.isActive !== undefined && filters.isActive !== '') {
      const isActive = filters.isActive === 'true';
      result = result.filter(r => r.isActive === isActive);
    }

    const sortOption = this.sortState();
    if (sortOption === 'sortOrder_asc') {
      result.sort((a, b) => a.sortOrder - b.sortOrder);
    } else if (sortOption === 'sortOrder_desc') {
      result.sort((a, b) => b.sortOrder - a.sortOrder);
    } else if (sortOption === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === 'createdAt_desc') {
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return result;
  });

  async load(): Promise<void> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const rules = await this.repository.getAll();
      this.entitiesState.set(rules);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: TournamentRulesFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  async saveRule(rule: TournamentRule | Omit<TournamentRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      const isUpdate = 'id' in rule && (rule as TournamentRule).id;

      if (isUpdate) {
        const updated = await this.repository.update((rule as TournamentRule).id, rule);
        const idx = this.entitiesState().findIndex(r => r.id === updated.id);
        if (idx !== -1) {
          const next = [...this.entitiesState()];
          next[idx] = updated;
          this.entitiesState.set(next);
        }
      } else {
        const created = await this.repository.create(rule as Omit<TournamentRule, 'id' | 'createdAt' | 'updatedAt'>);
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

  async deleteRule(id: string): Promise<boolean> {
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

  async checkNameExists(name: string, currentId?: string): Promise<boolean> {
    const lower = name.trim().toLowerCase();
    return this.entitiesState().some(r =>
      r.name.toLowerCase() === lower && r.id !== currentId
    );
  }

  getNextSortOrder(): number {
    const max = Math.max(0, ...this.entitiesState().map(r => r.sortOrder ?? 0));
    return max + 1;
  }
}
