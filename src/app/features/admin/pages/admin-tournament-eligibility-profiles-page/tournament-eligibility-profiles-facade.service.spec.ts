import { TestBed } from '@angular/core/testing';
import { TournamentEligibilityProfilesFacadeService } from './tournament-eligibility-profiles-facade.service';
import { ApiEligibilityProfileRepository } from '../../../../core/repositories/api/api-eligibility-profile.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TournamentEligibilityProfile } from '../../../../core/models';
import { EligibilityProfileWrite } from '../../../../core/repositories/eligibility-profile.repository';

const profile = (overrides: Partial<TournamentEligibilityProfile> = {}): TournamentEligibilityProfile => ({
  id: 'ep-1', name: 'Damas', key: '', description: null, sortOrder: null, isActive: true, createdAt: '', updatedAt: '',
  slots: [], ...overrides
});

const write: EligibilityProfileWrite = { name: 'Damas', description: null, isActive: true, slots: [] };

describe('TournamentEligibilityProfilesFacadeService', () => {
  let service: TournamentEligibilityProfilesFacadeService;
  let repo: jasmine.SpyObj<ApiEligibilityProfileRepository>;
  let notification: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    repo = jasmine.createSpyObj<ApiEligibilityProfileRepository>('ApiEligibilityProfileRepository', ['getAll', 'create', 'update', 'delete']);
    repo.getAll.and.resolveTo([profile({ id: 'ep-2', name: 'Mixto', isActive: false }), profile()]);
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        TournamentEligibilityProfilesFacadeService,
        { provide: ApiEligibilityProfileRepository, useValue: repo },
        { provide: ApiCategoryRepository, useValue: { getAll: () => Promise.resolve([]) } },
        { provide: ApiGenderRepository, useValue: { getAll: () => Promise.resolve([]) } },
        { provide: NotificationService, useValue: notification },
        { provide: I18nService, useValue: { translate: (key: string) => `t:${key}` } }
      ]
    });
    service = TestBed.inject(TournamentEligibilityProfilesFacadeService);
  });

  it('loads the profiles ordered by name and filters by name and status', async () => {
    await service.load();
    expect(service.filteredProfiles().map(p => p.name)).toEqual(['Damas', 'Mixto']);
    service.applyFilters({ isActive: 'false' });
    expect(service.filteredProfiles().map(p => p.name)).toEqual(['Mixto']);
    service.applyFilters({ name: 'dam' });
    expect(service.filteredProfiles().map(p => p.name)).toEqual(['Damas']);
  });

  it('exposes the translation key of a failed load', async () => {
    repo.getAll.and.rejectWith(new Error('common.forbidden'));
    await service.load();
    expect(service.error()).toBe('common.forbidden');
    expect(service.entities()).toEqual([]);
  });

  it('creates or updates and reports the translated outcome', async () => {
    repo.create.and.resolveTo(profile());
    expect(await service.saveProfile(write)).toBeTrue();
    expect(repo.create).toHaveBeenCalledWith(write);
    expect(notification.success).toHaveBeenCalledWith('t:toast.saveSuccess');

    repo.update.and.rejectWith(new Error('eligibility_profiles.errors.name_taken'));
    expect(await service.saveProfile(write, 'ep-1')).toBeFalse();
    expect(repo.update).toHaveBeenCalledWith('ep-1', write);
    expect(notification.error).toHaveBeenCalledWith('t:eligibility_profiles.errors.name_taken');
  });

  it('explains a 409 in_use refusal and keeps the profile', async () => {
    await service.load();
    repo.delete.and.rejectWith(new Error('eligibility_profiles.errors.in_use'));
    expect(await service.deleteProfile('ep-1')).toBeFalse();
    expect(notification.error).toHaveBeenCalledWith('t:eligibility_profiles.errors.in_use');
    expect(service.entities().some(p => p.id === 'ep-1')).toBeTrue();
  });

  it('bulk delete stops at the first refusal and reloads the stored state', async () => {
    repo.delete.and.callFake(async (id: string) => {
      if (id === 'ep-2') throw new Error('eligibility_profiles.errors.in_use');
    });
    expect(await service.bulkDelete(['ep-1', 'ep-2', 'ep-3'])).toBeFalse();
    expect(repo.delete.calls.allArgs()).toEqual([['ep-1'], ['ep-2']]);
    expect(repo.getAll).toHaveBeenCalled();
  });

  it('flags a name already used by another profile in any case', async () => {
    await service.load();
    expect(service.isNameTaken(' damas ')).toBeTrue();
    expect(service.isNameTaken('Damas', 'ep-1')).toBeFalse();
    expect(service.isNameTaken('Nuevo')).toBeFalse();
  });
});
