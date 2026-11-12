import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { ParticipantDraft, WizardFacadeService } from './wizard-facade.service';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import {
  ApiPublicRegistrationRepository,
  PUBLIC_REGISTRATION_ERRORS
} from '../../../../core/repositories/api/api-public-registration.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { Category, Gender, PublicRegistrationInfo, PublicRegistrationResult, PublicTournament } from '../../../../core/models';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { buildPublicRegistrationInfo } from '../../../../core/models/public-registration.testing';

const categories: Category[] = [3, 4, 6].map(level =>
  ({ id: `c-${level}`, name: `Level ${level}`, shortName: '', key: '', level, isActive: true, sortOrder: level, createdAt: '', updatedAt: '' }));
const genders: Gender[] = [['g-female', 'female'], ['g-male', 'male'], ['g-mixed', 'mixed']].map(([id, key]) =>
  ({ id, name: key, key, isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' }));

const draft = (overrides: Partial<ParticipantDraft> = {}): ParticipantDraft => ({
  slotNumber: 1, firstName: 'Ana', lastName: 'Gil', email: '', phone: '', documentId: '', birthDate: '',
  genderId: 'g-female', categoryId: 'c-4', club: '', ...overrides
});

const pending: PublicRegistrationResult = { reference: 'reg-1', status: 'pending', payment: { status: 'pending', amount: 20000 } };

describe('WizardFacadeService', () => {
  let facade: WizardFacadeService;
  let repository: jasmine.SpyObj<ApiPublicRegistrationRepository>;
  let tournament: PublicTournament | null;
  let info: PublicRegistrationInfo;

  const slots = (genderId: string | null, categoryId: string | null, extra: Partial<PublicRegistrationInfo['slots'][0]> = {}) =>
    [1, 2].map(slotNumber => ({ slotNumber, label: null, required: true, genderId, categoryId, minAge: null, maxAge: null, ...extra }));

  beforeEach(() => {
    tournament = buildPublicTournament();
    info = buildPublicRegistrationInfo({ slots: slots('g-female', 'c-4') });
    repository = jasmine.createSpyObj<ApiPublicRegistrationRepository>('ApiPublicRegistrationRepository',
      ['getInfo', 'requestCode', 'submit', 'getConfirmedPairs']);
    repository.getInfo.and.callFake(() => Promise.resolve(info));
    repository.requestCode.and.resolveTo({ expiresInSeconds: 900, resendAfterSeconds: 60 });
    repository.submit.and.resolveTo(pending);

    TestBed.configureTestingModule({
      providers: [
        WizardFacadeService,
        { provide: PublicTournamentService, useValue: { getBySlug: () => Promise.resolve(tournament) } },
        { provide: ApiPublicRegistrationRepository, useValue: repository },
        { provide: ApiCategoryRepository, useValue: { getAll: () => Promise.resolve(categories) } },
        { provide: ApiGenderRepository, useValue: { getAll: () => Promise.resolve(genders) } }
      ]
    });
    facade = TestBed.inject(WizardFacadeService);
  });

  describe('load', () => {
    it('loads the tournament and its registration info by slug from the public API only', async () => {
      await facade.load('open-norte-abc123');

      expect(repository.getInfo).toHaveBeenCalledWith('open-norte-abc123');
      expect(facade.state()).toBe('ready');
      expect(facade.tournament()?.name).toBe('Open Norte');
      expect(facade.slots().map(s => s.slotNumber)).toEqual([1, 2]);
      expect(facade.categories()).toEqual(categories);
    });

    it('is not found when the tournament or its registration is not public', async () => {
      tournament = null;
      await facade.load('gone');
      expect(facade.state()).toBe('notFound');
    });

    it('is closed with the window reason when the registration is not open', async () => {
      info = buildPublicRegistrationInfo({ state: 'notStarted', isOpen: false });
      await facade.load('open-norte-abc123');

      expect(facade.state()).toBe('closed');
      expect(facade.closedMessageKey()).toBe('registration.public.closed.notStarted');
    });

    it('shows the load error with its translated key', async () => {
      repository.getInfo.and.rejectWith(new Error('common.networkUnavailable'));
      await facade.load('open-norte-abc123');

      expect(facade.state()).toBe('error');
      expect(facade.loadErrorKey()).toBe('common.networkUnavailable');
    });
  });

  describe('pre-check (D3 + L8 mirror, server decides)', () => {
    beforeEach(() => facade.load('open-norte-abc123'));

    it('accepts typed participants that meet the slot rules within the category tolerance', () => {
      const result = facade.validate([draft(), draft({ slotNumber: 2, firstName: 'Bea', categoryId: 'c-3' })]);
      expect(result.valid).toBeTrue();
    });

    it('flags a gender mismatch and a category beyond the tolerance on their slot', () => {
      const result = facade.validate([draft({ genderId: 'g-male' }), draft({ slotNumber: 2, categoryId: 'c-6' })]);

      expect(result.valid).toBeFalse();
      expect(result.slotErrors[1]).toContain('validation.eligibility.genderMismatch');
      expect(result.slotErrors[2]).toContain('validation.eligibility.categoryOutOfRange');
    });

    it('rejects missing data that a rule needs (L8) and asks to complete it', () => {
      const result = facade.validate([draft({ genderId: '' }), draft({ slotNumber: 2, categoryId: '' })]);

      expect(result.slotErrors[1]).toEqual(['validation.eligibility.genderMismatch', 'validation.eligibility.missingGender']);
      expect(result.slotErrors[2]).toContain('validation.eligibility.missingCategory');
    });

    it('lets the mixed gender admit any player', async () => {
      info = buildPublicRegistrationInfo({ slots: slots('g-mixed', null) });
      await facade.load('open-norte-abc123');

      expect(facade.validate([draft({ genderId: 'g-male' }), draft({ slotNumber: 2, genderId: '' })]).valid).toBeTrue();
    });

    it('checks the age limits against the birth date', async () => {
      info = buildPublicRegistrationInfo({ slots: slots(null, null, { minAge: 40 }) });
      await facade.load('open-norte-abc123');

      const result = facade.validate([draft({ birthDate: '2010-01-01' }), draft({ slotNumber: 2, birthDate: '' })]);
      expect(result.slotErrors[1]).toEqual(['validation.eligibility.ageOutOfRange']);
      expect(result.slotErrors[2]).toEqual(['validation.eligibility.ageOutOfRange', 'validation.eligibility.missingBirthDate']);
    });

    it('requires every required slot to be filled', () => {
      const result = facade.validate([draft(), draft({ slotNumber: 2, firstName: '', lastName: '' })]);

      expect(result.valid).toBeFalse();
      expect(result.structureErrors).toEqual(['validation.eligibility.slotRequired']);
    });

    it('flags a repeated email or document across participants', () => {
      const result = facade.validate([
        draft({ email: 'ana@club.test' }),
        draft({ slotNumber: 2, firstName: 'Bea', email: 'ANA@club.test ' })
      ]);
      expect(result.slotErrors[2]).toContain('registrations.errors.duplicate_player');
    });
  });

  describe('email code', () => {
    beforeEach(() => facade.load('open-norte-abc123'));

    it('sends the code and counts down the resend wait the API returned', fakeAsync(() => {
      void facade.requestCode('contact@club.test');
      tick();

      expect(repository.requestCode).toHaveBeenCalledWith('open-norte-abc123', 'contact@club.test');
      expect(facade.codeSentTo()).toBe('contact@club.test');
      expect(facade.resendIn()).toBe(60);
      tick(59_000);
      expect(facade.resendIn()).toBe(1);
      tick(1_000);
      expect(facade.resendIn()).toBe(0);
    }));

    it('ignores a second request while the wait runs', fakeAsync(() => {
      void facade.requestCode('contact@club.test');
      tick();
      void facade.requestCode('contact@club.test');
      tick();

      expect(repository.requestCode).toHaveBeenCalledTimes(1);
      discardPeriodicTasks();
    }));

    it('shows the cooldown message with a countdown on 429 code_cooldown', fakeAsync(() => {
      repository.requestCode.and.rejectWith(new Error(PUBLIC_REGISTRATION_ERRORS.codeCooldown));
      void facade.requestCode('contact@club.test');
      tick();

      expect(facade.codeErrorKey()).toBe(PUBLIC_REGISTRATION_ERRORS.codeCooldown);
      expect(facade.resendIn()).toBe(60);
      expect(facade.codeSentTo()).toBeNull();
      discardPeriodicTasks();
    }));

    it('switches to the closed state on 409 closed', fakeAsync(() => {
      repository.requestCode.and.rejectWith(new Error(PUBLIC_REGISTRATION_ERRORS.closed));
      void facade.requestCode('contact@club.test');
      tick();

      expect(facade.state()).toBe('closed');
      expect(facade.closedMessageKey()).toBe(PUBLIC_REGISTRATION_ERRORS.closed);
    }));
  });

  describe('submit', () => {
    const drafts = [draft({ email: 'ana@club.test' }), draft({ slotNumber: 2, firstName: 'Bea', lastName: 'Paz' })];

    beforeEach(() => facade.load('open-norte-abc123'));

    it('posts the trimmed typed participants with empty fields as null and keeps the result', async () => {
      await facade.submit('contact@club.test', '123456', [{ ...drafts[0], firstName: ' Ana ' }, drafts[1]], true);

      expect(repository.submit).toHaveBeenCalledOnceWith('open-norte-abc123', {
        contactEmail: 'contact@club.test',
        code: '123456',
        publicNameConsent: true,
        participants: [
          { slotNumber: 1, firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test', phone: null, documentId: null,
            birthDate: null, genderId: 'g-female', categoryId: 'c-4', club: null },
          { slotNumber: 2, firstName: 'Bea', lastName: 'Paz', email: null, phone: null, documentId: null,
            birthDate: null, genderId: 'g-female', categoryId: 'c-4', club: null }
        ]
      });
      expect(facade.result()).toEqual(pending);
    });

    it('sends a single request when submit is triggered twice', async () => {
      const first = facade.submit('contact@club.test', '123456', drafts, false);
      const second = facade.submit('contact@club.test', '123456', drafts, false);
      expect(facade.submitting()).toBeTrue();
      await Promise.all([first, second]);

      expect(repository.submit).toHaveBeenCalledTimes(1);
      expect(facade.submitting()).toBeFalse();
    });

    it('does not send when the pre-check fails', async () => {
      await facade.submit('contact@club.test', '123456', [drafts[0]], false);
      expect(repository.submit).not.toHaveBeenCalled();
    });

    it('keeps the form with the translated refusal, such as the generic L9 error', async () => {
      repository.submit.and.rejectWith(new Error(PUBLIC_REGISTRATION_ERRORS.participantUnavailable));
      await facade.submit('contact@club.test', '123456', drafts, false);

      expect(facade.submitErrorKey()).toBe('public_registrations.errors.participant_unavailable');
      expect(facade.result()).toBeNull();
      expect(facade.state()).toBe('ready');
    });

    it('switches to the not-found state when the tournament stopped being public', async () => {
      repository.submit.and.rejectWith(new Error(PUBLIC_REGISTRATION_ERRORS.notFound));
      await facade.submit('contact@club.test', '123456', drafts, false);
      expect(facade.state()).toBe('notFound');
    });
  });
});
