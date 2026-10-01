import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ComplexesFacadeService } from './complexes-facade.service';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';
import { Complex, Court, Availability } from '../../../../core/models';
import { SaveComplexWithCourtsRequest } from '../../../../core/repositories/complex.repository';

const seededComplexes: Complex[] = [
  { id: 'cx1', organizationId: 'org1', name: 'Club Pádel Norte', key: 'club_padel_norte', address: 'Av. Norte 100', location: 'Palermo', cityId: '', cityName: '', sortOrder: 1, preponderance: 1, sportsSupported: [], courtsCount: 2, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'cx2', organizationId: 'org1', name: 'Centro Sur', key: 'centro_sur', address: 'Av. Sur 200', location: 'Sur', cityId: '', cityName: '', sortOrder: 2, preponderance: 2, sportsSupported: [], courtsCount: 1, isActive: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
];

const seededCourts: Court[] = [
  { id: 'ct1', complexId: 'cx1', name: 'Cancha 1', isActive: true }
];

const seededAvailability: Availability[] = [
  { id: 'av1', courtId: 'ct1', dayOfWeek: 1, timeFrom: '08:00', timeTo: '10:00', isAvailable: true }
];

describe('ComplexesFacadeService', () => {
  let service: ComplexesFacadeService;
  let complexRepoSpy: jasmine.SpyObj<ApiComplexRepository>;
  let sportRepoSpy: jasmine.SpyObj<ApiSportRepository>;
  let organizationId: ReturnType<typeof signal<string | null>>;
  let dashboardSpy: jasmine.SpyObj<AdminDashboardService>;

  beforeEach(() => {
    complexRepoSpy = jasmine.createSpyObj<ApiComplexRepository>('ApiComplexRepository', [
      'getAll', 'getForOrganization', 'getById', 'create', 'update', 'delete',
      'getExistingKeys', 'getCourtsByComplexId', 'createCourt', 'updateCourt', 'saveWithCourts',
      'deleteCourt', 'getAvailabilityByCourtId', 'saveAvailability'
    ]);
    complexRepoSpy.getAll.and.resolveTo([...seededComplexes]);
    complexRepoSpy.getExistingKeys.and.resolveTo(seededComplexes.map(c => c.key));
    complexRepoSpy.getCourtsByComplexId.and.resolveTo([...seededCourts]);
    complexRepoSpy.getAvailabilityByCourtId.and.resolveTo([...seededAvailability]);
    complexRepoSpy.delete.and.resolveTo();

    sportRepoSpy = jasmine.createSpyObj<ApiSportRepository>('ApiSportRepository', [
      'getAll', 'getForOrganization', 'getForTenant', 'setForOrganization', 'setForTenant',
      'getById', 'create', 'update', 'delete', 'getExistingKeys'
    ]);
    sportRepoSpy.getAll.and.resolveTo([]);

    organizationId = signal<string | null>('org1');
    const activeOrgSpy = jasmine.createSpyObj<ActiveOrganizationService>('ActiveOrganizationService', [], {
      activeOrganizationId: organizationId
    });

    dashboardSpy = jasmine.createSpyObj<AdminDashboardService>('AdminDashboardService', ['loadSummary']);
    dashboardSpy.loadSummary.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        ComplexesFacadeService,
        { provide: ApiComplexRepository, useValue: complexRepoSpy },
        { provide: ApiSportRepository, useValue: sportRepoSpy },
        { provide: ActiveOrganizationService, useValue: activeOrgSpy },
        { provide: AdminDashboardService, useValue: dashboardSpy }
      ]
    });

    service = TestBed.inject(ComplexesFacadeService);
  });

  it('saves new complex and configured draft courts in one request without a follow-up read', async () => {
    complexRepoSpy.saveWithCourts.and.resolveTo({ complexId: 'cx3', courtCount: 2, courtIds: ['ct3', 'ct4'] });
    const draft = { ...seededComplexes[0], id: null, name: 'New complex', organizationId: 'wrong' };
    const courts = [{ ...seededCourts[0], id: null, sportIds: ['sport1'], surfaceType: 'clay', isIndoor: true }];
    expect(await service.saveComplexWithCourts(draft, courts, [])).toBe(true);
    expect(complexRepoSpy.saveWithCourts).toHaveBeenCalledOnceWith(jasmine.objectContaining<SaveComplexWithCourtsRequest>({
      complexId: null, organizationId: 'org1', name: 'New complex', address: draft.address,
      courts: [{ id: null, name: 'Cancha 1', isActive: true, surfaceType: 'clay', isIndoor: true, sportIds: ['sport1'] }],
      deleteCourtIds: []
    }));
    expect(service.entities()[0]).toEqual(jasmine.objectContaining({ id: 'cx3', courtsCount: 2, organizationId: 'org1' }));
    expect(dashboardSpy.loadSummary).toHaveBeenCalledOnceWith('org1');
    expect(complexRepoSpy.getById).not.toHaveBeenCalled();
    expect(complexRepoSpy.create).not.toHaveBeenCalled();
    expect(complexRepoSpy.createCourt).not.toHaveBeenCalled();
  });

  it('updates existing complex count and passes explicit deletions while preserving omitted associations', async () => {
    await service.load();
    complexRepoSpy.saveWithCourts.and.resolveTo({ complexId: 'cx1', courtCount: 4, courtIds: ['ct1'] });
    expect(await service.saveComplexWithCourts({ ...seededComplexes[0], name: 'Renamed' }, [
      { ...seededCourts[0], id: 'temporary-real' }, { ...seededCourts[0], id: 'ct2', sportIds: [] }
    ], ['ct9'])).toBe(true);
    expect(complexRepoSpy.saveWithCourts).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      complexId: 'cx1', deleteCourtIds: ['ct9'], courts: [
        { id: 'temporary-real', name: 'Cancha 1', isActive: true, surfaceType: null, isIndoor: false, sportIds: null },
        { id: 'ct2', name: 'Cancha 1', isActive: true, surfaceType: null, isIndoor: false, sportIds: [] }
      ]
    }));
    expect(service.entities()[0]).toEqual(jasmine.objectContaining({ name: 'Renamed', courtsCount: 4 }));
    expect(dashboardSpy.loadSummary).not.toHaveBeenCalled();
    expect(complexRepoSpy.update).not.toHaveBeenCalled();
    expect(complexRepoSpy.updateCourt).not.toHaveBeenCalled();
    expect(complexRepoSpy.deleteCourt).not.toHaveBeenCalled();
  });

  it('preserves local state and exposes errors when aggregate persistence fails', async () => {
    await service.load();
    const before = service.entities();
    complexRepoSpy.saveWithCourts.and.rejectWith(new Error('atomic failure'));
    expect(await service.saveComplexWithCourts(seededComplexes[0], [], ['ct1'])).toBe(false);
    expect(service.entities()).toBe(before);
    expect(service.error()).toBe('atomic failure');
    expect(service.saving()).toBe(false);
    expect(complexRepoSpy.deleteCourt).not.toHaveBeenCalled();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load complexes', async () => {
    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
    expect(service.loading()).toBe(false);
  });

  it('should filter complexes by name', async () => {
    await service.load();
    service.applyFilters({ name: 'Norte' });
    expect(service.filteredComplexes().length).toBe(1);
    expect(service.filteredComplexes()[0].name).toContain('Norte');
  });

  it('should filter complexes by active status', async () => {
    await service.load();
    service.applyFilters({ isActive: 'false' });
    expect(service.filteredComplexes().every(c => !c.isActive)).toBe(true);
  });

  it('should clear filters', async () => {
    await service.load();
    service.applyFilters({ name: 'Norte' });
    service.clearFilters();
    expect(service.filteredComplexes().length).toBe(service.entities().length);
  });

  it('should sort complexes', async () => {
    await service.load();
    service.applySortOption('name_asc');
    const names = service.filteredComplexes().map(c => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('should get next sort order', async () => {
    await service.load();
    const next = service.getNextSortOrder();
    const max = Math.max(...service.entities().map(c => c.sortOrder));
    expect(next).toBe(max + 1);
  });

  it('should check key exists', async () => {
    await service.load();
    const exists = await service.checkKeyExists('club_padel_norte');
    expect(exists).toBe(true);

    const notExists = await service.checkKeyExists('nonexistent_key');
    expect(notExists).toBe(false);
  });

  it('should check name exists', async () => {
    await service.load();
    const exists = await service.checkNameExists('Club Pádel Norte');
    expect(exists).toBe(true);

    const notExists = await service.checkNameExists('Nonexistent Complex');
    expect(notExists).toBe(false);
  });

  it('should delete a complex', async () => {
    await service.load();
    const initialCount = service.entities().length;
    const success = await service.deleteComplex('cx1');
    expect(success).toBe(true);
    expect(service.entities().length).toBe(initialCount - 1);
  });

  it('should load courts for a complex', async () => {
    await service.loadCourts('cx1');
    expect(service.courts().length).toBeGreaterThan(0);
    expect(service.loadingCourts()).toBe(false);
  });

  it('should load availability for a court', async () => {
    await service.loadAvailability('ct1');
    expect(service.availability().length).toBeGreaterThan(0);
    expect(service.loadingAvailability()).toBe(false);
  });
});
