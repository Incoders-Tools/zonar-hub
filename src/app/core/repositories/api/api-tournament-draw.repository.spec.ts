import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { TournamentDrawRequest } from '../../models/tournament-draw.model';
import { buildKnockoutDraw } from '../../models/tournament-draw.testing';
import { ApiTournamentDrawRepository } from './api-tournament-draw.repository';
import { TRANSLATIONS } from '../../i18n/i18n.translations';

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
    // Field names of the API `MatchResultBody` / `SetScoreBody` / `TiebreakScoreBody`.
    expect(call.request.body).toEqual({
      status: 'completed',
      sets: [{ home: 6, away: 4 }, { home: 7, away: 6, tiebreak: { home: 7, away: 3 } }],
      winnerSide: 'home',
      courtName: 'Central',
      scheduledAt: null,
      startedAt: '2026-11-20T10:00:00Z',
      finishedAt: '2026-11-20T11:20:00Z'
    });
    call.flush(rawDraw());
    expect((await saved).format).toBe('singleElimination');
  });

  it('sends courtId without courtName when a listed court is chosen', async () => {
    const saved = repository.saveMatchResult('t-1', 'KO-R1-M1', {
      status: 'scheduled', sets: [], winnerSide: null, courtId: 'court-2', scheduledAt: null, startedAt: null, finishedAt: null
    });

    const call = http.expectOne(`${DRAW_URL}/matches/KO-R1-M1/result`);
    expect(call.request.body).toEqual({
      status: 'scheduled', sets: [], winnerSide: null, courtId: 'court-2', scheduledAt: null, startedAt: null, finishedAt: null
    });
    expect('courtName' in call.request.body).toBeFalse();
    call.flush(rawDraw());
    await saved;
  });

  it('reads the court id of an admin result and leaves it out of a result without one', async () => {
    const found = repository.get('t-1');
    const body = buildKnockoutDraw(4) as unknown as Record<string, unknown>;
    const phases = body['phases'] as Array<{ rounds: Array<{ matches: Array<Record<string, unknown>> }> }>;
    phases[0].rounds[0].matches[0]['result'] = {
      status: 'scheduled', sets: [], winnerSide: null, courtId: 'court-2', courtName: 'Central',
      scheduledAt: null, startedAt: null, finishedAt: null
    };
    phases[0].rounds[0].matches[1]['result'] = {
      status: 'scheduled', sets: [], winnerSide: null, courtName: 'Lateral', scheduledAt: null, startedAt: null, finishedAt: null
    };
    http.expectOne(DRAW_URL).flush(body);

    const draw = await found;
    const [first, second] = draw!.phases[0].rounds[0].matches;
    expect(first.result?.courtId).toBe('court-2');
    expect(first.result?.courtName).toBe('Central');
    expect(second.result && 'courtId' in second.result).toBeFalse();
  });

  it('lists the eligible courts of the tournament', async () => {
    const courts = repository.getCourts('t 1');

    const call = http.expectOne('/api/admin/tournaments/t%201/draw/courts');
    expect(call.request.method).toBe('GET');
    call.flush([{ id: 'court-1', name: 'Central' }, { id: 'court-2', name: 'Lateral' }]);
    expect(await courts).toEqual([{ id: 'court-1', name: 'Central' }, { id: 'court-2', name: 'Lateral' }]);
  });

  it('maps a failed court list to its translated key', async () => {
    const courts = repository.getCourts('t-1');
    http.expectOne(`${DRAW_URL}/courts`).flush(...problem('tournaments.forbidden', 403));
    await expectAsync(courts).toBeRejectedWithError('tournaments.errors.forbidden');

    const empty = repository.getCourts('t-1');
    http.expectOne(`${DRAW_URL}/courts`).flush(null);
    expect(await empty).toEqual([]);
  });

  it('reads the API response fields: randomizationMode, options.scoring and an omitted separationConflicts', async () => {
    const found = repository.get('t-1');
    const body = {
      ...rawDraw('published'),
      randomizationMode: 'seeded',
      options: { knockout: { thirdPlaceMatch: false }, roundRobin: null, groups: null, scoring: { bestOf: 3, thirdSetSuperTiebreak: false } }
    };
    delete (body as Record<string, unknown>)['separationConflicts'];
    http.expectOne(DRAW_URL).flush(body);

    const draw = await found;
    expect(draw?.randomizationMode).toBe('seeded');
    expect(draw?.options?.['scoring']).toEqual({ bestOf: 3, thirdSetSuperTiebreak: false });
    expect(draw?.separationConflicts).toEqual([]);
  });

  it('maps a failed match result to the translated result key', async () => {
    const saved = repository.saveMatchResult('t-1', 'KO-R2-M1', {
      status: 'scheduled', sets: [], winnerSide: null, scheduledAt: null, startedAt: null, finishedAt: null
    });
    http.expectOne(`${DRAW_URL}/matches/KO-R2-M1/result`).flush(...problem('draws.results.participants_pending', 409));
    await expectAsync(saved).toBeRejectedWithError('draws.errors.results.participants_pending');
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

    it('maps every API result code (MatchResultErrors) to a key translated in es, en and pt', async () => {
      const codes: Array<[string, number]> = [
        ['invalid_status', 400], ['invalid_winner_side', 400], ['invalid_set', 400], ['invalid_super_tiebreak', 400],
        ['too_many_sets', 400], ['incomplete_score', 400], ['score_decided', 400], ['winner_mismatch', 400],
        ['winner_required', 400], ['winner_not_allowed', 400], ['sets_not_allowed_for_walkover', 400],
        ['sets_not_allowed_for_scheduled', 400], ['invalid_times', 400], ['unknown_match', 404],
        ['duplicate_result', 409], ['bye_match', 409], ['participants_pending', 409], ['locked_by_next_match', 409],
        ['invalid_court', 400]
      ];
      for (const [name, status] of codes) {
        const key = await failingSave(`draws.results.${name}`, status);
        expect(key).toBe(`draws.errors.results.${name}`);
        for (const locale of ['es', 'en', 'pt'] as const) {
          expect(TRANSLATIONS[locale][key]).withContext(`${locale} ${key}`).toBeTruthy();
        }
      }
    });

    it('maps the API use-case codes invalid_seed and not_draft (TournamentDrawErrors)', async () => {
      expect(await failingSave('draws.invalid_seed', 400)).toBe('draws.errors.invalid_seed');
      expect(await failingSave('draws.not_draft', 409)).toBe('draws.errors.not_draft');
      for (const key of ['draws.errors.invalid_seed', 'draws.errors.not_draft']) {
        for (const locale of ['es', 'en', 'pt'] as const) {
          expect(TRANSLATIONS[locale][key]).withContext(`${locale} ${key}`).toBeTruthy();
        }
      }
    });

    it('maps the D12 revision conflict to its own key, not to results-exist', async () => {
      expect(await failingSave('draws.concurrent_modification', 409)).toBe('draws.errors.concurrent_modification');
      for (const locale of ['es', 'en', 'pt'] as const) {
        expect(TRANSLATIONS[locale]['draws.errors.concurrent_modification']).withContext(locale).toBeTruthy();
      }
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
