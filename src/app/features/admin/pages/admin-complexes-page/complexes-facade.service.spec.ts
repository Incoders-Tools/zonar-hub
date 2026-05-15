import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ComplexesFacadeService } from './complexes-facade.service';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';
import { Complex, Court, Availability } from '../../../../core/models';

const seededComplexes: Complex[] = [
  { id: 'cx1', name: 'Club Pádel Norte', key: 'club_padel_norte', address: 'Av. Norte 100', location: 'Palermo', cityId: '', cityName: '', sortOrder: 1, preponderance: 1, sportsSupported: [], courtsCount: 2, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'cx2', name: 'Centro Sur', key: 'centro_sur', address: 'Av. Sur 200', location: 'Sur', cityId: '', cityName: '', sortOrder: 2, preponderance: 2, sportsSupported: [], courtsCount: 1, isActive: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
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

  beforeEach(() => {
    complexRepoSpy = jasmine.createSpyObj<ApiComplexRepository>('ApiComplexRepository', [
      'getAll', 'getForOrganization', 'getById', 'create', 'update', 'delete',
      'getExistingKeys', 'getCourtsByComplexId', 'createCourt', 'updateCourt',
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

    const activeOrgSpy = jasmine.createSpyObj<ActiveOrganizationService>('ActiveOrganizationService', [], {
      activeOrganizationId: signal(null)
    });

    const adminDashboardSpy = jasmine.createSpyObj<AdminDashboardService>('AdminDashboardService', ['loadSummary']);
    adminDashboardSpy.loadSummary.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        ComplexesFacadeService,
        { provide: ApiComplexRepository, useValue: complexRepoSpy },
        { provide: ApiSportRepository, useValue: sportRepoSpy },
        { provide: ActiveOrganizationService, useValue: activeOrgSpy },
        { provide: AdminDashboardService, useValue: adminDashboardSpy }
      ]
    });

    service = TestBed.inject(ComplexesFacadeService);
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
