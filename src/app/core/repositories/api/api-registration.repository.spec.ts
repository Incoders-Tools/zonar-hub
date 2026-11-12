import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { ApiRegistrationRepository, registrationErrorKey } from './api-registration.repository';

const baseUrl = '/api/admin/tournaments/t-1/registrations';

const registrationDto = {
  id: 'r-1', tournamentId: 't-1', status: 'pending', source: 'admin', paymentStatus: 'pending',
  contactEmail: null, notes: 'Paga en efectivo', publicNameConsent: true,
  participants: [
    { slotNumber: 2, playerId: 'p-2', firstName: 'Bea', lastName: 'Paz', displayName: 'Bea Paz', club: null },
    { slotNumber: 1, playerId: 'p-1', firstName: 'Ana', lastName: 'Gil', displayName: 'Ana Gil', club: 'Norte' }
  ],
  revision: 3, createdAt: '2026-11-10T10:00:00Z', updatedAt: '2026-11-10T11:00:00Z'
};

const capacityDto = { maxPairs: 8, confirmed: 7, pending: 1, waitlisted: 0, placesLeft: 1 };

const problem = (status: number, code: string) => ({
  status, statusText: 'Error', body: { type: 'about:blank', status, code, detail: code.replace('registrations.', 'registrations.errors.') }
});

