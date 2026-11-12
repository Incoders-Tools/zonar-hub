import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RegistrationWizardPageComponent } from './registration-wizard-page.component';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ES_TRANSLATIONS } from '../../../../core/i18n/i18n.es';
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

const categories: Category[] = [
  { id: 'c-cuarta', name: 'Cuarta', shortName: '4ta', key: 'cuarta', level: 4, isActive: true, sortOrder: 4, createdAt: '', updatedAt: '' }
];
const genders: Gender[] = [
  { id: 'g-female', name: 'Femenino', key: 'female', isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: 'g-male', name: 'Masculino', key: 'male', isActive: true, sortOrder: 2, createdAt: '', updatedAt: '' }
];
const es = (key: string) => ES_TRANSLATIONS[key];

describe('RegistrationWizardPageComponent', () => {
  let fixture: ComponentFixture<RegistrationWizardPageComponent>;
  let element: HTMLElement;
  let repository: jasmine.SpyObj<ApiPublicRegistrationRepository>;
  let tournament: PublicTournament | null;
  let info: PublicRegistrationInfo;
  let submitted: PublicRegistrationResult;

  /** fakeAsync that destroys the page (stopping the resend countdown) and drains the focus timers of the code input. */
  const scenario = (body: () => void) => fakeAsync(() => {
    body();
    fixture?.destroy();
    flush();
    discardPeriodicTasks();
  });

  const text = (selector: string) => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const render = () => { tick(); fixture.detectChanges(); };
  const button = (selector: string) => element.querySelector<HTMLButtonElement>(`${selector} button`)!;
  const type = (selector: string, value: string, event = 'input') => {
    const field = element.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event(event));
    fixture.detectChanges();
  };
  const fillSlot = (slot: number, firstName: string, lastName: string, genderId = 'g-female') => {
    type(`#slot-${slot}-firstName`, firstName);
    type(`#slot-${slot}-lastName`, lastName);
    type(`#slot-${slot}-genderId`, genderId, 'change');
    type(`#slot-${slot}-categoryId`, 'c-cuarta', 'change');
  };
  const typeCode = (code: string) => {
    element.querySelectorAll<HTMLInputElement>('.otp-input__digit').forEach((digit, i) => {
      digit.value = code[i] ?? '';
      digit.dispatchEvent(new Event('input'));
    });
    fixture.detectChanges();
  };
  const create = () => {
    fixture = TestBed.createComponent(RegistrationWizardPageComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    render();
  };
  const toVerification = () => {
    fillSlot(1, 'Ana', 'Gil');
    fillSlot(2, 'Bea', 'Paz');
    button('.rw-step--participants .rw-card__footer app-async-button').click();
    fixture.detectChanges();
  };
  const sendCode = () => {
    type('#contact-email', 'contact@club.test');
    button('.rw-verification__send').click();
    render();
  };
  const toSubmit = () => {
    toVerification();
    sendCode();
    typeCode('123456');
  };

  beforeEach(async () => {
    tournament = buildPublicTournament();
    info = buildPublicRegistrationInfo();
    submitted = { reference: 'reg-42', status: 'pending', payment: { status: 'pending', amount: 20000 } };
    repository = jasmine.createSpyObj<ApiPublicRegistrationRepository>('ApiPublicRegistrationRepository',
      ['getInfo', 'requestCode', 'submit', 'getConfirmedPairs']);
    repository.getInfo.and.callFake(() => Promise.resolve(info));
    repository.requestCode.and.resolveTo({ expiresInSeconds: 900, resendAfterSeconds: 60 });
    repository.submit.and.callFake(() => Promise.resolve(submitted));

    await TestBed.configureTestingModule({
      imports: [RegistrationWizardPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ slug: 'open-norte-abc123' }) } } },
        { provide: PublicTournamentService, useValue: { getBySlug: () => Promise.resolve(tournament) } },
        { provide: ApiPublicRegistrationRepository, useValue: repository },
        { provide: ApiCategoryRepository, useValue: { getAll: () => Promise.resolve(categories) } },
        { provide: ApiGenderRepository, useValue: { getAll: () => Promise.resolve(genders) } }
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');
  });

  afterEach(() => fixture?.destroy());

  describe('participants step', () => {
    it('loads by slug and renders one typed form per API slot with its rules, without a player search', scenario(() => {
      create();

      expect(repository.getInfo).toHaveBeenCalledWith('open-norte-abc123');
      expect(text('.rw__tournament-name')).toBe('Open Norte');
      expect(element.querySelectorAll('.rw-slot').length).toBe(2);
      expect(element.querySelector('app-participant-search')).toBeNull();
      expect(element.querySelector('#slot-1-email')).not.toBeNull();
      expect(element.querySelector('#slot-1-documentId')).not.toBeNull();
      expect(element.querySelector('#slot-1-birthDate, [data-field="slot-1-birthDate"]')).not.toBeNull();
      expect(text('.rw-slot__rules')).toContain(es('registration.public.rules.gender').replace('{name}', 'Femenino'));
      expect(text('.rw-slot__rules')).toContain('Cuarta');
    }));

    it('shows the places left and the waitlist hint from the registration info', scenario(() => {
      info = buildPublicRegistrationInfo({ capacity: { maxPairs: 16, placesLeft: 0, waitlistOnly: true } });
      create();

      expect(text('.rw__capacity')).toContain(es('registration.public.waitlistOnly'));
    }));

    it('keeps next disabled until the required players are typed and pass the pre-check', scenario(() => {
      create();
      const next = () => button('.rw-step--participants .rw-card__footer app-async-button');
      expect(next().disabled).toBeTrue();

      fillSlot(1, 'Ana', 'Gil');
      fillSlot(2, 'Bea', 'Paz', 'g-male');
      expect(next().disabled).toBeTrue();
      expect(text('[data-slot-errors="2"]')).toContain(es('validation.eligibility.genderMismatch'));

      type('#slot-2-genderId', 'g-female', 'change');
      expect(element.querySelector('[data-slot-errors="2"]')).toBeNull();
      expect(next().disabled).toBeFalse();
    }));
  });

  describe('verification step', () => {
    it('sends the code to a valid contact email and counts down before another can be requested', scenario(() => {
      create();
      toVerification();
      expect(button('.rw-verification__send').disabled).toBeTrue();

      sendCode();

      expect(repository.requestCode).toHaveBeenCalledOnceWith('open-norte-abc123', 'contact@club.test');
      expect(text('.rw-verification__sent')).toContain('contact@club.test');
      expect(text('.rw-verification__countdown')).toContain('60');
      expect(button('.rw-verification__send').disabled).toBeTrue();
      tick(60_000);
      fixture.detectChanges();
      expect(element.querySelector('.rw-verification__countdown')).toBeNull();
      expect(button('.rw-verification__send').disabled).toBeFalse();
    }));

    it('shows the cooldown message and countdown on 429 code_cooldown', scenario(() => {
      repository.requestCode.and.rejectWith(new Error(PUBLIC_REGISTRATION_ERRORS.codeCooldown));
      create();
      toVerification();
      sendCode();

      expect(text('.rw-verification__code-error')).toBe(es('public_registrations.errors.code_cooldown'));
      expect(text('.rw-verification__countdown')).toContain('60');
      tick(60_000);
    }));

    it('shows the closed state with a link back to the tournament on 409 closed', scenario(() => {
      repository.requestCode.and.rejectWith(new Error(PUBLIC_REGISTRATION_ERRORS.closed));
      create();
      toVerification();
      sendCode();

      expect(text('.rw__state')).toContain(es('public_registrations.errors.closed'));
      expect(element.querySelector('.rw__state a')?.getAttribute('href')).toBe('/tournaments/open-norte-abc123');
    }));

    it('keeps submit disabled until the code has 6 digits and renders the consent text from the API key', scenario(() => {
      create();
      toVerification();
      sendCode();
      const submit = () => button('.rw-verification__submit');

      expect(text('.rw-verification__consent')).toBe(es('public_registrations.consent.public_name'));
      typeCode('123');
      expect(submit().disabled).toBeTrue();
      typeCode('123456');
      expect(submit().disabled).toBeFalse();
    }));

    it('submits once with the consent choice and disables the button while submitting', scenario(() => {
      let resolve!: (value: PublicRegistrationResult) => void;
      repository.submit.and.returnValue(new Promise(r => (resolve = r)));
      create();
      toSubmit();
      element.querySelector<HTMLInputElement>('.rw-verification__consent-row input')!.click();
      fixture.detectChanges();

      button('.rw-verification__submit').click();
      fixture.detectChanges();
      expect(button('.rw-verification__submit').disabled).toBeTrue();
      button('.rw-verification__submit').click();

      expect(repository.submit).toHaveBeenCalledTimes(1);
      expect(repository.submit.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
        contactEmail: 'contact@club.test', code: '123456', publicNameConsent: true
      }));
      resolve(submitted);
      render();
    }));

    const refusals = [
      'public_registrations.errors.participant_unavailable',
      'public_registrations.errors.invalid_code',
      'registrations.errors.category_out_of_range',
      'players.errors.unknown_gender'
    ];
    for (const key of refusals) {
      it(`shows the translated refusal ${key} and keeps the entered data`, scenario(() => {
        repository.submit.and.rejectWith(new Error(key));
        create();
        toSubmit();
        button('.rw-verification__submit').click();
        render();

        expect(text('.rw-verification__submit-error')).toBe(es(key));
        expect(element.querySelector('.rw-step--verification')).not.toBeNull();
        tick(60_000);
      }));
    }

    it('shows the L9 text for participant_unavailable', scenario(() => {
      repository.submit.and.rejectWith(new Error(PUBLIC_REGISTRATION_ERRORS.participantUnavailable));
      create();
      toSubmit();
      button('.rw-verification__submit').click();
      render();

      expect(text('.rw-verification__submit-error')).toBe('Uno de los participantes no puede inscribirse; contactá al organizador');
      tick(60_000);
    }));
  });

  describe('result', () => {
    const submitAndRender = () => {
      create();
      toSubmit();
      button('.rw-verification__submit').click();
      render();
    };

    it('shows the reference, the pending explanation, the fee due and a link to the confirmed pairs', scenario(() => {
      submitAndRender();

      expect(text('.rw-result__reference')).toContain('reg-42');
      expect(text('.rw-result__status')).toBe(es('registration.public.result.pending'));
      expect(text('.rw-result__payment')).toContain('20.000');
      expect(element.querySelector('.rw-result a[href="/tournaments/open-norte-abc123/confirmed-pairs"]')).not.toBeNull();
      tick(60_000);
    }));

    it('explains the waiting list and a tournament without fee', scenario(() => {
      submitted = { reference: 'reg-43', status: 'waitlisted', payment: { status: 'notRequired', amount: null } };
      submitAndRender();

      expect(text('.rw-result__status')).toBe(es('registration.public.result.waitlisted'));
      expect(text('.rw-result__payment')).toContain(es('registration.public.result.paymentNotRequired'));
      tick(60_000);
    }));
  });

  describe('page states', () => {
    it('shows the window reason and a link back to the tournament when registration is closed', scenario(() => {
      info = buildPublicRegistrationInfo({ state: 'ended', isOpen: false });
      create();

      expect(text('.rw__state')).toContain(es('registration.public.closed.ended'));
      expect(element.querySelector('.rw__state a')?.getAttribute('href')).toBe('/tournaments/open-norte-abc123');
      expect(element.querySelector('.rw-slot')).toBeNull();
    }));

    it('shows the not-found state with a link back when the tournament is not public', scenario(() => {
      tournament = null;
      create();

      expect(text('.rw__state')).toContain(es('publicTournaments.detail.notFound.title'));
      expect(element.querySelector('.rw__state a')?.getAttribute('href')).toBe('/tournaments/open-norte-abc123');
    }));

    it('shows the load error with a retry', scenario(() => {
      repository.getInfo.and.rejectWith(new Error('common.networkUnavailable'));
      create();
      expect(element.querySelector('app-error-state')).not.toBeNull();

      repository.getInfo.and.callFake(() => Promise.resolve(info));
      element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
      render();
      expect(element.querySelectorAll('.rw-slot').length).toBe(2);
    }));
  });
});
