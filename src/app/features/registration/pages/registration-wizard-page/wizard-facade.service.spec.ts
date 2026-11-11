import { TestBed } from '@angular/core/testing';
import { WizardFacadeService } from './wizard-facade.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { ApiEligibilityProfileRepository } from '../../../../core/repositories/api/api-eligibility-profile.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { ApiPlayerRepository } from '../../../../core/repositories/api/api-player.repository';
import { Category, Gender, Player, Registration, Tournament } from '../../../../core/models';

const tournament = {
  id: 't-1', organizationId: 'org-1', name: 'Copa Verano', complexId: 'c-1', complexName: 'Arena', categoryId: 'c-4',
  categoryName: 'Cuarta', genderId: 'g-f', genderLabel: 'Femenino', tournamentTypeId: 'tt-1', tournamentTypeName: '',
  sportId: 's-1', sportName: '', statusId: 'upcoming', statusLabel: '', startDate: '2030-12-01', endDate: '2030-12-03',
  registrationStartDate: '', registrationEndDate: '', maxPairs: 8, description: '', rules: '',
  createdAt: '2026-01-01T00:00:00Z', isActive: true, isPublic: true, modalityKey: 'doubles'
} as Tournament;

const categories: Category[] = [3, 4].map(level =>
  ({ id: `c-${level}`, name: '', shortName: '', key: '', level, isActive: true, sortOrder: level, createdAt: '', updatedAt: '' }));
const genders: Gender[] = [['g-f', 'female'], ['g-m', 'male'], ['g-x', 'mixed']].map(([id, key]) =>
  ({ id, name: key, key, isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' }));

const player = (overrides: Partial<Player>): Player => ({
  id: 'p-1', firstName: 'Ana', lastName: 'Gil', email: '', documentId: '', genderId: 'g-f', genderLabel: '',
  categoryId: 'c-4', categoryName: '', club: '', birthDate: '1990-05-20', isActive: true, createdAt: '', ...overrides
} as Player);

const availability = { friday: false, saturday: true, sunday: false, preferredTime: '', notes: '' };

describe('WizardFacadeService', () => {
  let facade: WizardFacadeService;
  let registrations: jasmine.SpyObj<RegistrationService>;
  let current: Tournament;

  beforeEach(() => {
    current = tournament;
    registrations = jasmine.createSpyObj<RegistrationService>('RegistrationService',
      ['getByTournament', 'isDuplicatePair', 'submitRegistration']);
    registrations.getByTournament.and.returnValue([]);
    registrations.isDuplicatePair.and.returnValue(false);
    registrations.submitRegistration.and.callFake(async body => ({ id: 'reg-1', ...body }) as unknown as Registration);

    TestBed.configureTestingModule({
      providers: [
        WizardFacadeService,
        { provide: RegistrationService, useValue: registrations },
        {
          provide: TournamentService,
          useValue: { loadTournaments: () => Promise.resolve(), getTournamentById: () => current }
        },
        { provide: ApiEligibilityProfileRepository, useValue: { getById: () => Promise.resolve(undefined) } },
        { provide: ApiCategoryRepository, useValue: { getAll: () => Promise.resolve(categories) } },
        { provide: ApiGenderRepository, useValue: { getAll: () => Promise.resolve(genders) } },
        { provide: ApiPlayerRepository, useValue: { getByHabitualPartner: () => Promise.resolve(undefined) } }
      ]
    });
    facade = TestBed.inject(WizardFacadeService);
  });

  async function submitPair(first: Player, second: Player): Promise<Registration> {
    await facade.loadTournament('t-1');
    facade.selectParticipant(1, first);
    facade.selectParticipant(2, second);
    return facade.submitRegistration(availability);
  }

  it('applies the tournament gender without an eligibility profile (D3, L8)', async () => {
    await expectAsync(submitPair(player({}), player({ id: 'p-2', genderId: 'g-m' })))
      .toBeRejectedWithError(/validation\.eligibility\.genderMismatch/);
    expect(registrations.submitRegistration).not.toHaveBeenCalled();
  });

  it('applies the tournament category without an eligibility profile', async () => {
    await expectAsync(submitPair(player({}), player({ id: 'p-2', categoryId: null as unknown as string })))
      .toBeRejectedWithError(/validation\.eligibility\.categoryOutOfRange/);
    expect(registrations.submitRegistration).not.toHaveBeenCalled();
  });

  it('admits any gender when the tournament gender is mixed', async () => {
    current = { ...tournament, genderId: 'g-x' };

    await submitPair(player({}), player({ id: 'p-2', genderId: 'g-m' }));

    expect(registrations.submitRegistration).toHaveBeenCalledTimes(1);
  });

  it('submits an eligible pair', async () => {
    await submitPair(player({}), player({ id: 'p-2', categoryId: 'c-3' }));

    expect(registrations.submitRegistration.calls.mostRecent().args[0].participants.map(p => p.playerId))
      .toEqual(['p-1', 'p-2']);
  });
});
