import { Injectable, inject, signal, computed } from '@angular/core';
import { Complex, Court, Availability, ComplexServiceAssignment, ComplexSocialNetwork, Sport } from '../../../../core/models';
import { MockComplexRepository } from '../../../../core/repositories/mock/mock-complex.repository';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';

export interface ComplexFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class ComplexesFacadeService {
  private readonly repository = inject(MockComplexRepository);
  private readonly sportRepository = inject(MockSportRepository);

  // State signals
  private readonly entitiesState = signal<Complex[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<ComplexFilters>({});
  private readonly sortState = signal<string>('sortOrder_asc');

  // Courts state
  private readonly courtsState = signal<Court[]>([]);
  private readonly selectedCourtState = signal<Court | null>(null);
  private readonly loadingCourtsState = signal(false);
  private readonly savingCourtState = signal(false);

  // Availability state
  private readonly availabilityState = signal<Availability[]>([]);
  private readonly loadingAvailabilityState = signal(false);
  private readonly savingAvailabilityState = signal(false);

  // Service assignments state
  private readonly serviceAssignmentsState = signal<ComplexServiceAssignment[]>([]);
  private readonly loadingAssignmentsState = signal(false);
  private readonly savingAssignmentsState = signal(false);

  // Social networks state
  private readonly socialNetworksState = signal<ComplexSocialNetwork[]>([]);
  private readonly loadingNetworksState = signal(false);
  private readonly savingNetworksState = signal(false);

  // Sports state
  private readonly sportsState = signal<Sport[]>([]);

  // Public computed properties
  readonly entities = this.entitiesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  readonly courts = this.courtsState;
  readonly selectedCourt = this.selectedCourtState;
  readonly loadingCourts = this.loadingCourtsState;
  readonly savingCourt = this.savingCourtState;

  readonly availability = this.availabilityState;
  readonly loadingAvailability = this.loadingAvailabilityState;
  readonly savingAvailability = this.savingAvailabilityState;

  readonly serviceAssignments = this.serviceAssignmentsState;
  readonly loadingAssignments = this.loadingAssignmentsState;
  readonly savingAssignments = this.savingAssignmentsState;

  readonly socialNetworks = this.socialNetworksState;
  readonly loadingNetworks = this.loadingNetworksState;
  readonly savingNetworks = this.savingNetworksState;

  readonly sports = this.sportsState;

  readonly filteredComplexes = computed(() => {
    const complexes = this.entitiesState();
    const filters = this.filtersState();

    let result = [...complexes];

    // Filter by name
    if (filters.name?.trim()) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(searchTerm));
    }

    // Filter by isActive
    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(c => c.isActive === isActive);
    }

    // Apply sorting
    const sortOption = this.sortState();
    if (sortOption === 'sortOrder_asc') {
      result.sort((a, b) => a.sortOrder - b.sortOrder);
    } else if (sortOption === 'sortOrder_desc') {
      result.sort((a, b) => b.sortOrder - a.sortOrder);
    } else if (sortOption === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === 'preponderance_asc') {
      result.sort((a, b) => a.preponderance - b.preponderance);
    } else if (sortOption === 'preponderance_desc') {
      result.sort((a, b) => b.preponderance - a.preponderance);
    }

