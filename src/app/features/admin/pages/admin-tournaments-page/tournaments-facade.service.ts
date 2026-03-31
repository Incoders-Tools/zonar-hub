import { Injectable, inject, signal, computed } from '@angular/core';
import { Tournament, Court, Category, Gender, TournamentType, Complex } from '../../../../core/models';
import { MockTournamentAdminRepository } from '../../../../core/repositories/mock/mock-tournament-admin.repository';
import { MockComplexRepository } from '../../../../core/repositories/mock/mock-complex.repository';
import { MockCategoryRepository } from '../../../../core/repositories/mock/mock-category.repository';
import { MockGenderRepository } from '../../../../core/repositories/mock/mock-gender.repository';
import { MockTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';

export interface TournamentFilters {
  name?: string;
  statusLabel?: string;
  isActive?: string;
}

@Injectable()
export class TournamentsFacadeService {
  private readonly repository = inject(MockTournamentAdminRepository);
  private readonly complexRepo = inject(MockComplexRepository);
  private readonly categoryRepo = inject(MockCategoryRepository);
  private readonly genderRepo = inject(MockGenderRepository);
  private readonly tournamentTypeRepo = inject(MockTournamentTypeRepository);

  // State signals
  private readonly entitiesState = signal<Tournament[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<TournamentFilters>({});
  private readonly sortState = signal<string>('name_asc');

  // Lookup signals
  private readonly complexesState = signal<Complex[]>([]);
  private readonly categoriesState = signal<Category[]>([]);
  private readonly gendersState = signal<Gender[]>([]);
  private readonly tournamentTypesState = signal<TournamentType[]>([]);
  private readonly courtsForComplexState = signal<Court[]>([]);
  private readonly loadingCourtsState = signal(false);

  // Public computed properties
  readonly entities = this.entitiesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  // Public lookups
  readonly complexes = this.complexesState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly genders = this.gendersState.asReadonly();
  readonly tournamentTypes = this.tournamentTypesState.asReadonly();
  readonly courtsForComplex = this.courtsForComplexState.asReadonly();
  readonly loadingCourts = this.loadingCourtsState.asReadonly();

  readonly filteredTournaments = computed(() => {
    const tournaments = this.entitiesState();
    const filters = this.filtersState();

    let result = [...tournaments];

    if (filters.name?.trim()) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(searchTerm));
    }

    if (filters.statusLabel?.trim()) {
      const statusTerm = filters.statusLabel.toLowerCase();
      result = result.filter(t => {
        const status = this.computeStatus(t.startDate, t.endDate);
        return status.key === statusTerm;
      });
    }

    if (filters.isActive !== undefined && filters.isActive !== '') {
      const isActive = filters.isActive === 'true';
      result = result.filter(t => (t.isActive ?? true) === isActive);
    }

    const sortOption = this.sortState();
    if (sortOption === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === 'startDate_asc' || sortOption === 'start_date_asc') {
      result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else if (sortOption === 'startDate_desc' || sortOption === 'start_date_desc') {
      result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }

    return result;
  });

  computeStatus(startDate: string, endDate: string): { key: string; labelKey: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (today > end) return { key: 'finished', labelKey: 'admin.tournaments.status.finished' };
    if (today >= start && today <= end) return { key: 'in_progress', labelKey: 'admin.tournaments.status.in_progress' };
    return { key: 'upcoming', labelKey: 'admin.tournaments.status.upcoming' };
  }

  typeAppliesGender(typeId: string): boolean {
    const type = this.tournamentTypesState().find(t => t.id === typeId);
    return type?.appliesGender ?? false;
  }

  typeScoresPoints(typeId: string): boolean {
    const type = this.tournamentTypesState().find(t => t.id === typeId);
    return type?.scoresPoints ?? false;
  }

  getComplexName(complexId: string): string {
    return this.complexesState().find(c => c.id === complexId)?.name || '';
  }

  getTournamentTypeName(typeId: string): string {
    return this.tournamentTypesState().find(t => t.id === typeId)?.name || '';
  }

  getGenderLabel(genderId: string): string {
    return this.gendersState().find(g => g.id === genderId)?.name || '';
  }

  getCategoryName(categoryId: string): string {
    return this.categoriesState().find(c => c.id === categoryId)?.name || '';
  }

  async load(): Promise<void> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const [tournaments, complexes, categories, genders, tournamentTypes] = await Promise.all([
        this.repository.getAll(),
        this.complexRepo.getAll(),
        this.categoryRepo.getAll(),
        this.genderRepo.getAll(),
        this.tournamentTypeRepo.getAll()
      ]);
      this.entitiesState.set(tournaments);
      this.complexesState.set(complexes);
      this.categoriesState.set(categories);
      this.gendersState.set(genders);
      this.tournamentTypesState.set(tournamentTypes);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  async loadCourtsForComplex(complexId: string): Promise<void> {
    if (!complexId) {
      this.courtsForComplexState.set([]);
      return;
    }
    try {
      this.loadingCourtsState.set(true);
      const courts = await this.complexRepo.getCourtsByComplexId(complexId);
      this.courtsForComplexState.set(courts);
    } catch {
      this.courtsForComplexState.set([]);
    } finally {
      this.loadingCourtsState.set(false);
    }
  }

  applyFilters(filters: TournamentFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  async saveTournament(tournament: Tournament | Omit<Tournament, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      const isUpdate = 'id' in tournament && tournament.id;

      if (isUpdate) {
        const updated = await this.repository.update((tournament as Tournament).id, tournament);
        const idx = this.entitiesState().findIndex(t => t.id === (tournament as Tournament).id);
        if (idx !== -1) {
          const updatedTournaments = [...this.entitiesState()];
          updatedTournaments[idx] = updated;
          this.entitiesState.set(updatedTournaments);
        }
      } else {
        const created = await this.repository.create(tournament as Omit<Tournament, 'id' | 'createdAt'>);
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

  async deleteTournament(id: string): Promise<boolean> {
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
        return this.entitiesState().some(
          t => t.name.toLowerCase() === name.toLowerCase() && t.id !== currentId
        );
      }
      return this.entitiesState().some(t => t.name.toLowerCase() === name.toLowerCase());
    } catch {
      return false;
    }
  }

  getNextSortOrder(): number {
    return this.entitiesState().length + 1;
  }
}