describe('ApiRegistrationRepository', () => {
  let repository: ApiRegistrationRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    });
    repository = TestBed.inject(ApiRegistrationRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('list', () => {
    it('gets the tournament registrations and capacity, with participants in slot order', async () => {
      const result = repository.list('t-1');
      const request = http.expectOne(r => r.url === baseUrl);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.has('status')).toBeFalse();
      request.flush({ items: [registrationDto], capacity: capacityDto });

      const list = await result;
      expect(list.capacity).toEqual(capacityDto);
      expect(list.items[0]).toEqual({
        id: 'r-1', tournamentId: 't-1', status: 'pending', source: 'admin', paymentStatus: 'pending',
        contactEmail: null, notes: 'Paga en efectivo', publicNameConsent: true,
        participants: [
          { slotNumber: 1, playerId: 'p-1', firstName: 'Ana', lastName: 'Gil', displayName: 'Ana Gil', club: 'Norte' },
          { slotNumber: 2, playerId: 'p-2', firstName: 'Bea', lastName: 'Paz', displayName: 'Bea Paz', club: null }
        ],
        revision: 3, createdAt: '2026-11-10T10:00:00Z', updatedAt: '2026-11-10T11:00:00Z'
      });
    });

    it('sends the status filter as the status query', async () => {
      const result = repository.list('t-1', 'waitlisted');
      const request = http.expectOne(r => r.url === baseUrl);
      expect(request.request.params.get('status')).toBe('waitlisted');
      request.flush({ items: [], capacity: capacityDto });
      expect((await result).items).toEqual([]);
    });

    it('rejects with the translated tenant refusal', async () => {
      const result = repository.list('t-1');
      const { body, ...options } = problem(403, 'tournaments.forbidden');
      http.expectOne(r => r.url === baseUrl).flush(body, options);
      await expectAsync(result).toBeRejectedWithError('tournaments.errors.forbidden');
    });
  });

  describe('getById', () => {
    it('gets one registration', async () => {
      const result = repository.getById('t-1', 'r-1');
      const request = http.expectOne(`${baseUrl}/r-1`);
      expect(request.request.method).toBe('GET');
      request.flush(registrationDto);
      expect((await result)?.revision).toBe(3);
    });

    it('resolves undefined for an unknown registration', async () => {
      const result = repository.getById('t-1', 'r-9');
      const { body, ...options } = problem(404, 'registrations.not_found');
      http.expectOne(`${baseUrl}/r-9`).flush(body, options);
      expect(await result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('posts the participants, status, contact, notes and consent, blank optional values as null', async () => {
      const result = repository.create('t-1', {
        participants: [{ slotNumber: 1, playerId: 'p-1' }, { slotNumber: 2, playerId: 'p-2' }],
        status: 'confirmed', contactEmail: '  ', notes: ' Paga en efectivo ', publicNameConsent: false
      });
      const request = http.expectOne(baseUrl);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        participants: [{ slotNumber: 1, playerId: 'p-1' }, { slotNumber: 2, playerId: 'p-2' }],
        status: 'confirmed', contactEmail: null, notes: 'Paga en efectivo', publicNameConsent: false
      });
      request.flush({ ...registrationDto, status: 'confirmed' });
      expect((await result).status).toBe('confirmed');
    });

    it('maps D3 and capacity refusals to registrations.errors keys', async () => {
      const result = repository.create('t-1', {
        participants: [{ slotNumber: 1, playerId: 'p-1' }], status: 'pending', publicNameConsent: false
      });
      const { body, ...options } = problem(400, 'registrations.gender_mismatch');
      http.expectOne(baseUrl).flush(body, options);
      await expectAsync(result).toBeRejectedWithError('registrations.errors.gender_mismatch');
    });
  });

  describe('transition', () => {
    for (const transition of ['confirm', 'reject', 'waitlist', 'cancel'] as const) {
      it(`posts ${transition} with the revision that was read`, async () => {
        const result = repository.transition('t-1', 'r-1', transition, 3);
        const request = http.expectOne(`${baseUrl}/r-1/${transition}`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ revision: 3 });
        request.flush({ ...registrationDto, revision: 4 });
        expect((await result).revision).toBe(4);
      });
    }

    it('posts an empty body without a revision', async () => {
      const result = repository.transition('t-1', 'r-1', 'confirm');
      const request = http.expectOne(`${baseUrl}/r-1/confirm`);
      expect(request.request.body).toEqual({});
      request.flush(registrationDto);
      await result;
    });

    for (const code of ['invalid_transition', 'capacity_reached', 'concurrent_modification']) {
      it(`rejects a 409 ${code} with its translation key`, async () => {
        const result = repository.transition('t-1', 'r-1', 'confirm', 3);
        const { body, ...options } = problem(409, `registrations.${code}`);
        http.expectOne(`${baseUrl}/r-1/confirm`).flush(body, options);
        await expectAsync(result).toBeRejectedWithError(`registrations.errors.${code}`);
      });
    }
  });

  describe('setPayment', () => {
    it('puts the manual payment status with the revision', async () => {
      const result = repository.setPayment('t-1', 'r-1', 'paid', 3);
      const request = http.expectOne(`${baseUrl}/r-1/payment`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({ paymentStatus: 'paid', revision: 3 });
      request.flush({ ...registrationDto, paymentStatus: 'paid', revision: 4 });
      expect((await result).paymentStatus).toBe('paid');
    });

    it('omits the revision when it is not known', async () => {
      const result = repository.setPayment('t-1', 'r-1', 'refunded');
      const request = http.expectOne(`${baseUrl}/r-1/payment`);
      expect(request.request.body).toEqual({ paymentStatus: 'refunded' });
      request.flush({ ...registrationDto, paymentStatus: 'refunded' });
      await result;
    });

    it('rejects an invalid payment origin with its translation key', async () => {
      const result = repository.setPayment('t-1', 'r-1', 'refunded', 3);
      const { body, ...options } = problem(409, 'registrations.invalid_payment_transition');
      http.expectOne(`${baseUrl}/r-1/payment`).flush(body, options);
      await expectAsync(result).toBeRejectedWithError('registrations.errors.invalid_payment_transition');
    });
  });

  describe('getDrawParticipants', () => {
    it('gets the confirmed registrations as draw participants (D5)', async () => {
      const result = repository.getDrawParticipants('t-1');
      const request = http.expectOne(`${baseUrl}/draw-participants`);
      expect(request.request.method).toBe('GET');
      request.flush([
        { id: 'r-1', displayName: 'Ana Gil / Bea Paz', members: ['Ana Gil', 'Bea Paz'], seedRank: null, separationKey: 'Norte' },
        { id: 'r-2', displayName: 'Caro Ruiz / Dani Sosa', members: ['Caro Ruiz', 'Dani Sosa'], seedRank: null, separationKey: null }
      ]);
      expect(await result).toEqual([
        { id: 'r-1', displayName: 'Ana Gil / Bea Paz', members: ['Ana Gil', 'Bea Paz'], seedRank: null, separationKey: 'Norte' },
        { id: 'r-2', displayName: 'Caro Ruiz / Dani Sosa', members: ['Caro Ruiz', 'Dani Sosa'], seedRank: null, separationKey: null }
      ]);
    });
  });

  describe('registrationErrorKey', () => {
    it('keeps network keys and falls back to the generic error for unknown codes', () => {
      expect(registrationErrorKey(new Error('x'))).toBe('common.unexpectedError');
    });
  });
});