    return result;
  });

  // --- Complex CRUD ---

  async load(): Promise<void> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const [complexes, sports] = await Promise.all([
        this.repository.getAll(),
        this.sportRepository.getAll()
      ]);
      this.entitiesState.set(complexes);
      this.sportsState.set(sports.filter(s => s.isActive));
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: ComplexFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  async saveComplex(complex: Complex | Omit<Complex, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      const isUpdate = 'id' in complex && complex.id;

      if (isUpdate) {
        const updated = await this.repository.update((complex as Complex).id, complex);
        const idx = this.entitiesState().findIndex(c => c.id === (complex as Complex).id);
        if (idx !== -1) {
          const updatedList = [...this.entitiesState()];
          updatedList[idx] = updated;
          this.entitiesState.set(updatedList);
        }
      } else {
        const created = await this.repository.create(complex as Omit<Complex, 'id' | 'createdAt' | 'updatedAt'>);
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

  async deleteComplex(id: string): Promise<boolean> {
    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await this.repository.delete(id);
      this.entitiesState.set(this.entitiesState().filter(c => c.id !== id));
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
      this.entitiesState.set(this.entitiesState().filter(c => !ids.includes(c.id)));
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
        const currentEntity = this.entitiesState().find(c => c.id === currentId);
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
          c => c.name.toLowerCase() === name.toLowerCase() && c.id !== currentId
        );
      }
      return this.entitiesState().some(c => c.name.toLowerCase() === name.toLowerCase());
    } catch {
      return false;
    }
  }

  async checkSortOrderExists(sortOrder: number | null, currentId?: string): Promise<boolean> {
    try {
      if (!sortOrder || sortOrder === 0) {
        return false;
      }
      if (currentId) {
        return this.entitiesState().some(
          c => c.sortOrder === sortOrder && c.id !== currentId
        );
      }
      return this.entitiesState().some(c => c.sortOrder === sortOrder);
    } catch {
      return false;
    }
  }

  getNextSortOrder(): number {
    const max = Math.max(0, ...this.entitiesState().map(c => c.sortOrder ?? 0));
    return max + 1;
  }

  getNextPreponderance(): number {
    const max = Math.max(0, ...this.entitiesState().map(c => c.preponderance ?? 0));
    return max + 1;
  }

  // --- Courts ---

  async loadCourts(complexId: string): Promise<void> {
    try {
      this.loadingCourtsState.set(true);
      const courts = await this.repository.getCourtsByComplexId(complexId);
      this.courtsState.set(courts);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingCourtsState.set(false);
    }
  }

  async saveCourt(court: Court | Omit<Court, 'id'>): Promise<boolean> {
    try {
      this.savingCourtState.set(true);
      const isUpdate = 'id' in court && court.id;

      if (isUpdate) {
        const updated = await this.repository.updateCourt((court as Court).id, court);
        const idx = this.courtsState().findIndex(ct => ct.id === (court as Court).id);
        if (idx !== -1) {
          const updatedList = [...this.courtsState()];
          updatedList[idx] = updated;
          this.courtsState.set(updatedList);
        }
      } else {
        const created = await this.repository.createCourt(court as Omit<Court, 'id'>);
        this.courtsState.set([...this.courtsState(), created]);
        // Update courtsCount in local state
        const complexId = (court as Omit<Court, 'id'>).complexId;
        this.entitiesState.update(list =>
          list.map(c => c.id === complexId ? { ...c, courtsCount: this.courtsState().length } : c)
        );
      }

      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingCourtState.set(false);
    }
  }

  async deleteCourt(id: string): Promise<boolean> {
    try {
      this.savingCourtState.set(true);
      const court = this.courtsState().find(ct => ct.id === id);
      await this.repository.deleteCourt(id);
      this.courtsState.set(this.courtsState().filter(ct => ct.id !== id));
      // Update courtsCount in local state
      if (court) {
        this.entitiesState.update(list =>
          list.map(c => c.id === court.complexId ? { ...c, courtsCount: this.courtsState().length } : c)
        );
      }
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingCourtState.set(false);
    }
  }

  // --- Availability ---

  async loadAvailability(courtId: string): Promise<void> {
    try {
      this.loadingAvailabilityState.set(true);
      const availability = await this.repository.getAvailabilityByCourtId(courtId);
      this.availabilityState.set(availability);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingAvailabilityState.set(false);
    }
  }

  async saveAvailabilitySlots(courtId: string, slots: Omit<Availability, 'id' | 'courtId'>[]): Promise<boolean> {
    try {
      this.savingAvailabilityState.set(true);
      const saved = await this.repository.saveAvailability(courtId, slots);
      this.availabilityState.set(saved);
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingAvailabilityState.set(false);
    }
  }

  // --- Service Assignments ---

  async loadServiceAssignments(complexId: string): Promise<void> {
    try {
      this.loadingAssignmentsState.set(true);
      const assignments = await this.repository.getServiceAssignments(complexId);
      this.serviceAssignmentsState.set(assignments);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingAssignmentsState.set(false);
    }
  }

  async saveServiceAssignments(complexId: string, assignments: ComplexServiceAssignment[]): Promise<boolean> {
    try {
      this.savingAssignmentsState.set(true);
      const saved = await this.repository.saveServiceAssignments(complexId, assignments);
      this.serviceAssignmentsState.set(saved);
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingAssignmentsState.set(false);
    }
  }

  // --- Social Networks ---

  async loadSocialNetworks(complexId: string): Promise<void> {
    try {
      this.loadingNetworksState.set(true);
      const networks = await this.repository.getSocialNetworks(complexId);
      this.socialNetworksState.set(networks);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingNetworksState.set(false);
    }
  }

  async saveSocialNetworks(complexId: string, networks: ComplexSocialNetwork[]): Promise<boolean> {
    try {
      this.savingNetworksState.set(true);
      const saved = await this.repository.saveSocialNetworks(complexId, networks);
      this.socialNetworksState.set(saved);
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingNetworksState.set(false);
    }
  }
}
