import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { buildPublicTournament } from '../../models/public-tournament.testing';
import { ApiPublicTournamentRepository } from './api-public-tournament.repository';

describe('ApiPublicTournamentRepository', () => {
  let repository: ApiPublicTournamentRepository;
  let http: HttpTestingController;
  let activeOrganizationReads: number;

  beforeEach(() => {
    activeOrganizationReads = 0;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        {
          provide: ActiveOrganizationService,
          useValue: { activeOrganizationId: () => { activeOrganizationReads++; return null; } }
        }
      ]
    });
    repository = TestBed.inject(ApiPublicTournamentRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lists from GET /api/public/tournaments without an organization or credentials', async () => {
    const tournament = buildPublicTournament();
    const result = repository.getAll();

    const request = http.expectOne('/api/public/tournaments');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.headers.has('X-Organization-Id')).toBeFalse();
    expect(request.request.withCredentials).toBeFalse();
    request.flush({ items: [tournament] });

    expect(await result).toEqual([tournament]);
    expect(activeOrganizationReads).toBe(0);
  });

  it('sends the limit query parameter when one is requested', async () => {
    const result = repository.getAll(6);

    http.expectOne('/api/public/tournaments?limit=6').flush({ items: [] });

    expect(await result).toEqual([]);
  });

  it('loads one tournament from GET /api/public/tournaments/{slug} with the slug URL-encoded', async () => {
    const tournament = buildPublicTournament({ slug: 'copa verano/ñ' });
    const result = repository.getBySlug('copa verano/ñ');

    const request = http.expectOne('/api/public/tournaments/copa%20verano%2F%C3%B1');
    expect(request.request.method).toBe('GET');
    request.flush(tournament);

    expect(await result).toEqual(tournament);
  });

  it('maps missing organization links to an empty object and an unknown icon source to unicode', async () => {
    const tournament = buildPublicTournament();
    const result = repository.getBySlug(tournament.slug);

    http.expectOne(`/api/public/tournaments/${tournament.slug}`).flush({
      ...tournament,
      sport: { key: 'tenis', name: 'Tenis', icon: '🎾', iconSource: 'emoji' },
      organization: { displayName: 'Club Norte', logoUrl: null, description: null, type: 'estandar' }
    });

    const mapped = await result;
    expect(mapped?.sport?.iconSource).toBe('unicode');
    expect(mapped?.organization?.links).toEqual({});
  });

  it('keeps a null organization as null', async () => {
    const tournament = buildPublicTournament({ organization: null });
    const result = repository.getAll();

    http.expectOne('/api/public/tournaments').flush({ items: [tournament] });

    expect((await result)[0].organization).toBeNull();
  });

  it('resolves to undefined when the API answers 404 not found', async () => {
    const result = repository.getBySlug('missing-slug');

    http.expectOne('/api/public/tournaments/missing-slug').flush(
      { code: 'public_tournaments.not_found', detail: 'public_tournaments.errors.not_found' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(await result).toBeUndefined();
  });

  it('rejects other failures with the translated network error key', async () => {
    const result = repository.getAll();

    http.expectOne('/api/public/tournaments').flush(null, { status: 503, statusText: 'Service Unavailable' });

    await expectAsync(result).toBeRejectedWithError('common.networkUnavailable');
  });

  it('rejects a server error on the detail route instead of reporting not found', async () => {
    const result = repository.getBySlug('open-norte-abc123');

    http.expectOne('/api/public/tournaments/open-norte-abc123').flush(null, { status: 500, statusText: 'Server Error' });

    await expectAsync(result).toBeRejectedWithError('common.unexpectedError');
  });
});
