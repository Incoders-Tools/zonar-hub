import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { ApiEligibilityProfileRepository } from './api-eligibility-profile.repository';
import { EligibilityProfileWrite } from '../eligibility-profile.repository';

const profilesUrl = '/api/admin/organizations/org-1/eligibility-profiles';

const slot = { slotNumber: 1, genderId: 'g-f', categoryId: null, minAge: 18, maxAge: null, label: 'Jugadora 1', required: true };
const dto = {
  id: 'ep-1', organizationId: 'org-1', name: 'Damas +18', description: null, isActive: true,
  slots: [slot, { ...slot, slotNumber: 2, label: null, required: false }],
  createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-02T10:00:00Z'
};

const write: EligibilityProfileWrite = {
  name: 'Damas +18', description: '  ', isActive: true,
  slots: [{ slotNumber: 1, genderId: 'g-f', categoryId: '', minAge: 18, maxAge: null, label: ' Jugadora 1 ', required: true }]
};

describe('ApiEligibilityProfileRepository', () => {
  let repository: ApiEligibilityProfileRepository;
  let http: HttpTestingController;
  const activeOrganizationId = signal<string | null>('org-1');

  beforeEach(() => {
    activeOrganizationId.set('org-1');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ActiveOrganizationService, useValue: { activeOrganizationId } }
      ]
    });
    repository = TestBed.inject(ApiEligibilityProfileRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists the organization profiles with their slots in slot order', async () => {
    const result = repository.getAll();
    const request = http.expectOne(profilesUrl);
    expect(request.request.method).toBe('GET');
    request.flush([{ ...dto, slots: [dto.slots[1], dto.slots[0]] }]);

    const [profile] = await result;
    expect(profile).toEqual(jasmine.objectContaining({
      id: 'ep-1', organizationId: 'org-1', name: 'Damas +18', description: null, isActive: true,
      createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-02T10:00:00Z'
    }));
    expect(profile.slots?.map(s => s.slotNumber)).toEqual([1, 2]);
    expect(profile.slots?.[0]).toEqual(jasmine.objectContaining({
      slotNumber: 1, genderId: 'g-f', categoryId: null, minAge: 18, maxAge: null, label: 'Jugadora 1', required: true
    }));
  });

  it('returns no profiles without a request when no organization is active', async () => {
    activeOrganizationId.set(null);
    expect(await repository.getAll()).toEqual([]);
    http.expectNone(() => true);
  });

  it('getById reads one profile and returns undefined for 404', async () => {
    const found = repository.getById('ep-1');
    http.expectOne(`${profilesUrl}/ep-1`).flush(dto);
    expect((await found)?.name).toBe('Damas +18');

    const missing = repository.getById('ep-x');
    http.expectOne(`${profilesUrl}/ep-x`).flush({ code: 'eligibility_profiles.not_found' }, { status: 404, statusText: 'Not Found' });
    expect(await missing).toBeUndefined();
  });

  it('creates with the API body, trimming text and sending blank optional values as null', async () => {
    const result = repository.create(write);
    const request = http.expectOne(profilesUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Damas +18', description: null, isActive: true,
      slots: [{ slotNumber: 1, genderId: 'g-f', categoryId: null, minAge: 18, maxAge: null, label: 'Jugadora 1', required: true }]
    });
    request.flush(dto, { status: 201, statusText: 'Created' });
    expect((await result).id).toBe('ep-1');
  });

  it('updates with PUT and maps 409 name_taken to its translation key', async () => {
    const result = repository.update('ep-1', { ...write, isActive: false });
    const request = http.expectOne(`${profilesUrl}/ep-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.isActive).toBe(false);
    request.flush({ code: 'eligibility_profiles.name_taken' }, { status: 409, statusText: 'Conflict' });
    await expectAsync(result).toBeRejectedWithError('eligibility_profiles.errors.name_taken');
  });

  it('maps 400 validation codes to their translation keys', async () => {
    const result = repository.create(write);
    http.expectOne(profilesUrl).flush({ code: 'eligibility_profiles.invalid_age_range' }, { status: 400, statusText: 'Bad Request' });
    await expectAsync(result).toBeRejectedWithError('eligibility_profiles.errors.invalid_age_range');
  });

  it('deletes and maps 409 in_use to its translation key', async () => {
    const ok = repository.delete('ep-1');
    const request = http.expectOne(`${profilesUrl}/ep-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await ok;

    const inUse = repository.delete('ep-2');
    http.expectOne(`${profilesUrl}/ep-2`).flush({ code: 'eligibility_profiles.in_use' }, { status: 409, statusText: 'Conflict' });
    await expectAsync(inUse).toBeRejectedWithError('eligibility_profiles.errors.in_use');
  });

  it('maps the tenant refusal to the shared forbidden key', async () => {
    const result = repository.delete('ep-1');
    http.expectOne(`${profilesUrl}/ep-1`).flush({ code: 'tournaments.forbidden' }, { status: 403, statusText: 'Forbidden' });
    await expectAsync(result).toBeRejectedWithError('common.forbidden');
  });
});
