import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { TournamentDrawRequest } from '../../models/tournament-draw.model';
import { buildKnockoutDraw } from '../../models/tournament-draw.testing';
import { ApiTournamentDrawRepository } from './api-tournament-draw.repository';

const DRAW_URL = '/api/admin/tournaments/t-1/draw';

function request(overrides: Partial<TournamentDrawRequest> = {}): TournamentDrawRequest {
  return {
    format: 'singleElimination',
    participationFormat: 'pair',
    randomization: { mode: 'seeded', seed: '18446744073709551615' },
    options: { knockout: { thirdPlaceMatch: true }, scoring: { thirdSetSuperTiebreak: true } },
    participants: [
      { id: 'p1', displayName: 'Gómez / Pérez', members: ['Ana Gómez', 'Bea Pérez'], seedRank: 1, separationKey: 'Club Norte' },
      { id: 'p2', displayName: 'Ruiz / Sosa', members: ['Caro Ruiz', 'Dani Sosa'], seedRank: null, separationKey: null }
    ],
    ...overrides
  };
}

/** A raw API payload with PascalCase enums, to prove responses pass through `normalizeTournamentDraw`. */
function rawDraw(status = 'Draft'): Record<string, unknown> {
  const draw = buildKnockoutDraw(2) as unknown as Record<string, unknown>;
  return { ...draw, status, format: 'SingleElimination', separationConflicts: undefined };
}

function problem(code: string | undefined, status: number): [Record<string, unknown>, { status: number; statusText: string }] {
  return [code ? { code } : {}, { status, statusText: 'Error' }];
}

