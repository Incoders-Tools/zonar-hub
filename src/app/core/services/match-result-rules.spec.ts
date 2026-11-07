import { DrawMatchResult, DrawSetScore, TournamentDrawMatchResultRequest } from '../models/tournament-draw.model';
import {
  BYE_SLOT,
  buildEightPairKnockoutDraw,
  buildGroupsThenKnockoutDraw,
  buildKnockoutDraw,
  buildMatchResult,
  buildSixPairByeKnockoutDraw,
  sets,
  withResults
} from '../models/tournament-draw.testing';
import { TRANSLATIONS } from '../i18n/i18n.translations';
import {
  DEFAULT_SCORING_RULES,
  DrawScoringRules,
  MatchResultFormValue,
  OTHER_COURT,
  clearMatchResultRequest,
  findDrawMatch,
  isMatchResultLocked,
  isSuperTiebreakSet,
  matchResultAvailability,
  matchResultFormValue,
  matchResultIssueKey,
  readSetScore,
  scoringRulesFromOptions,
  statusAllowsSets,
  statusRequiresWinner,
  toMatchResultRequest,
  validateMatchResult,
  validateMatchResultForm
} from './match-result-rules';

const RULES: DrawScoringRules = { bestOf: 3, thirdSetSuperTiebreak: true };
const NO_SUPER: DrawScoringRules = { bestOf: 3, thirdSetSuperTiebreak: false };

function set(home: number, away: number, tiebreak?: [number, number]): DrawSetScore {
  return tiebreak ? { home, away, tiebreak: { home: tiebreak[0], away: tiebreak[1] } } : { home, away };
}

function result(overrides: Partial<TournamentDrawMatchResultRequest>): TournamentDrawMatchResultRequest {
  return { status: 'completed', sets: [], winnerSide: null, scheduledAt: null, startedAt: null, finishedAt: null, ...overrides };
}

function formValue(overrides: Partial<MatchResultFormValue> = {}): MatchResultFormValue {
  return {
    status: 'completed',
    winnerSide: 'home',
    sets: [
      { home: 6, away: 4, tiebreakHome: null, tiebreakAway: null },
      { home: 6, away: 3, tiebreakHome: null, tiebreakAway: null },
      { home: null, away: null, tiebreakHome: null, tiebreakAway: null }
    ],
    courtId: '',
    courtName: '',
    scheduledAt: '',
    startedAt: '',
    finishedAt: '',
    ...overrides
  };
}

