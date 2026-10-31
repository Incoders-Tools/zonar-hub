import {
  normalizeTournamentDraw,
  toDrawMatchStatus,
  toDrawPhaseKind,
  tournamentDrawHasResults,
  TournamentDraw
} from './tournament-draw.model';
import { buildEightPairKnockoutDraw, buildKnockoutDraw, buildMatchResult, withResults } from './tournament-draw.testing';

describe('tournament draw enum normalisation', () => {
  it('maps phase kinds from camelCase, PascalCase, snake_case and API enum numbers', () => {
    expect(toDrawPhaseKind('groupStage')).toBe('groupStage');
    expect(toDrawPhaseKind('GroupStage')).toBe('groupStage');
    expect(toDrawPhaseKind('group_stage')).toBe('groupStage');
    expect(toDrawPhaseKind('Knockout')).toBe('knockout');
    expect(toDrawPhaseKind(3)).toBe('roundRobin');
    expect(toDrawPhaseKind('swiss')).toBeNull();
  });

  it('maps match statuses including the D3 snake_case spelling', () => {
    expect(toDrawMatchStatus('inProgress')).toBe('inProgress');
    expect(toDrawMatchStatus('in_progress')).toBe('inProgress');
    expect(toDrawMatchStatus('InProgress')).toBe('inProgress');
    expect(toDrawMatchStatus('Walkover')).toBe('walkover');
    expect(toDrawMatchStatus('unknown')).toBeNull();
  });

  it('normalises a payload idempotently and fills optional collections', () => {
    const raw = buildEightPairKnockoutDraw() as unknown as Record<string, unknown>;
    const phase = (raw['phases'] as Array<Record<string, unknown>>)[0];
    phase['kind'] = 2;
    delete phase['groups'];
    const round = (phase['rounds'] as Array<Record<string, unknown>>)[0];
    delete round['restingParticipantIds'];
    const match = (round['matches'] as Array<Record<string, unknown>>)[0];
    (match['result'] as Record<string, unknown>)['status'] = 'Completed';
    (match['result'] as Record<string, unknown>)['winnerSide'] = 'Home';

    const normalized = normalizeTournamentDraw(raw as unknown as TournamentDraw);

    expect(normalized.phases[0].kind).toBe('knockout');
    expect(normalized.phases[0].groups).toEqual([]);
    expect(normalized.phases[0].rounds[0].restingParticipantIds).toEqual([]);
    expect(normalized.phases[0].rounds[0].matches[0].result?.status).toBe('completed');
    expect(normalized.phases[0].rounds[0].matches[0].result?.winnerSide).toBe('home');
    expect(normalizeTournamentDraw(normalized)).toEqual(normalized);
  });

  it('keeps the { home, away } tie-break object and maps the legacy numeric loser points', () => {
    const draw = buildKnockoutDraw(2);
    const withSets = withResults(draw, {
      'KO-R1-M1': buildMatchResult({
        status: 'completed',
        winnerSide: 'away',
        sets: [
          { home: 6, away: 7, tiebreak: { home: 5, away: 7 } },
          { home: 7, away: 6, tiebreak: 9 as never },
          { home: 4, away: 6 }
        ]
      })
    });

    const sets = normalizeTournamentDraw(withSets).phases[0].rounds[0].matches[0].result?.sets;

    expect(sets).toEqual([
      { home: 6, away: 7, tiebreak: { home: 5, away: 7 } },
      { home: 7, away: 6, tiebreak: { home: 11, away: 9 } },
      { home: 4, away: 6, tiebreak: null }
    ]);
  });

  it('reads the randomization mode when the payload carries it', () => {
    const raw = { ...buildKnockoutDraw(2), randomization: { mode: 'Random', seed: 42 } } as unknown as TournamentDraw;

    expect(normalizeTournamentDraw(raw).randomizationMode).toBe('random');
    expect(normalizeTournamentDraw(buildKnockoutDraw(2)).randomizationMode).toBeNull();
  });

  it('reports results only when a match has a stored result', () => {
    expect(tournamentDrawHasResults(null)).toBeFalse();
    expect(tournamentDrawHasResults(buildKnockoutDraw(4))).toBeFalse();
    expect(tournamentDrawHasResults(buildEightPairKnockoutDraw())).toBeTrue();
  });

  it('drops phases of an unknown kind', () => {
    const draw = buildEightPairKnockoutDraw();
    draw.phases[0] = { ...draw.phases[0], kind: 'swiss' as never };

    expect(normalizeTournamentDraw(draw).phases).toEqual([]);
  });
});
