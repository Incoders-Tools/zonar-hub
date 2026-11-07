import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { Tournament } from '../../models';
import { ApiTournamentAdminRepository } from './api-tournament-admin.repository';

const dto = {
  id: 't-1', organizationId: 'org-1', name: 'Copa Verano', key: 'copa_verano', complexId: 'c-1', sportId: 's-1',
  categoryId: null, genderId: 'g-1', modalityId: 'm-1', tournamentTypeId: null, ruleSetId: null, status: 'upcoming',
  startDate: '2026-12-01', endDate: '2026-12-03', registrationStartDate: null, registrationEndDate: null, maxPairs: 16,
  description: null, rules: null, imageUrl: null, coverImageUrl: null, registrationFeePerPair: null, prizeMoney: null,
  pointsToAward: null, sumValue: null, observations: null, isActive: true, selectedCourtIds: [],
  createdAtUtc: '2026-01-01T00:00:00Z', updatedAtUtc: '2026-01-01T00:00:00Z',
  isPublic: true, publicSlug: 'copa-verano-a1b2c3'
};

function createInput(overrides: Partial<Tournament> = {}): Omit<Tournament, 'id' | 'createdAt'> {
  return {
    organizationId: 'org-1', name: 'Copa Verano', key: 'copa_verano', complexId: 'c-1', complexName: '', categoryId: '',
    categoryName: '', genderId: 'g-1', genderLabel: '', tournamentTypeId: '', tournamentTypeName: '', sportId: 's-1',
    sportName: '', modalityId: 'm-1', statusId: 'upcoming', statusLabel: '', startDate: '2026-12-01', endDate: '2026-12-03',
    registrationStartDate: '', registrationEndDate: '', maxPairs: 16, description: '', rules: '', isActive: true,
    selectedCourtIds: [], ...overrides
  };
}

const settle = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('ApiTournamentAdminRepository public visibility contract', () => {
  let repository: ApiTournamentAdminRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ActiveOrganizationService, useValue: { activeOrganizationId: () => 'org-1' } }
      ]
    });
    repository = TestBed.inject(ApiTournamentAdminRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('maps isPublic and publicSlug from the API response', async () => {
    const result = repository.getAll();
    http.expectOne('/api/admin/tournaments?organizationId=org-1').flush({
      items: [dto, { ...dto, id: 't-2', isPublic: false, publicSlug: null }]
    });

    const [publicOne, privateOne] = await result;
    expect(publicOne.isPublic).toBeTrue();
    expect(publicOne.publicSlug).toBe('copa-verano-a1b2c3');
    expect(privateOne.isPublic).toBeFalse();
    expect(privateOne.publicSlug).toBeUndefined();
  });

  it('sends isPublic on create and never sends publicSlug', async () => {
    const result = repository.create(createInput({ isPublic: true, publicSlug: 'client-made-up' }));

    const request = http.expectOne('/api/admin/tournaments');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.isPublic).toBeTrue();
    expect('publicSlug' in request.request.body).toBeFalse();
    request.flush(dto);
    expect((await result).publicSlug).toBe('copa-verano-a1b2c3');
  });

  it('sends the new isPublic value on update without publicSlug', async () => {
    const result = repository.update('t-1', { isPublic: false });

    http.expectOne('/api/admin/tournaments/t-1').flush(dto);
    await settle();
    const request = http.expectOne(req => req.method === 'PUT' && req.url === '/api/admin/tournaments/t-1');
    expect(request.request.body.isPublic).toBeFalse();
    expect('publicSlug' in request.request.body).toBeFalse();
    request.flush({ ...dto, isPublic: false });

    const updated = await result;
    expect(updated.isPublic).toBeFalse();
    expect(updated.publicSlug).toBe('copa-verano-a1b2c3');
  });

  it('defaults isPublic to false when the stored tournament predates the field', async () => {
    const result = repository.update('t-1', { name: 'Copa Otoño' });

    const { isPublic: _p, publicSlug: _s, ...legacy } = dto;
    void _p; void _s;
    http.expectOne('/api/admin/tournaments/t-1').flush(legacy);
    await settle();
    const request = http.expectOne(req => req.method === 'PUT');
    expect(request.request.body.isPublic).toBeFalse();
    request.flush({ ...dto, isPublic: false, publicSlug: null });
    await result;
  });

  it('maps the tenant refusal to the translated forbidden key', async () => {
    const result = repository.create(createInput({ organizationId: 'org-9' }));

    http.expectOne('/api/admin/tournaments').flush(
      { title: 'Forbidden', status: 403, detail: 'tournaments.errors.forbidden', code: 'tournaments.forbidden' },
      { status: 403, statusText: 'Forbidden' }
    );

    await expectAsync(result).toBeRejectedWithError('tournaments.errors.forbidden');
  });
});
