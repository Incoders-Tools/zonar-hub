import { normalizeTournamentDraw, toDrawMatchStatus, toDrawPhaseKind, TournamentDraw } from './tournament-draw.model';
import { buildEightPairKnockoutDraw } from './tournament-draw.testing';

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

  it('drops phases of an unknown kind', () => {
    const draw = buildEightPairKnockoutDraw();
    draw.phases[0] = { ...draw.phases[0], kind: 'swiss' as never };

    expect(normalizeTournamentDraw(draw).phases).toEqual([]);
  });
});
