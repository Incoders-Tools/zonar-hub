import { TestBed } from '@angular/core/testing';
import { SportsFacadeService } from './sports-facade.service';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ApiTournamentModalityRepository } from '../../../../core/repositories/api/api-tournament-modality.repository';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { Sport } from '../../../../core/models';
import { signal } from '@angular/core';

const seededSports: Sport[] = [
  { id: 'sp1', name: 'Pádel', key: 'padel', icon: '🎾', iconSource: 'unicode', modalityIds: [], sortOrder: 1, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'sp2', name: 'Tenis', key: 'tenis', icon: '🎾', iconSource: 'unicode', modalityIds: [], sortOrder: 2, isActive: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'sp3', name: 'Pádel Indoor', key: 'padel_indoor', icon: '🏟', iconSource: 'unicode', modalityIds: [], sortOrder: 3, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
];

describe('SportsFacadeService', () => {
  let service: SportsFacadeService;
  let repositorySpy: jasmine.SpyObj<ApiSportRepository>;
  let modalityRepoSpy: jasmine.SpyObj<ApiTournamentModalityRepository>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj<ApiSportRepository>('ApiSportRepository', [
      'getAll', 'getById', 'create', 'update', 'delete', 'getExistingKeys',
      'getForOrganization', 'getForTenant', 'setForOrganization', 'setForTenant'
    ]);
    repositorySpy.getAll.and.resolveTo([...seededSports]);
    repositorySpy.getExistingKeys.and.resolveTo(seededSports.map(s => s.key));

    modalityRepoSpy = jasmine.createSpyObj<ApiTournamentModalityRepository>('ApiTournamentModalityRepository', ['getAll']);
    modalityRepoSpy.getAll.and.resolveTo([]);

    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [], {
      session: signal(null),
      currentUser: signal(null),
      isSystemAdmin: signal(true)
    });

    const orgContextSpy = jasmine.createSpyObj<OrganizationContextService>('OrganizationContextService', [], {
      organizationId: signal(null)
    });

    const tenantContextSpy = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], {
      tenantId: signal(null)
    });

    TestBed.configureTestingModule({
      providers: [
        SportsFacadeService,
        { provide: ApiSportRepository, useValue: repositorySpy },
        { provide: ApiTournamentModalityRepository, useValue: modalityRepoSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: OrganizationContextService, useValue: orgContextSpy },
        { provide: TenantContextService, useValue: tenantContextSpy }
      ]
    });

    service = TestBed.inject(SportsFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load sports', async () => {
    await service.load();
    expect(service.entities().length).toBe(3);
    expect(service.loading()).toBe(false);
  });

  it('should filter sports by name', async () => {
    await service.load();
    service.applyFilters({ name: 'Pádel' });
    expect(service.filteredSports().every(s => s.name.toLowerCase().includes('pádel'))).toBe(true);
  });

  it('should filter sports by active status', async () => {
    await service.load();
    service.applyFilters({ isActive: 'true' });
    expect(service.filteredSports().every(s => s.isActive === true)).toBe(true);
  });

  it('should clear filters', async () => {
    await service.load();
    service.applyFilters({ name: 'test' });
    service.clearFilters();
    expect(service.filteredSports().length).toBe(service.entities().length);
  });

  it('should save new sport', async () => {
    const newSport = { id: 'sp4', name: 'Test Sport', key: 'test_sport', icon: '🏀', iconSource: 'unicode' as const, modalityIds: [], sortOrder: 99, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    // First call (initial load): returns 3 sports; second call (after save): returns 4
    repositorySpy.getAll.and.returnValues(
      Promise.resolve([...seededSports]),
      Promise.resolve([...seededSports, newSport])
    );
    repositorySpy.create.and.resolveTo(newSport);

    await service.load();
    const beforeCount = service.entities().length;
    const success = await service.saveSport({ name: newSport.name, key: newSport.key, icon: newSport.icon, iconSource: newSport.iconSource, modalityIds: [], sortOrder: 99, isActive: true });
    expect(success).toBe(true);
    expect(service.entities().length).toBe(beforeCount + 1);
  });

  it('should delete sport', async () => {
    repositorySpy.delete.and.resolveTo();
    await service.load();
    const sportToDelete = service.entities()[0];

    const success = await service.deleteSport(sportToDelete.id);
    expect(success).toBe(true);
    expect(service.entities().find(s => s.id === sportToDelete.id)).toBeUndefined();
  });

  it('should check key uniqueness', async () => {
    await service.load();
    const existingKey = seededSports[0].key;

    const exists = await service.checkKeyExists(existingKey);
    expect(exists).toBe(true);

    const notExists = await service.checkKeyExists('unique_key_that_does_not_exist');
    expect(notExists).toBe(false);
  });

  it('should sort sports', async () => {
    await service.load();
    service.applySortOption('name_asc');

    const filtered = service.filteredSports();
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
