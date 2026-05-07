import { TestBed } from '@angular/core/testing';
import { TournamentsFacadeService } from './tournaments-facade.service';
import { MockTournamentAdminRepository } from '../../../../core/repositories/mock/mock-tournament-admin.repository';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { MockTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';

describe('TournamentsFacadeService', () => {
  let service: TournamentsFacadeService;

  const mockTournamentData = {
    name: 'Test Tournament',
    complexId: 'cx1',
    complexName: 'Club Padel Norte',
    categoryId: 'cat1',
    categoryName: '4ta',
    genderId: 'g1',
    genderLabel: 'Masculino',
    tournamentTypeId: 'tt1',
    tournamentTypeName: 'Zonas + Eliminación',
    sportId: 'sp1',
    sportName: 'Padel',
    statusId: 'ts1',
    statusLabel: 'Próximo',
    startDate: '2027-06-01',
    endDate: '2027-06-10',
    registrationStartDate: '2027-05-01',
    registrationEndDate: '2027-05-25',
    maxPairs: 16,
    description: 'Test tournament description',
    rules: 'Test rules',
    isActive: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TournamentsFacadeService,
        MockTournamentAdminRepository,
        ApiComplexRepository,
        ApiCategoryRepository,
        ApiGenderRepository,
        MockTournamentTypeRepository,
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TournamentsFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load tournaments and lookups', async () => {
    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
    expect(service.complexes().length).toBeGreaterThan(0);
    expect(service.categories().length).toBeGreaterThan(0);
    expect(service.genders().length).toBeGreaterThan(0);
    expect(service.tournamentTypes().length).toBeGreaterThan(0);
    expect(service.loading()).toBe(false);
  });

  it('should filter tournaments by name', async () => {
    await service.load();
    service.applyFilters({ name: 'Copa' });
    expect(service.filteredTournaments().every(t => t.name.toLowerCase().includes('copa'))).toBe(true);
  });

  it('should clear filters', async () => {
    await service.load();
    service.applyFilters({ name: 'test' });
    service.clearFilters();
    const beforeClear = service.entities().length;
    const afterClear = service.filteredTournaments().length;
    expect(beforeClear).toBe(afterClear);
  });

  it('should save new tournament', async () => {
    await service.load();
    const beforeCount = service.entities().length;

    const success = await service.saveTournament(mockTournamentData);
    expect(success).toBe(true);
    expect(service.entities().length).toBe(beforeCount + 1);
  });

  it('should delete tournament', async () => {
    await service.load();
    const tournamentToDelete = service.entities()[0];

    const success = await service.deleteTournament(tournamentToDelete.id);
    expect(success).toBe(true);
    expect(service.entities().find(t => t.id === tournamentToDelete.id)).toBeUndefined();
  });

  it('should compute status with i18n label keys', () => {
    const pastStatus = service.computeStatus('2020-01-01', '2020-01-10');
    expect(pastStatus.key).toBe('finished');
    expect(pastStatus.labelKey).toBe('admin.tournaments.status.finished');

    const futureStatus = service.computeStatus('2099-01-01', '2099-01-10');
    expect(futureStatus.key).toBe('upcoming');
    expect(futureStatus.labelKey).toBe('admin.tournaments.status.upcoming');
  });

  it('should load courts for a complex', async () => {
    await service.load();
    const complexId = service.complexes()[0]?.id;
    if (complexId) {
      await service.loadCourtsForComplex(complexId);
      expect(service.courtsForComplex().length).toBeGreaterThanOrEqual(0);
      expect(service.loadingCourts()).toBe(false);
    }
  });

  it('should resolve lookup names', async () => {
    await service.load();
    const complex = service.complexes()[0];
    if (complex) {
      expect(service.getComplexName(complex.id)).toBe(complex.name);
    }
  });

  it('should sort tournaments', async () => {
    await service.load();
    service.applySortOption('name_asc');

    const filtered = service.filteredTournaments();
    for (let i = 0; i < filtered.length - 1; i++) {
      expect(filtered[i].name <= filtered[i + 1].name).toBe(true);
    }
  });

  it('should get next sort order', async () => {
    await service.load();
    const nextOrder = service.getNextSortOrder();
    expect(nextOrder).toBeGreaterThan(0);
  });
});