describe('match-result-rules', () => {
  describe('readSetScore (regular set, domain SetScoring)', () => {
    const cases: Array<[string, DrawSetScore, string]> = [
      ['6-0 won', set(6, 0), 'homeWon'],
      ['6-4 won', set(6, 4), 'homeWon'],
      ['4-6 won by away', set(4, 6), 'awayWon'],
      ['7-5 won', set(7, 5), 'homeWon'],
      ['7-6 without tie-break points', set(7, 6), 'homeWon'],
      ['7-6 with tie-break 7-5', set(7, 6, [7, 5]), 'homeWon'],
      ['6-7 with tie-break 4-7', set(6, 7, [4, 7]), 'awayWon'],
      ['7-6 with tie-break 10-8 (exactly 2 beyond 7)', set(7, 6, [10, 8]), 'homeWon'],
      ['5-5 partial', set(5, 5), 'partial'],
      ['6-5 partial', set(6, 5), 'partial'],
      ['6-6 partial', set(6, 6), 'partial'],
      ['0-0 partial', set(0, 0), 'partial'],
      ['6-5 with tie-break invalid', set(6, 5, [7, 5]), 'invalid'],
      ['7-4 invalid', set(7, 4), 'invalid'],
      ['8-6 invalid', set(8, 6), 'invalid'],
      ['7-7 invalid', set(7, 7), 'invalid'],
      ['negative games invalid', set(-1, 6), 'invalid'],
      ['7-5 with tie-break invalid (only 7-6 has one)', set(7, 5, [7, 3]), 'invalid'],
      ['7-6 with tie-break 7-6 invalid (lead of 1)', set(7, 6, [7, 6]), 'invalid'],
      ['7-6 with tie-break 11-8 invalid (lead of 3 beyond 7)', set(7, 6, [11, 8]), 'invalid'],
      ['7-6 with tie-break 6-4 invalid (target not reached)', set(7, 6, [6, 4]), 'invalid'],
      ['7-6 with tie-break won by the set loser invalid', set(7, 6, [5, 7]), 'invalid']
    ];
    for (const [name, score, expected] of cases) {
      it(name, () => expect(readSetScore(score, false)).toBe(expected));
    }
  });

  describe('readSetScore (super tie-break)', () => {
    const cases: Array<[string, DrawSetScore, string]> = [
      ['10-8 won', set(10, 8), 'homeWon'],
      ['10-0 won', set(10, 0), 'homeWon'],
      ['8-10 won by away', set(8, 10), 'awayWon'],
      ['11-9 won', set(11, 9), 'homeWon'],
      ['12-10 won', set(12, 10), 'homeWon'],
      ['9-7 partial', set(9, 7), 'partial'],
      ['10-9 partial', set(10, 9), 'partial'],
      ['11-11 partial', set(11, 11), 'partial'],
      ['12-9 invalid (lead of 3 beyond 10)', set(12, 9), 'invalid'],
      ['10-8 with tie-break points invalid', set(10, 8, [7, 5]), 'invalid'],
      ['negative points invalid', set(10, -2), 'invalid']
    ];
    for (const [name, score, expected] of cases) {
      it(name, () => expect(readSetScore(score, true)).toBe(expected));
    }
  });

  describe('validateMatchResult (domain MatchResultValidator)', () => {
    const cases: Array<[string, TournamentDrawMatchResultRequest, DrawScoringRules, string | null]> = [
      ['completed 6-4 6-3 home', result({ sets: [set(6, 4), set(6, 3)], winnerSide: 'home' }), RULES, null],
      ['completed with super tie-break', result({ sets: [set(4, 6), set(6, 3), set(8, 10)], winnerSide: 'away' }), RULES, null],
      ['completed third regular set without super tie-break', result({ sets: [set(4, 6), set(6, 3), set(7, 6, [7, 2])], winnerSide: 'home' }), NO_SUPER, null],
      ['completed 7-6 third set when it must be a super tie-break', result({ sets: [set(4, 6), set(6, 3), set(7, 6)], winnerSide: 'home' }), RULES, 'invalid_super_tiebreak'],
      ['completed 10-8 third set without super tie-break', result({ sets: [set(4, 6), set(6, 3), set(10, 8)], winnerSide: 'home' }), NO_SUPER, 'invalid_set'],
      ['completed without winner', result({ sets: [set(6, 4), set(6, 3)] }), RULES, 'winner_required'],
      ['completed with the wrong winner', result({ sets: [set(6, 4), set(6, 3)], winnerSide: 'away' }), RULES, 'winner_mismatch'],
      ['completed undecided', result({ sets: [set(6, 4), set(3, 6)], winnerSide: 'home' }), RULES, 'incomplete_score'],
      ['completed with a partial set', result({ sets: [set(6, 4), set(5, 3)], winnerSide: 'home' }), RULES, 'invalid_set'],
      ['completed with an invalid set', result({ sets: [set(6, 5), set(6, 3)], winnerSide: 'home' }), RULES, 'invalid_set'],
      ['completed with a set after the match was won', result({ sets: [set(6, 4), set(6, 3), set(10, 8)], winnerSide: 'home' }), RULES, 'too_many_sets'],
      ['completed with four sets', result({ sets: [set(6, 4), set(4, 6), set(6, 4), set(6, 4)], winnerSide: 'home' }), NO_SUPER, 'too_many_sets'],
      ['in progress partial', result({ status: 'inProgress', sets: [set(6, 2), set(3, 1)] }), RULES, null],
      ['in progress without sets', result({ status: 'inProgress' }), RULES, null],
      ['in progress with a winner', result({ status: 'inProgress', sets: [set(6, 2)], winnerSide: 'home' }), RULES, 'winner_not_allowed'],
      ['in progress already decided', result({ status: 'inProgress', sets: [set(6, 2), set(6, 1)] }), RULES, 'score_decided'],
      ['in progress with a partial set before the last', result({ status: 'inProgress', sets: [set(5, 2), set(3, 1)] }), RULES, 'invalid_set'],
      ['retired with partial score', result({ status: 'retired', sets: [set(6, 2), set(2, 1)], winnerSide: 'home' }), RULES, null],
      ['retired without sets', result({ status: 'retired', winnerSide: 'away' }), RULES, null],
      ['retired without winner', result({ status: 'retired', sets: [set(6, 2)] }), RULES, 'winner_required'],
      ['retired with a decided score', result({ status: 'retired', sets: [set(6, 2), set(6, 2)], winnerSide: 'home' }), RULES, 'score_decided'],
      ['walkover', result({ status: 'walkover', winnerSide: 'home' }), RULES, null],
      ['walkover without winner', result({ status: 'walkover' }), RULES, 'winner_required'],
      ['walkover with sets', result({ status: 'walkover', winnerSide: 'home', sets: [set(6, 0)] }), RULES, 'sets_not_allowed_for_walkover'],
      ['scheduled empty', result({ status: 'scheduled' }), RULES, null],
      ['scheduled with sets', result({ status: 'scheduled', sets: [set(6, 0)] }), RULES, 'sets_not_allowed_for_scheduled'],
      ['scheduled with a winner', result({ status: 'scheduled', winnerSide: 'home' }), RULES, 'winner_not_allowed'],
      ['finished before started', result({ status: 'walkover', winnerSide: 'home', startedAt: '2026-11-20T11:00:00Z', finishedAt: '2026-11-20T10:59:00Z' }), RULES, 'invalid_times'],
      ['finished equal to started', result({ status: 'walkover', winnerSide: 'home', startedAt: '2026-11-20T11:00:00Z', finishedAt: '2026-11-20T11:00:00Z' }), RULES, null]
    ];
    for (const [name, value, rules, expected] of cases) {
      it(name, () => expect<string | null>(validateMatchResult(value, rules)?.code ?? null).toBe(expected));
    }

    it('reports the index of the offending set', () => {
      expect(validateMatchResult(result({ sets: [set(6, 4), set(8, 6)], winnerSide: 'home' }), RULES))
        .toEqual({ code: 'invalid_set', setIndex: 1 });
    });
  });

  it('maps every issue code to a translated draws.errors.results key in es, en and pt', () => {
    const codes = ['invalid_set', 'invalid_super_tiebreak', 'too_many_sets', 'incomplete_score', 'score_decided',
      'winner_required', 'winner_mismatch', 'winner_not_allowed', 'sets_not_allowed_for_walkover',
      'sets_not_allowed_for_scheduled', 'invalid_times', 'locked_by_next_match'] as const;
    for (const code of codes) {
      const key = matchResultIssueKey({ code });
      expect(key).toBe(`draws.errors.results.${code}`);
      for (const locale of ['es', 'en', 'pt'] as const) {
        expect(TRANSLATIONS[locale][key]).withContext(`${locale} ${key}`).toBeTruthy();
      }
    }
  });

  it('reads the scoring rules from the draw options, with the D3 defaults', () => {
    expect(scoringRulesFromOptions(null)).toEqual(DEFAULT_SCORING_RULES);
    expect(DEFAULT_SCORING_RULES).toEqual({ bestOf: 3, thirdSetSuperTiebreak: true });
    expect(scoringRulesFromOptions({ scoring: { bestOf: 3, thirdSetSuperTiebreak: false } })).toEqual(NO_SUPER);
    expect(scoringRulesFromOptions({ thirdSetSuperTiebreak: false })).toEqual(NO_SUPER);
    expect(isSuperTiebreakSet(2, RULES)).toBeTrue();
    expect(isSuperTiebreakSet(1, RULES)).toBeFalse();
    expect(isSuperTiebreakSet(2, NO_SUPER)).toBeFalse();
  });

  it('tells which statuses need a winner and which carry sets', () => {
    expect(['completed', 'walkover', 'retired'].every(status => statusRequiresWinner(status as never))).toBeTrue();
    expect(statusRequiresWinner('scheduled')).toBeFalse();
    expect(statusRequiresWinner('inProgress')).toBeFalse();
    expect(['inProgress', 'completed', 'retired'].every(status => statusAllowsSets(status as never))).toBeTrue();
    expect(statusAllowsSets('scheduled')).toBeFalse();
    expect(statusAllowsSets('walkover')).toBeFalse();
  });

  describe('match availability and lock (domain DrawProgression.CanRecordResult)', () => {
    it('allows a match whose both slots are resolved participants', () => {
      const draw = buildEightPairKnockoutDraw();
      expect(matchResultAvailability(findDrawMatch(draw, 'KO-R1-M1')!)).toBe('available');
      expect(matchResultAvailability(findDrawMatch(draw, 'KO-R2-M1')!)).toBe('available');
    });

    it('refuses bye matches and matches with pending participants', () => {
      const byes = buildSixPairByeKnockoutDraw();
      expect(matchResultAvailability(findDrawMatch(byes, 'KO-R1-M1')!)).toBe('bye_match');
      expect(matchResultAvailability({ ...findDrawMatch(byes, 'KO-R1-M2')!, away: BYE_SLOT })).toBe('bye_match');
      expect(matchResultAvailability(findDrawMatch(byes, 'KO-R2-M2')!)).toBe('participants_pending');
      expect(matchResultAvailability(findDrawMatch(buildEightPairKnockoutDraw(), 'KO-R2-M2')!)).toBe('participants_pending');
    });

    it('locks a knockout result once the next match has started, not while it is only scheduled', () => {
      const draw = buildEightPairKnockoutDraw();
      expect(isMatchResultLocked(draw, 'KO-R1-M1')).toBeFalse();
      const started = withResults(draw, {
        'KO-R2-M1': buildMatchResult({ status: 'inProgress', sets: sets([3, 2]) })
      });
      expect(isMatchResultLocked(started, 'KO-R1-M1')).toBeTrue();
      expect(isMatchResultLocked(started, 'KO-R1-M2')).toBeTrue();
      expect(isMatchResultLocked(started, 'KO-R1-M3')).toBeFalse();
    });

    it('locks a semifinal once the third-place match (fed by its loser) has started', () => {
      const draw = withResults(buildKnockoutDraw(4, true), {
        'KO-R1-M1': buildMatchResult({ status: 'walkover', winnerSide: 'home' }),
        'KO-R1-M2': buildMatchResult({ status: 'walkover', winnerSide: 'home' }),
        'KO-R2-M2': buildMatchResult({ status: 'walkover', winnerSide: 'away' })
      });
      expect(isMatchResultLocked(draw, 'KO-R1-M1')).toBeTrue();
    });

    it('locks group matches once a knockout match fed by the group has started', () => {
      const draw = buildGroupsThenKnockoutDraw();
      const groupMatch = draw.phases[0].rounds[0].matches.find(match => match.id.startsWith('G-A'))!;
      expect(isMatchResultLocked(draw, groupMatch.id)).toBeFalse();
      const started = withResults(draw, { 'KO-R1-M1': buildMatchResult({ status: 'inProgress' }) });
      expect(isMatchResultLocked(started, groupMatch.id)).toBeTrue();
    });
  });

  describe('form mapping', () => {
    it('builds the exact request body from the form value', () => {
      const value = formValue({
        sets: [
          { home: 6, away: 4, tiebreakHome: null, tiebreakAway: null },
          { home: 6, away: 7, tiebreakHome: 5, tiebreakAway: 7 },
          { home: 10, away: 8, tiebreakHome: null, tiebreakAway: null }
        ],
        courtId: OTHER_COURT,
        courtName: '  Central ',
        scheduledAt: '2026-11-20T09:30',
        startedAt: '2026-11-20T10:00',
        finishedAt: '2026-11-20T11:20'
      });
      expect(toMatchResultRequest(value, RULES)).toEqual({
        status: 'completed',
        sets: [{ home: 6, away: 4, tiebreak: null }, { home: 6, away: 7, tiebreak: { home: 5, away: 7 } }, { home: 10, away: 8, tiebreak: null }],
        winnerSide: 'home',
        courtName: 'Central',
        scheduledAt: new Date('2026-11-20T09:30').toISOString(),
        startedAt: new Date('2026-11-20T10:00').toISOString(),
        finishedAt: new Date('2026-11-20T11:20').toISOString()
      });
    });

    it('sends the chosen court id without a name, the free text for another court and no court otherwise', () => {
      const listed = toMatchResultRequest(formValue({ courtId: 'court-2', courtName: 'stale text' }), RULES);
      expect(listed.courtId).toBe('court-2');
      expect('courtName' in listed).toBeFalse();

      const other = toMatchResultRequest(formValue({ courtId: OTHER_COURT, courtName: ' Club vecino ' }), RULES);
      expect(other.courtName).toBe('Club vecino');
      expect('courtId' in other).toBeFalse();
      expect(toMatchResultRequest(formValue({ courtId: OTHER_COURT, courtName: '  ' }), RULES).courtName).toBeNull();

      const none = toMatchResultRequest(formValue({ courtId: '', courtName: 'hidden text' }), RULES);
      expect(none.courtName).toBeNull();
      expect('courtId' in none).toBeFalse();
    });

    it('preselects the stored court id, or another court with the stored name, or no court', () => {
      const byId = matchResultFormValue(buildMatchResult({ courtId: 'court-2', courtName: 'Central' }), RULES);
      expect([byId.courtId, byId.courtName]).toEqual(['court-2', '']);
      const byName = matchResultFormValue(buildMatchResult({ courtName: 'Club vecino' }), RULES);
      expect([byName.courtId, byName.courtName]).toEqual([OTHER_COURT, 'Club vecino']);
      const none = matchResultFormValue(buildMatchResult(), RULES);
      expect([none.courtId, none.courtName]).toEqual(['', '']);
    });

    it('keeps the court id when clearing a result recorded on a listed court', () => {
      const cleared = clearMatchResultRequest(buildMatchResult({
        status: 'completed', sets: sets([6, 4], [6, 3]), winnerSide: 'home', courtId: 'court-2', courtName: 'Central'
      }));
      expect(cleared.courtId).toBe('court-2');
      expect('courtName' in cleared).toBeFalse();
    });

    it('drops sets and the winner when the status does not carry them', () => {
      expect(toMatchResultRequest(formValue({ status: 'walkover' }), RULES)).toEqual(jasmine.objectContaining({ sets: [], winnerSide: 'home' }));
      expect(toMatchResultRequest(formValue({ status: 'inProgress' }), RULES)).toEqual(jasmine.objectContaining({ winnerSide: null }));
      expect(toMatchResultRequest(formValue({ status: 'scheduled' }), RULES)).toEqual(jasmine.objectContaining({ sets: [], winnerSide: null, courtName: null }));
    });

    it('ignores tie-break points of a set that is not 7-6', () => {
      const value = formValue({ sets: [{ home: 6, away: 4, tiebreakHome: 7, tiebreakAway: 3 }, { home: 6, away: 3, tiebreakHome: null, tiebreakAway: null }] });
      expect(toMatchResultRequest(value, RULES).sets[0]).toEqual({ home: 6, away: 4, tiebreak: null });
    });

    it('rejects a half-filled set row, an empty row before a filled one and half-filled tie-break points', () => {
      const half = formValue({ sets: [{ home: 6, away: null, tiebreakHome: null, tiebreakAway: null }] });
      expect(validateMatchResultForm(half, RULES)).toEqual({ code: 'invalid_set', setIndex: 0 });
      const gap = formValue({
        sets: [
          { home: 6, away: 4, tiebreakHome: null, tiebreakAway: null },
          { home: null, away: null, tiebreakHome: null, tiebreakAway: null },
          { home: 10, away: 8, tiebreakHome: null, tiebreakAway: null }
        ]
      });
      expect(validateMatchResultForm(gap, RULES)).toEqual({ code: 'invalid_set', setIndex: 1 });
      const superGap = formValue({
        sets: [
          { home: 6, away: 4, tiebreakHome: null, tiebreakAway: null },
          { home: 4, away: 6, tiebreakHome: null, tiebreakAway: null },
          { home: 10, away: null, tiebreakHome: null, tiebreakAway: null }
        ]
      });
      expect(validateMatchResultForm(superGap, RULES)).toEqual({ code: 'invalid_super_tiebreak', setIndex: 2 });
      const tiebreak = formValue({ sets: [{ home: 7, away: 6, tiebreakHome: 7, tiebreakAway: null }, { home: 6, away: 3, tiebreakHome: null, tiebreakAway: null }] });
      expect(validateMatchResultForm(tiebreak, RULES)).toEqual({ code: 'invalid_set', setIndex: 0 });
      expect(validateMatchResultForm(formValue(), RULES)).toBeNull();
    });

    it('refuses an outcome change on a locked match but allows court and time changes', () => {
      const current: DrawMatchResult = buildMatchResult({ status: 'completed', sets: sets([6, 4], [6, 3]), winnerSide: 'home', courtName: 'Cancha 1' });
      const lock = { locked: true, current };
      expect(validateMatchResultForm(formValue({ courtName: 'Central' }), RULES, lock)).toBeNull();
      const changed = formValue({ sets: [{ home: 6, away: 4, tiebreakHome: null, tiebreakAway: null }, { home: 6, away: 2, tiebreakHome: null, tiebreakAway: null }] });
      expect(validateMatchResultForm(changed, RULES, lock)).toEqual({ code: 'locked_by_next_match' });
      expect(validateMatchResultForm(changed, RULES, { locked: false, current })).toBeNull();
    });

    it('fills the form from a stored result with local date-times and three set rows', () => {
      const stored = buildMatchResult({
        status: 'completed', sets: sets([6, 7, 5, 7], [6, 4], [10, 7]), winnerSide: 'home', courtName: 'Central',
        startedAt: '2026-11-20T10:00:00Z', finishedAt: null
      });
      const value = matchResultFormValue(stored, RULES);
      expect(value.status).toBe('completed');
      expect(value.winnerSide).toBe('home');
      expect(value.sets).toEqual([
        { home: 6, away: 7, tiebreakHome: 5, tiebreakAway: 7 },
        { home: 6, away: 4, tiebreakHome: null, tiebreakAway: null },
        { home: 10, away: 7, tiebreakHome: null, tiebreakAway: null }
      ]);
      expect(value.courtName).toBe('Central');
      expect(new Date(value.startedAt).toISOString()).toBe('2026-11-20T10:00:00.000Z');
      expect(value.finishedAt).toBe('');

      const empty = matchResultFormValue(null, RULES);
      expect(empty.status).toBe('scheduled');
      expect(empty.winnerSide).toBeNull();
      expect(empty.sets.length).toBe(3);
    });

    it('builds the clear body: scheduled without sets or winner, keeping court and planned time', () => {
      const current = buildMatchResult({
        status: 'completed', sets: sets([6, 4], [6, 3]), winnerSide: 'home', courtName: 'Central',
        scheduledAt: '2026-11-20T09:30:00Z', startedAt: '2026-11-20T10:00:00Z', finishedAt: '2026-11-20T11:00:00Z'
      });
      expect(clearMatchResultRequest(current)).toEqual({
        status: 'scheduled', sets: [], winnerSide: null, courtName: 'Central',
        scheduledAt: '2026-11-20T09:30:00Z', startedAt: null, finishedAt: null
      });
    });
  });
});