describe('ApiTournamentDrawRepository', () => {
  let repository: ApiTournamentDrawRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }]
    });
    repository = TestBed.inject(ApiTournamentDrawRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('posts the D5 request body to preview and normalises the returned draw', async () => {
    const result = repository.preview('t-1', request());

    const call = http.expectOne(`${DRAW_URL}/preview`);
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual({
      format: 'singleElimination',
      participationFormat: 'pair',
      randomization: { mode: 'seeded', seed: '18446744073709551615' },
      options: { knockout: { thirdPlaceMatch: true }, scoring: { thirdSetSuperTiebreak: true } },
      participants: [
        { id: 'p1', displayName: 'Gómez / Pérez', members: ['Ana Gómez', 'Bea Pérez'], seedRank: 1, separationKey: 'Club Norte' },
        { id: 'p2', displayName: 'Ruiz / Sosa', members: ['Caro Ruiz', 'Dani Sosa'] }
      ]
    });
    call.flush(rawDraw());

    const draw = await result;
    expect(draw.status).toBe('draft');
    expect(draw.format).toBe('singleElimination');
    expect(draw.separationConflicts).toEqual([]);
  });

  it('omits the seed when it is empty so the API generates one', async () => {
    const result = repository.preview('t-1', request({ randomization: { mode: 'random', seed: '  ' } }));

    const call = http.expectOne(`${DRAW_URL}/preview`);
    expect(call.request.body.randomization).toEqual({ mode: 'random' });
    call.flush(rawDraw());
    await result;
  });

  it('saves the draft with PUT on the draw resource', async () => {
    const result = repository.saveDraft('t-1', request());

    const call = http.expectOne(DRAW_URL);
    expect(call.request.method).toBe('PUT');
    expect(call.request.body.participants.length).toBe(2);
    call.flush(rawDraw());

    expect((await result).status).toBe('draft');
  });

  it('gets the stored draw and returns null when the tournament has none', async () => {
    const found = repository.get('t-1');
    const call = http.expectOne(DRAW_URL);
    expect(call.request.method).toBe('GET');
    call.flush(rawDraw('Published'));
    expect((await found)?.status).toBe('published');

    const missing = repository.get('t-1');
    http.expectOne(DRAW_URL).flush(...problem('draws.not_found', 404));
    expect(await missing).toBeNull();
  });

  it('publishes and unpublishes with POST', async () => {
    const published = repository.publish('t-1');
    const publishCall = http.expectOne(`${DRAW_URL}/publish`);
    expect(publishCall.request.method).toBe('POST');
    publishCall.flush(rawDraw('published'));
    expect((await published).status).toBe('published');

    const unpublished = repository.unpublish('t-1');
    const unpublishCall = http.expectOne(`${DRAW_URL}/unpublish`);
    expect(unpublishCall.request.method).toBe('POST');
    unpublishCall.flush(rawDraw('draft'));
    expect((await unpublished).status).toBe('draft');
  });

  it('reads the draw back when a write answers without a body', async () => {
    const published = repository.publish('t-1');
    http.expectOne(`${DRAW_URL}/publish`).flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve));
    http.expectOne(req => req.method === 'GET' && req.url === DRAW_URL).flush(rawDraw('published'));

    expect((await published).status).toBe('published');
  });

  it('deletes the draft with DELETE', async () => {
    const deleted = repository.delete('t-1');
    const call = http.expectOne(DRAW_URL);
    expect(call.request.method).toBe('DELETE');
    call.flush(null, { status: 204, statusText: 'No Content' });
    await expectAsync(deleted).toBeResolved();
  });

  it('puts a match result on the encoded match resource', async () => {
    const saved = repository.saveMatchResult('t-1', 'KO-R1-M1', {
      status: 'completed',
      sets: [{ home: 6, away: 4 }, { home: 7, away: 6, tiebreak: { home: 7, away: 3 } }],
      winnerSide: 'home',
      courtName: 'Central',
      scheduledAt: null,
      startedAt: '2026-11-20T10:00:00Z',
      finishedAt: '2026-11-20T11:20:00Z'
    });

    const call = http.expectOne(`${DRAW_URL}/matches/KO-R1-M1/result`);
    expect(call.request.method).toBe('PUT');
    expect(call.request.body.winnerSide).toBe('home');
    expect(call.request.body.sets[1].tiebreak).toEqual({ home: 7, away: 3 });
    call.flush(rawDraw());
    expect((await saved).format).toBe('singleElimination');
  });

  describe('error keys', () => {
    async function failingSave(code: string | undefined, status: number): Promise<string> {
      const result = repository.saveDraft('t-1', request());
      const call = http.expectOne(DRAW_URL);
      if (status === 0) {
        call.error(new ProgressEvent('error'));
      } else {
        call.flush(...problem(code, status));
      }
      try {
        await result;
      } catch (error) {
        return (error as Error).message;
      }
      throw new Error('the save did not fail');
    }

    it('maps draw engine codes to the draws.errors namespace', async () => {
      expect(await failingSave('draws.participants_min', 400)).toBe('draws.errors.participants_min');
      expect(await failingSave('draws.duplicate_seed_rank', 400)).toBe('draws.errors.duplicate_seed_rank');
    });

    it('maps result codes to draws.errors.results', async () => {
      expect(await failingSave('draws.results.locked_by_next_match', 409)).toBe('draws.errors.results.locked_by_next_match');
    });

    it('maps the tenant refusal to its translated key', async () => {
      expect(await failingSave('tournaments.forbidden', 403)).toBe('tournaments.errors.forbidden');
      expect(await failingSave('tournaments.errors.forbidden', 403)).toBe('tournaments.errors.forbidden');
    });

    it('maps a 409 without a known draw code to the results-exist key', async () => {
      expect(await failingSave(undefined, 409)).toBe('draws.errors.results_exist');
      expect(await failingSave('draws.results_exist', 409)).toBe('draws.errors.results_exist');
    });

    it('maps unknown draw codes to a generic draw error and keeps common codes', async () => {
      expect(await failingSave('draws.something_new', 400)).toBe('draws.errors.unexpected');
      expect(await failingSave(undefined, 403)).toBe('common.forbidden');
      expect(await failingSave(undefined, 0)).toBe('common.networkUnavailable');
    });
  });
});
