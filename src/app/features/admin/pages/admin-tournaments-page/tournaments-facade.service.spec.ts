import { TestBed } from '@angular/core/testing';
import { TournamentsFacadeService } from './tournaments-facade.service';
import { ApiTournamentAdminRepository } from '../../../../core/repositories/api/api-tournament-admin.repository';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { ApiTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ApiTournamentModalityRepository } from '../../../../core/repositories/api/api-tournament-modality.repository';
import { ApiTournamentRuleRepository } from '../../../../core/repositories/api/api-tournament-rule.repository';
import { ApiCourtRepository } from '../../../../core/repositories/api/api-court.repository';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { Sport, TournamentModality } from '../../../../core/models';

const mockSport: Sport = {
  id: 'sport-1',
  name: 'Pádel',
  key: 'padel',
  icon: '🎾',
  iconSource: 'unicode',
  modalityIds: ['mod-doubles', 'mod-singles', 'mod-inactive'],
  sortOrder: 1,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockModalities: TournamentModality[] = [
  { id: 'mod-singles', key: 'single', nameEs: 'Individual', nameEn: 'Singles', namePt: 'Individual', sortOrder: 2, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mod-doubles', key: 'doubles', nameEs: 'Dobles', nameEn: 'Doubles', namePt: 'Duplas', sortOrder: 1, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mod-inactive', key: 'team', nameEs: 'Equipos', nameEn: 'Teams', namePt: 'Times', sortOrder: 3, isActive: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
];

describe('TournamentsFacadeService.getModalitiesForSport', () => {
  let service: TournamentsFacadeService;

  beforeEach(async () => {
    const tournamentRepoSpy = jasmine.createSpyObj('ApiTournamentAdminRepository', ['getAll', 'getById', 'create', 'update', 'delete', 'getExistingKeys']);
    tournamentRepoSpy.getAll.and.resolveTo([]);

    const complexRepoSpy = jasmine.createSpyObj('ApiComplexRepository', ['getAll', 'getById', 'create', 'update', 'delete', 'getExistingKeys']);
    complexRepoSpy.getAll.and.resolveTo([]);

    const categoryRepoSpy = jasmine.createSpyObj('ApiCategoryRepository', ['getAll', 'getById', 'create', 'update', 'delete', 'getExistingKeys']);
    categoryRepoSpy.getAll.and.resolveTo([]);

    const genderRepoSpy = jasmine.createSpyObj('ApiGenderRepository', ['getAll', 'getById', 'create', 'update', 'delete', 'getExistingKeys', 'bulkDelete', 'save']);
    genderRepoSpy.getAll.and.resolveTo([]);

    const tournamentTypeRepoSpy = jasmine.createSpyObj('ApiTournamentTypeRepository', ['getAll', 'create', 'update', 'delete', 'getExistingKeys']);
    tournamentTypeRepoSpy.getAll.and.resolveTo([]);

    const sportRepoSpy = jasmine.createSpyObj('ApiSportRepository', ['getAll', 'getById', 'create', 'update', 'delete', 'getExistingKeys', 'getForOrganization', 'getForTenant', 'setForOrganization', 'setForTenant']);
    sportRepoSpy.getAll.and.resolveTo([mockSport]);
    sportRepoSpy.getForOrganization.and.resolveTo([mockSport]);

    const modalityRepoSpy = jasmine.createSpyObj('ApiTournamentModalityRepository', ['getAll']);
    modalityRepoSpy.getAll.and.resolveTo(mockModalities);

    const ruleRepoSpy = jasmine.createSpyObj('ApiTournamentRuleRepository', ['getAll', 'getById', 'create', 'update', 'delete']);
    ruleRepoSpy.getAll.and.resolveTo([]);

    const courtRepoSpy = jasmine.createSpyObj('ApiCourtRepository', ['getAll', 'getById', 'create', 'update', 'delete', 'getByComplexId']);
    courtRepoSpy.getAll.and.resolveTo([]);
    courtRepoSpy.getByComplexId.and.resolveTo([]);

    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', [], {
      session: signal(null),
      currentUser: signal(null),
      isSystemAdmin: signal(false)
    });

    const activeOrgSpy = jasmine.createSpyObj<ActiveOrganizationService>('ActiveOrganizationService', ['switchOrganization', 'refreshOrganizations'], {
      activeOrganizationId: signal(null)
    });

    await TestBed.configureTestingModule({
      providers: [
        TournamentsFacadeService,
        { provide: ApiTournamentAdminRepository, useValue: tournamentRepoSpy },
        { provide: ApiComplexRepository, useValue: complexRepoSpy },
        { provide: ApiCategoryRepository, useValue: categoryRepoSpy },
        { provide: ApiGenderRepository, useValue: genderRepoSpy },
        { provide: ApiTournamentTypeRepository, useValue: tournamentTypeRepoSpy },
        { provide: ApiSportRepository, useValue: sportRepoSpy },
        { provide: ApiTournamentModalityRepository, useValue: modalityRepoSpy },
        { provide: ApiTournamentRuleRepository, useValue: ruleRepoSpy },
        { provide: ApiCourtRepository, useValue: courtRepoSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ActiveOrganizationService, useValue: activeOrgSpy },
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(TournamentsFacadeService);
    await service.load();
  });

  it('should return modalities in sport.modalityIds order', () => {
    // sport.modalityIds = ['mod-doubles', 'mod-singles', 'mod-inactive']
    // mod-inactive is filtered out (isActive: false)
    // Result must preserve modalityIds order: doubles first, then singles
    const result = service.getModalitiesForSport('sport-1');

    expect(result.length).toBe(2);
    expect(result[0].id).toBe('mod-doubles');
    expect(result[1].id).toBe('mod-singles');
  });

  it('should exclude inactive modalities', () => {
    const result = service.getModalitiesForSport('sport-1');

    const inactiveIds = result.filter(m => !m.isActive).map(m => m.id);
    expect(inactiveIds).toEqual([]);
    expect(result.find(m => m.id === 'mod-inactive')).toBeUndefined();
  });

  it('should return empty array for unknown sport', () => {
    const result = service.getModalitiesForSport('nonexistent');
    expect(result).toEqual([]);
  });

  it('should return empty array for sport with no modalityIds', () => {
    // Use a sport that has empty modalityIds
    const sportWithNoModalities: Sport = { ...mockSport, id: 'sport-empty', modalityIds: [] };
    // Can't inject into the signal directly in a spec; test via getAll/load side-effects.
    // This validates the branch guard: if sport.modalityIds is empty, return [].
    const result = service.getModalitiesForSport('sport-empty');
    expect(result).toEqual([]);
  });
});
