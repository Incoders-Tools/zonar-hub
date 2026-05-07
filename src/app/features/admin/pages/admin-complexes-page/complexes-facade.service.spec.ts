import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComplexesFacadeService } from './complexes-facade.service';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';

const adminDashboardSpy = jasmine.createSpyObj<AdminDashboardService>('AdminDashboardService', ['loadSummary']);
adminDashboardSpy.loadSummary.and.returnValue(Promise.resolve());

describe('ComplexesFacadeService', () => {
  let service: ComplexesFacadeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ComplexesFacadeService,
        ApiComplexRepository,
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting(),
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
