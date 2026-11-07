import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Complex, Court, Availability, Sport } from '../../../../core/models';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { SaveComplexWithCourtsRequest } from '../../../../core/repositories/complex.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';

export type CourtDraft = Omit<Court, 'id'> & { id: string | null };

type ComplexDraft = Omit<Complex, 'id' | 'createdAt' | 'updatedAt'> & { id?: null };

export interface ComplexFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class ComplexesFacadeService {
  private readonly repository = inject(ApiComplexRepository);
  private readonly sportRepository = inject(ApiSportRepository);
  private readonly activeOrg = inject(ActiveOrganizationService);
  private readonly adminDashboard = inject(AdminDashboardService);
  private lastOrgId: string | null | undefined = undefined;
  private loadRequestSequence = 0;
  private requestedOrgId: string | null | undefined = undefined;

  constructor() {
    effect(() => {
      const currentOrgId = this.activeOrg.activeOrganizationId();
      if (this.lastOrgId !== undefined && currentOrgId !== this.lastOrgId) {
        this.invalidateCourts();
        this.load();
      }
      this.lastOrgId = currentOrgId;
    });
  }

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
  private readonly loadingCourtsState = signal(false);
  // Scoped to court reads so a failure never replaces the complexes collection with its error state.
  private readonly courtsErrorState = signal<string | null>(null);
  private courtsRequestSequence = 0;

  // Availability state
  private readonly availabilityState = signal<Availability[]>([]);
  private readonly loadingAvailabilityState = signal(false);
  private readonly savingAvailabilityState = signal(false);

  // Sports state
  private readonly sportsState = signal<Sport[]>([]);

  // Public computed properties
  readonly entities = this.entitiesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  readonly courts = this.courtsState;
  readonly loadingCourts = this.loadingCourtsState;
  readonly courtsError = this.courtsErrorState;

  readonly availability = this.availabilityState;
  readonly loadingAvailability = this.loadingAvailabilityState;
  readonly savingAvailability = this.savingAvailabilityState;

  readonly sports = this.sportsState;

  readonly filteredComplexes = computed(() => {
    const complexes = this.entitiesState();
    const filters = this.filtersState();
    const activeOrgId = this.activeOrg.activeOrganizationId();

    let result = [...complexes];

    // Filter by active organization — only show complexes that belong to the selected org
    if (activeOrgId) {
      result = result.filter(c => c.organizationId === activeOrgId);
    }

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
    const requestSequence = ++this.loadRequestSequence;
    const activeOrgId = this.activeOrg.activeOrganizationId();
    if (this.requestedOrgId !== undefined && activeOrgId !== this.requestedOrgId) {
      this.entitiesState.set([]);
      this.sportsState.set([]);
      this.invalidateCourts();
      this.availabilityState.set([]);
    }
    this.requestedOrgId = activeOrgId;
    const isCurrent = () => requestSequence === this.loadRequestSequence
      && activeOrgId === this.activeOrg.activeOrganizationId();
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const [complexes, sports] = await Promise.all([
        this.repository.getAll(),
        activeOrgId
          ? this.sportRepository.getForOrganization(activeOrgId)
          : this.sportRepository.getAll()
      ]);
      if (!isCurrent()) return;
      this.entitiesState.set(complexes);
      this.sportsState.set(sports.filter(s => s.isActive));
    } catch (error) {
      if (isCurrent()) this.errorState.set((error as Error).message);
    } finally {
      if (isCurrent()) this.loadingState.set(false);
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
        // Refresh dashboard so the onboarding checklist reflects the new complex
        const activeOrgId = this.activeOrg.activeOrganizationId();
        if (activeOrgId) {
          this.adminDashboard.loadSummary(activeOrgId);
        }
      }

      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async saveComplexWithCourts(
    complex: Complex | ComplexDraft,
    courts: CourtDraft[],
    deleteCourtIds: string[],
    expectedOrganizationId: string | null = this.activeOrg.activeOrganizationId()
  ): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);
      const organizationId = expectedOrganizationId;
      if (!organizationId || this.activeOrg.activeOrganizationId() !== organizationId) {
        throw new Error('Active organization changed before save');
      }
      const complexId = complex.id ?? null;
      const request: SaveComplexWithCourtsRequest = {
        complexId,
        organizationId,
        name: complex.name,
        address: complex.address,
        key: complex.key || null,
        location: complex.location || null,
        description: complex.description || null,
        sortOrder: complex.sortOrder,
        preponderance: complex.preponderance,
        logoImagePath: complex.logoImagePath || null,
        coverImagePath: complex.coverImagePath || null,
        layoutDiagramPath: complex.layoutDiagramPath || null,
        isActive: complex.isActive,
        courts: courts.map(court => ({
          id: court.id,
          name: court.name,
          isActive: court.isActive,
          surfaceType: court.surfaceType ?? null,
          isIndoor: court.isIndoor ?? false,
          sportIds: court.sportIds ?? null
        })),
        deleteCourtIds
      };
      if (this.activeOrg.activeOrganizationId() !== organizationId) return false;
      const result = await this.repository.saveWithCourts(request);
      if (this.activeOrg.activeOrganizationId() !== organizationId) return true;
      const now = new Date().toISOString();
      const saved: Complex = {
        ...complex,
        id: result.complexId,
        organizationId,
        courtsCount: result.courtCount,
        createdAt: 'createdAt' in complex ? complex.createdAt : now,
        updatedAt: now
      };
      this.entitiesState.update(list => {
        const index = list.findIndex(item => item.id === result.complexId);
        if (index === -1) return [...list, saved];
        const updated = [...list];
        updated[index] = saved;
        return updated;
      });
      if (!complexId) {
        // Dashboard refresh is independent of the committed aggregate save.
        try {
          await this.adminDashboard.loadSummary(organizationId);
        } catch {
          // A stale dashboard must not turn a committed create into a retryable failure.
        }
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

  invalidateCourts(): void {
    ++this.courtsRequestSequence;
    this.courtsState.set([]);
    this.loadingCourtsState.set(false);
    this.courtsErrorState.set(null);
  }

  async loadCourts(complexId: string): Promise<boolean> {
    const requestSequence = ++this.courtsRequestSequence;
    const organizationId = this.activeOrg.activeOrganizationId();
    const isCurrent = () => requestSequence === this.courtsRequestSequence
      && organizationId === this.activeOrg.activeOrganizationId();
    try {
      this.loadingCourtsState.set(true);
      this.courtsErrorState.set(null);
      const courts = await this.repository.getCourtsByComplexId(complexId);
      if (!isCurrent()) return false;
      this.courtsState.set(courts);
      return true;
    } catch (error) {
      if (isCurrent()) {
        this.courtsErrorState.set((error as Error).message);
      }
      return false;
    } finally {
      if (requestSequence === this.courtsRequestSequence) {
        this.loadingCourtsState.set(false);
      }
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

}
