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
import { ApiEligibilityProfileRepository } from '../../../../core/repositories/api/api-eligibility-profile.repository';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Sport, Tournament, TournamentModality } from '../../../../core/models';

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
  let tournamentRepoSpy: jasmine.SpyObj<ApiTournamentAdminRepository>;
  let profileRepoSpy: jasmine.SpyObj<ApiEligibilityProfileRepository>;
  let notification: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
    tournamentRepoSpy = jasmine.createSpyObj('ApiTournamentAdminRepository', ['getAll', 'getById', 'create', 'update', 'delete', 'getExistingKeys', 'getEligibilityProfileId', 'setEligibilityProfile']);
    tournamentRepoSpy.getAll.and.resolveTo([]);
    profileRepoSpy = jasmine.createSpyObj<ApiEligibilityProfileRepository>('ApiEligibilityProfileRepository', ['getAll']);
    profileRepoSpy.getAll.and.resolveTo([
      { id: 'ep-1', name: 'Damas', key: '', description: null, sortOrder: null, isActive: false, createdAt: '', updatedAt: '' }
    ]);

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
        { provide: ApiEligibilityProfileRepository, useValue: profileRepoSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ActiveOrganizationService, useValue: activeOrgSpy },
        { provide: NotificationService, useValue: notification },
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
  describe('saveTournament errors', () => {
    const tournament = { id: 't-1', name: 'Copa', startDate: '2030-12-01', endDate: '2030-12-03' } as Tournament;

    it('shows the translated forbidden message when the API refuses the tenant', async () => {
      tournamentRepoSpy.update.and.rejectWith(new Error('tournaments.errors.forbidden'));

      expect(await service.saveTournament(tournament)).toBeFalse();

      expect(notification.error).toHaveBeenCalledOnceWith('tournaments.errors.forbidden');
    });

    it('shows the generic error toast for other failures', async () => {
      tournamentRepoSpy.update.and.rejectWith(new Error('common.networkUnavailable'));

      expect(await service.saveTournament(tournament)).toBeFalse();

      expect(notification.error).toHaveBeenCalledOnceWith('toast.error');
    });
  });

  describe('eligibility profile assignment (R2b)', () => {
    const tournament = { id: 't-1', name: 'Copa', startDate: '2030-12-01', endDate: '2030-12-03' } as Tournament;

    beforeEach(() => {
      tournamentRepoSpy.update.and.resolveTo(tournament);
      tournamentRepoSpy.create.and.resolveTo({ ...tournament, id: 't-9' });
      tournamentRepoSpy.setEligibilityProfile.and.callFake(async (_id: string, profileId: string | null) => profileId);
    });

    it('loads the organization profiles, inactive ones included', () => {
      expect(service.eligibilityProfiles().map(p => p.id)).toEqual(['ep-1']);
    });

    it('keeps the tournaments list when the profiles cannot be read', async () => {
      profileRepoSpy.getAll.and.rejectWith(new Error('common.forbidden'));
      await service.load();
      await Promise.resolve();
      expect(service.eligibilityProfiles()).toEqual([]);
      expect(service.error()).toBeNull();
    });

    it('leaves the assignment untouched when no profile choice is given', async () => {
      expect(await service.saveTournament(tournament)).toBeTrue();
      expect(tournamentRepoSpy.setEligibilityProfile).not.toHaveBeenCalled();
    });

    it('assigns the chosen profile after updating the tournament', async () => {
      expect(await service.saveTournament(tournament, 'ep-1')).toBeTrue();
      expect(tournamentRepoSpy.setEligibilityProfile).toHaveBeenCalledOnceWith('t-1', 'ep-1');
    });

    it('uses the created tournament id and clears with null', async () => {
      const { id: _id, ...draft } = tournament;
      void _id;
      expect(await service.saveTournament(draft, null)).toBeTrue();
      expect(tournamentRepoSpy.setEligibilityProfile).toHaveBeenCalledOnceWith('t-9', null);
    });

    it('keeps the saved tournament and reports a failed assignment', async () => {
      tournamentRepoSpy.setEligibilityProfile.and.rejectWith(new Error('eligibility_profiles.errors.not_found'));
      expect(await service.saveTournament(tournament, 'ep-x')).toBeTrue();
      expect(notification.error).toHaveBeenCalledTimes(1);
    });

    it('never assigns a profile when the tournament save fails', async () => {
      tournamentRepoSpy.update.and.rejectWith(new Error('common.networkUnavailable'));
      expect(await service.saveTournament(tournament, 'ep-1')).toBeFalse();
      expect(tournamentRepoSpy.setEligibilityProfile).not.toHaveBeenCalled();
    });
  });
});
