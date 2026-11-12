import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { PUBLIC_REQUEST } from '../../http/public-request.context';
import { ES_TRANSLATIONS } from '../../i18n/i18n.es';
import {
  buildPublicRegistrationInfo,
  buildPublicRegistrationSubmission
} from '../../models/public-registration.testing';
import { ApiPublicRegistrationRepository, PUBLIC_REGISTRATION_ERRORS } from './api-public-registration.repository';

describe('ApiPublicRegistrationRepository', () => {
  let repository: ApiPublicRegistrationRepository;
  let http: HttpTestingController;

  const base = '/api/public/tournaments/open-norte-abc123';
  const problem = (code: string, status: number) => [{ code, detail: code }, { status, statusText: 'Error' }] as const;
  const expectAnonymous = (request: TestRequest) => {
    expect(request.request.context.get(PUBLIC_REQUEST)).withContext('public-request marker').toBeTrue();
    expect(request.request.withCredentials).toBeFalse();
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.headers.has('X-Organization-Id')).toBeFalse();
  };
  const rejection = async (promise: Promise<unknown>) => {
    try {
      await promise;
    } catch (error) {
      return (error as Error).message;
    }
    throw new Error('expected a rejection');
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }]
    });
    repository = TestBed.inject(ApiPublicRegistrationRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  describe('getInfo', () => {
    it('reads GET …/{slug}/registration anonymously with the slug URL-encoded', async () => {
      const info = buildPublicRegistrationInfo({ slug: 'copa verano/ñ' });
      const result = repository.getInfo('copa verano/ñ');

      const request = http.expectOne('/api/public/tournaments/copa%20verano%2F%C3%B1/registration');
      expect(request.request.method).toBe('GET');
      expectAnonymous(request);
      request.flush(info);

      expect(await result).toEqual(info);
    });

    it('resolves null when the tournament is not public (404)', async () => {
      const result = repository.getInfo('open-norte-abc123');
      http.expectOne(`${base}/registration`).flush(...problem('public_tournaments.not_found', 404));

      expect(await result).toBeNull();
    });

    it('rejects with the network key when the API is unreachable', async () => {
      const result = repository.getInfo('open-norte-abc123');
      http.expectOne(`${base}/registration`).flush(null, { status: 503, statusText: 'Unavailable' });

      expect(await rejection(result)).toBe('common.networkUnavailable');
    });
  });

  describe('requestCode', () => {
    it('posts { contactEmail } anonymously and resolves the 202 timings', async () => {
      const result = repository.requestCode('open-norte-abc123', 'contact@club.test');

      const request = http.expectOne(`${base}/registration/code`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ contactEmail: 'contact@club.test' });
      expectAnonymous(request);
      request.flush({ expiresInSeconds: 900, resendAfterSeconds: 60 }, { status: 202, statusText: 'Accepted' });

      expect(await result).toEqual({ expiresInSeconds: 900, resendAfterSeconds: 60 });
    });

    it('rejects with the cooldown key on 429 public_registrations.code_cooldown', async () => {
      const result = repository.requestCode('open-norte-abc123', 'contact@club.test');
      http.expectOne(`${base}/registration/code`).flush(...problem('public_registrations.code_cooldown', 429));

      expect(await rejection(result)).toBe(PUBLIC_REGISTRATION_ERRORS.codeCooldown);
    });

    it('rejects with the too-many-requests key on a 429 of the rate limiter, which has no body', async () => {
      const result = repository.requestCode('open-norte-abc123', 'contact@club.test');
      http.expectOne(`${base}/registration/code`).flush(null, { status: 429, statusText: 'Too Many Requests' });

      expect(await rejection(result)).toBe(PUBLIC_REGISTRATION_ERRORS.tooManyRequests);
    });

    it('rejects with the closed key on 409 public_registrations.closed', async () => {
      const result = repository.requestCode('open-norte-abc123', 'contact@club.test');
      http.expectOne(`${base}/registration/code`).flush(...problem('public_registrations.closed', 409));

      expect(await rejection(result)).toBe(PUBLIC_REGISTRATION_ERRORS.closed);
    });
  });

  describe('submit', () => {
    it('posts the contact, code, typed participants and consent anonymously and resolves the 201 result', async () => {
      const submission = buildPublicRegistrationSubmission();
      const result = repository.submit('open-norte-abc123', submission);

      const request = http.expectOne(`${base}/registration`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(submission);
      expectAnonymous(request);
      request.flush(
        { reference: 'reg-1', status: 'waitlisted', payment: { status: 'pending', amount: 20000 } },
        { status: 201, statusText: 'Created' }
      );

      expect(await result).toEqual({ reference: 'reg-1', status: 'waitlisted', payment: { status: 'pending', amount: 20000 } });
    });

    const cases: [string, number, string][] = [
      ['public_registrations.invalid_code', 400, 'public_registrations.errors.invalid_code'],
      ['public_registrations.participant_unavailable', 409, 'public_registrations.errors.participant_unavailable'],
      ['public_registrations.closed', 409, 'public_registrations.errors.closed'],
      ['public_tournaments.not_found', 404, 'public_registrations.errors.not_found'],
      ['eligibility_profiles.not_found', 404, 'eligibility_profiles.errors.not_found'],
      ['players.unknown_gender', 400, 'players.errors.unknown_gender'],
      ['players.birth_date_in_future', 400, 'players.errors.birth_date_in_future'],
      ['registrations.duplicate_player', 400, 'registrations.errors.duplicate_player'],
      ['registrations.category_out_of_range', 400, 'registrations.errors.category_out_of_range'],
      ['registrations.required_slot_missing', 400, 'registrations.errors.required_slot_missing']
    ];
    for (const [code, status, key] of cases) {
      it(`rejects ${status} ${code} with the translated key ${key}`, async () => {
        const result = repository.submit('open-norte-abc123', buildPublicRegistrationSubmission());
        http.expectOne(`${base}/registration`).flush(...problem(code, status));

        expect(await rejection(result)).toBe(key);
      });
    }

    it('rejects an undocumented code with the generic error instead of an unresolved key', async () => {
      const result = repository.submit('open-norte-abc123', buildPublicRegistrationSubmission());
      http.expectOne(`${base}/registration`).flush(...problem('registrations.something_new', 400));

      expect(await rejection(result)).toBe('common.unexpectedError');
    });
  });

  describe('getConfirmedPairs', () => {
    it('reads GET …/confirmed-pairs anonymously and resolves its items', async () => {
      const items = [
        { position: 1, displayName: 'Ana Gil / Bea Paz', members: ['Ana Gil', 'Bea Paz'], labelKey: null },
        { position: 2, displayName: null, members: [], labelKey: 'public_registrations.confirmed_pairs.anonymous' }
      ];
      const result = repository.getConfirmedPairs('open-norte-abc123');

      const request = http.expectOne(`${base}/confirmed-pairs`);
      expect(request.request.method).toBe('GET');
      expectAnonymous(request);
      request.flush({ items });

      expect(await result).toEqual(items);
    });

    it('resolves null when the tournament is not public (404)', async () => {
      const result = repository.getConfirmedPairs('open-norte-abc123');
      http.expectOne(`${base}/confirmed-pairs`).flush(...problem('public_tournaments.not_found', 404));

      expect(await result).toBeNull();
    });
  });

  it('has a Spanish translation for every error key it can reject with', () => {
    for (const key of Object.values(PUBLIC_REGISTRATION_ERRORS)) {
      expect(ES_TRANSLATIONS[key]).withContext(key).toBeTruthy();
    }
    expect(ES_TRANSLATIONS['public_registrations.consent.public_name']).toBeTruthy();
    expect(ES_TRANSLATIONS['public_registrations.confirmed_pairs.anonymous']).toBeTruthy();
  });
});
