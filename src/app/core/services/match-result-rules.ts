import {
  DrawMatch,
  DrawMatchResult,
  DrawMatchStatus,
  DrawPhase,
  DrawSetScore,
  DrawSide,
  DrawSlot,
  TournamentDraw,
  TournamentDrawMatchResultRequest
} from '../models/tournament-draw.model';

/**
 * Pure match result rules of the admin result entry (F3). They mirror the API domain
 * (`ZonarHub.Domain.Draws.Results`: `SetScoring`, `MatchResultValidator`, `DrawProgression.CanRecordResult`), so
 * the dialog explains a problem before the request; the API stays the authority. Issue codes are the domain
 * `draws.results.*` names and share their translated messages (`draws.errors.results.*`). No Angular dependencies.
 */

/** Scoring of a draw (domain `ScoringRules`): best of 3, deciding set as a super tie-break to 10 by default. */
export interface DrawScoringRules {
  bestOf: number;
  thirdSetSuperTiebreak: boolean;
}

export const DEFAULT_SCORING_RULES: DrawScoringRules = { bestOf: 3, thirdSetSuperTiebreak: true };

export type SetOutcome = 'invalid' | 'partial' | 'homeWon' | 'awayWon';

/** Domain `MatchResultErrors` names the client can detect, plus the lock rule of `CanRecordResult`. */
export type MatchResultIssueCode =
  | 'invalid_set'
  | 'invalid_super_tiebreak'
  | 'too_many_sets'
  | 'incomplete_score'
  | 'score_decided'
  | 'winner_required'
  | 'winner_mismatch'
  | 'winner_not_allowed'
  | 'sets_not_allowed_for_walkover'
  | 'sets_not_allowed_for_scheduled'
  | 'invalid_times'
  | 'locked_by_next_match';

export interface MatchResultIssue {
  code: MatchResultIssueCode;
  /** Zero-based index of the offending set, for set-level issues. */
  setIndex?: number;
}

/** Why a match cannot take a result (domain `bye_match` / `participants_pending`), or `available`. */
export type MatchResultAvailability = 'available' | 'bye_match' | 'participants_pending';

/** The result fields the validator reads. */
export type MatchResultScore = Pick<TournamentDrawMatchResultRequest, 'status' | 'sets' | 'winnerSide' | 'startedAt' | 'finishedAt'>;

/** One set row of the result form; empty inputs are null. */
export interface MatchResultSetInput {
  home: number | null;
  away: number | null;
  tiebreakHome: number | null;
  tiebreakAway: number | null;
}

/** Raw value of the result form. Date-times use the `datetime-local` format (`YYYY-MM-DDTHH:mm`, local time). */
export interface MatchResultFormValue {
  status: DrawMatchStatus;
  winnerSide: DrawSide | null;
  sets: MatchResultSetInput[];
  courtName: string;
  scheduledAt: string;
  startedAt: string;
  finishedAt: string;
}

/** Lock context of the edited match: once locked, only court and times may change (same outcome). */
export interface MatchResultLock {
  locked: boolean;
  current: DrawMatchResult | null;
}

const SET_GAMES = 6;
const TIEBREAK_POINTS = 7;
const SUPER_TIEBREAK_POINTS = 10;
const RESULT_ERROR_PREFIX = 'draws.errors.results.';

// ---------------------------------------------------------------------------
// Scoring rules
// ---------------------------------------------------------------------------

/** Reads `options.scoring` of a draw response (also the legacy top-level `thirdSetSuperTiebreak`). */
export function scoringRulesFromOptions(options: Record<string, unknown> | null | undefined): DrawScoringRules {
  const scoring = (options?.['scoring'] ?? options ?? {}) as { bestOf?: unknown; thirdSetSuperTiebreak?: unknown };
  const bestOf = typeof scoring.bestOf === 'number' && scoring.bestOf >= 1 && scoring.bestOf % 2 === 1
    ? scoring.bestOf
    : DEFAULT_SCORING_RULES.bestOf;
  const thirdSetSuperTiebreak = typeof scoring.thirdSetSuperTiebreak === 'boolean'
    ? scoring.thirdSetSuperTiebreak
    : DEFAULT_SCORING_RULES.thirdSetSuperTiebreak;
  return { bestOf, thirdSetSuperTiebreak };
}

/** Whether the set at zero-based `index` is played as a super tie-break (the deciding set). */
export function isSuperTiebreakSet(index: number, rules: DrawScoringRules): boolean {
  return rules.thirdSetSuperTiebreak && index === rules.bestOf - 1;
}

function setsToWin(rules: DrawScoringRules): number {
  return Math.floor(rules.bestOf / 2) + 1;
}

export function statusRequiresWinner(status: DrawMatchStatus): boolean {
  return status === 'completed' || status === 'walkover' || status === 'retired';
}

export function statusAllowsSets(status: DrawMatchStatus): boolean {
  return status === 'inProgress' || status === 'completed' || status === 'retired';
}

// ---------------------------------------------------------------------------
// Set and match validation (domain SetScoring / MatchResultValidator)
// ---------------------------------------------------------------------------

/** Reaching `target` with a 2-point lead, or beyond it with exactly 2. */
function isWon(winner: number, loser: number, target: number): boolean {
  return (winner === target && loser <= target - 2) || (winner > target && winner - loser === 2);
}

/**
 * One set: regular sets are won 6-0..6-4, 7-5 or 7-6 (optional tie-break points on 7-6 only, won by the set winner
 * at 7 with 2 of lead, beyond 7 by exactly 2); partial with at most 6 games a side and no tie-break. A super
 * tie-break is won at 10 with 2 of lead (beyond by exactly 2), partial below 10 or within one point, never with
 * tie-break points.
 */
export function readSetScore(set: DrawSetScore, superTiebreak: boolean): SetOutcome {
  if (!Number.isInteger(set.home) || !Number.isInteger(set.away) || set.home < 0 || set.away < 0) {
    return 'invalid';
  }
  const winner = Math.max(set.home, set.away);
  const loser = Math.min(set.home, set.away);
  const won: SetOutcome = set.home > set.away ? 'homeWon' : 'awayWon';
  const tiebreak = set.tiebreak ?? null;

  if (superTiebreak) {
    if (tiebreak) return 'invalid';
    if (isWon(winner, loser, SUPER_TIEBREAK_POINTS)) return won;
    return winner < SUPER_TIEBREAK_POINTS || winner - loser <= 1 ? 'partial' : 'invalid';
  }

  const finished = (winner === SET_GAMES && loser <= SET_GAMES - 2)
    || (winner === SET_GAMES + 1 && (loser === SET_GAMES - 1 || loser === SET_GAMES));
  if (!finished) {
    return !tiebreak && winner <= SET_GAMES ? 'partial' : 'invalid';
  }
  if (!tiebreak) return won;

  const tiebreakValid = loser === SET_GAMES
    && Number.isInteger(tiebreak.home) && Number.isInteger(tiebreak.away)
    && tiebreak.home >= 0 && tiebreak.away >= 0
    && (tiebreak.home > tiebreak.away) === (set.home > set.away)
    && isWon(Math.max(tiebreak.home, tiebreak.away), Math.min(tiebreak.home, tiebreak.away), TIEBREAK_POINTS);
  return tiebreakValid ? won : 'invalid';
}

function matchWinner(home: number, away: number, rules: DrawScoringRules): DrawSide | null {
  const target = setsToWin(rules);
  return home === target ? 'home' : away === target ? 'away' : null;
}

/** Sets won per side, or the first set-level issue. */
function readSets(sets: DrawSetScore[], rules: DrawScoringRules, allowPartialLastSet: boolean): { home: number; away: number } | MatchResultIssue {
  if (sets.length > rules.bestOf) {
    return { code: 'too_many_sets' };
  }
  let home = 0;
  let away = 0;
  for (let index = 0; index < sets.length; index++) {
    if (matchWinner(home, away, rules)) {
      return { code: 'too_many_sets', setIndex: index };
    }
    const superTiebreak = isSuperTiebreakSet(index, rules);
    const outcome = readSetScore(sets[index], superTiebreak);
    const partialAllowed = allowPartialLastSet && index === sets.length - 1;
    if (outcome === 'invalid' || (outcome === 'partial' && !partialAllowed)) {
      return { code: superTiebreak ? 'invalid_super_tiebreak' : 'invalid_set', setIndex: index };
    }
    if (outcome === 'homeWon') home++;
    else if (outcome === 'awayWon') away++;
  }
  return { home, away };
}

function isIssue(value: { home: number; away: number } | MatchResultIssue): value is MatchResultIssue {
  return 'code' in value;
}

function validateStatus(result: MatchResultScore, rules: DrawScoringRules): MatchResultIssue | null {
  switch (result.status) {
    case 'scheduled':
      if (result.winnerSide) return { code: 'winner_not_allowed' };
      return result.sets.length > 0 ? { code: 'sets_not_allowed_for_scheduled' } : null;
    case 'walkover':
      if (!result.winnerSide) return { code: 'winner_required' };
      return result.sets.length > 0 ? { code: 'sets_not_allowed_for_walkover' } : null;
    case 'completed': {
      if (!result.winnerSide) return { code: 'winner_required' };
      const score = readSets(result.sets, rules, false);
      if (isIssue(score)) return score;
      const winner = matchWinner(score.home, score.away, rules);
      if (!winner) return { code: 'incomplete_score' };
      return winner === result.winnerSide ? null : { code: 'winner_mismatch' };
    }
    default: {
      // In progress (no winner) or retired (winner required): a partial score nobody has won yet.
      const winnerRequired = result.status === 'retired';
      if (winnerRequired && !result.winnerSide) return { code: 'winner_required' };
      if (!winnerRequired && result.winnerSide) return { code: 'winner_not_allowed' };
      const score = readSets(result.sets, rules, true);
      if (isIssue(score)) return score;
      return matchWinner(score.home, score.away, rules) ? { code: 'score_decided' } : null;
    }
  }
}

/** First issue of a result (domain `MatchResultValidator.Validate` order), or null when valid. */
export function validateMatchResult(result: MatchResultScore, rules: DrawScoringRules): MatchResultIssue | null {
  const issue = validateStatus(result, rules);
  if (issue) return issue;
  if (result.startedAt && result.finishedAt && Date.parse(result.finishedAt) < Date.parse(result.startedAt)) {
    return { code: 'invalid_times' };
  }
  return null;
}

/** Translation key of an issue (shared with the API problem codes). */
export function matchResultIssueKey(issue: Pick<MatchResultIssue, 'code'>): string {
  return RESULT_ERROR_PREFIX + issue.code;
}

// ---------------------------------------------------------------------------
// Availability and lock (domain DrawProgression.CanRecordResult)
// ---------------------------------------------------------------------------

function allMatches(draw: TournamentDraw): Array<{ phase: DrawPhase; match: DrawMatch }> {
  return draw.phases.flatMap(phase => phase.rounds.flatMap(round => round.matches.map(match => ({ phase, match }))));
}

export function findDrawMatch(draw: TournamentDraw, matchId: string): DrawMatch | null {
  return allMatches(draw).find(entry => entry.match.id === matchId)?.match ?? null;
}

function slotParticipant(slot: DrawSlot): string | null {
  if (slot.kind === 'participant') return slot.participantId ?? null;
  if (slot.kind === 'bye') return null;
  return slot.resolvedParticipantId ?? null;
}

function isByeMatch(match: DrawMatch): boolean {
  return match.home.kind === 'bye' || match.away.kind === 'bye';
}

/** A result can be entered only when both slots are resolved participants and the match is not a bye. */
export function matchResultAvailability(match: DrawMatch): MatchResultAvailability {
  if (isByeMatch(match)) return 'bye_match';
  return slotParticipant(match.home) && slotParticipant(match.away) ? 'available' : 'participants_pending';
}

/** Only a non-`scheduled` result counts as played (scheduled rows carry court and time only). */
function hasStarted(match: DrawMatch): boolean {
  return match.result != null && match.result.status !== 'scheduled';
}

function feedsAStartedMatch(draw: TournamentDraw, matchId: string): boolean {
  return allMatches(draw)
    .map(entry => entry.match)
    .filter(next => [next.home, next.away].some(slot =>
      (slot.kind === 'winnerOf' || slot.kind === 'loserOf') && slot.matchId === matchId))
    .some(next => hasStarted(next) || (isByeMatch(next) && feedsAStartedMatch(draw, next.id)));
}

/**
 * The match result is locked when a match it feeds has started: the next knockout match (winner or loser), or for
 * a group match any started match fed by a position of its group. A locked result keeps its outcome; court and
 * times may still change.
 */
export function isMatchResultLocked(draw: TournamentDraw, matchId: string): boolean {
  const entry = allMatches(draw).find(item => item.match.id === matchId);
  if (!entry) return false;
  if (entry.phase.kind === 'groupStage') {
    const homeId = slotParticipant(entry.match.home);
    const group = entry.phase.groups?.find(candidate => homeId != null && candidate.participantIds.includes(homeId));
    if (!group) return false;
    return allMatches(draw).some(({ match }) => hasStarted(match)
      && [match.home, match.away].some(slot => slot.kind === 'groupPosition' && slot.groupId === group.id));
  }
  return feedsAStartedMatch(draw, matchId);
}

function sameSets(left: DrawSetScore[], right: DrawSetScore[]): boolean {
  return left.length === right.length && left.every((set, index) => {
    const other = right[index];
    const tiebreak = set.tiebreak ?? null;
    const otherTiebreak = other.tiebreak ?? null;
    return set.home === other.home && set.away === other.away
      && (tiebreak === otherTiebreak
        || (tiebreak != null && otherTiebreak != null && tiebreak.home === otherTiebreak.home && tiebreak.away === otherTiebreak.away));
  });
}

/** Same status, winner and sets (domain `HasSameOutcome`): only court or times differ. */
export function hasSameOutcome(current: DrawMatchResult | null, next: MatchResultScore): boolean {
  return current != null
    && current.status === next.status
    && (current.winnerSide ?? null) === (next.winnerSide ?? null)
    && sameSets(current.sets, next.sets);
}

// ---------------------------------------------------------------------------
// Form mapping
// ---------------------------------------------------------------------------

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** ISO instant → `datetime-local` value in local time; empty when absent or invalid. */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** `datetime-local` value → ISO instant (UTC); null when empty. */
export function fromDateTimeLocal(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function emptySetInput(): MatchResultSetInput {
  return { home: null, away: null, tiebreakHome: null, tiebreakAway: null };
}

/** Form value of a stored result (or of a new match: scheduled, empty), with one row per possible set. */
export function matchResultFormValue(result: DrawMatchResult | null, rules: DrawScoringRules): MatchResultFormValue {
  const sets = Array.from({ length: rules.bestOf }, (_, index) => {
    const set = result?.sets[index];
    return set
      ? { home: set.home, away: set.away, tiebreakHome: set.tiebreak?.home ?? null, tiebreakAway: set.tiebreak?.away ?? null }
      : emptySetInput();
  });
  return {
    status: result?.status ?? 'scheduled',
    winnerSide: result?.winnerSide ?? null,
    sets,
    courtName: result?.courtName ?? '',
    scheduledAt: toDateTimeLocal(result?.scheduledAt),
    startedAt: toDateTimeLocal(result?.startedAt),
    finishedAt: toDateTimeLocal(result?.finishedAt)
  };
}

function isBlank(value: number | null | undefined): boolean {
  return value == null || (value as unknown) === '' || Number.isNaN(value);
}

function isRowEmpty(row: MatchResultSetInput): boolean {
  return isBlank(row.home) && isBlank(row.away);
}

/** Tie-break inputs apply to a 7-6 / 6-7 regular set only. */
export function setShowsTiebreak(row: Pick<MatchResultSetInput, 'home' | 'away'>, index: number, rules: DrawScoringRules): boolean {
  if (isSuperTiebreakSet(index, rules) || isBlank(row.home) || isBlank(row.away)) return false;
  const high = Math.max(Number(row.home), Number(row.away));
  const low = Math.min(Number(row.home), Number(row.away));
  return high === SET_GAMES + 1 && low === SET_GAMES;
}

/** Rows up to the last filled one (trailing empty rows are not sets). */
function filledRows(rows: MatchResultSetInput[]): MatchResultSetInput[] {
  let last = rows.length - 1;
  while (last >= 0 && isRowEmpty(rows[last])) last--;
  return rows.slice(0, last + 1);
}

/** The D5 request body of the form: sets and winner only when the status carries them. */
export function toMatchResultRequest(value: MatchResultFormValue, rules: DrawScoringRules): TournamentDrawMatchResultRequest {
  const sets: DrawSetScore[] = statusAllowsSets(value.status)
    ? filledRows(value.sets).map((row, index) => {
      const withTiebreak = setShowsTiebreak(row, index, rules) && !isBlank(row.tiebreakHome) && !isBlank(row.tiebreakAway);
      return {
        home: Number(row.home),
        away: Number(row.away),
        tiebreak: withTiebreak ? { home: Number(row.tiebreakHome), away: Number(row.tiebreakAway) } : null
      };
    })
    : [];
  return {
    status: value.status,
    sets,
    winnerSide: statusRequiresWinner(value.status) ? value.winnerSide : null,
    courtName: value.courtName.trim() || null,
    scheduledAt: fromDateTimeLocal(value.scheduledAt),
    startedAt: fromDateTimeLocal(value.startedAt),
    finishedAt: fromDateTimeLocal(value.finishedAt)
  };
}

/**
 * First issue of the form: incomplete set rows (one side, an empty row before a filled one, half a tie-break),
 * then the domain rules, then the lock rule (a locked match keeps its outcome).
 */
export function validateMatchResultForm(value: MatchResultFormValue, rules: DrawScoringRules, lock?: MatchResultLock): MatchResultIssue | null {
  if (statusAllowsSets(value.status)) {
    const rows = filledRows(value.sets);
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const halfGames = isBlank(row.home) !== isBlank(row.away) || isRowEmpty(row);
      const halfTiebreak = setShowsTiebreak(row, index, rules) && isBlank(row.tiebreakHome) !== isBlank(row.tiebreakAway);
      if (halfGames || halfTiebreak) {
        return { code: isSuperTiebreakSet(index, rules) ? 'invalid_super_tiebreak' : 'invalid_set', setIndex: index };
      }
    }
  }
  const request = toMatchResultRequest(value, rules);
  const issue = validateMatchResult(request, rules);
  if (issue) return issue;
  if (lock?.locked && lock.current && !hasSameOutcome(lock.current, request)) {
    return { code: 'locked_by_next_match' };
  }
  return null;
}

/** Clearing a result (L10): `scheduled` without sets or winner, keeping the court and the planned time. */
export function clearMatchResultRequest(current: DrawMatchResult | null): TournamentDrawMatchResultRequest {
  return {
    status: 'scheduled',
    sets: [],
    winnerSide: null,
    courtName: current?.courtName ?? null,
    scheduledAt: current?.scheduledAt ?? null,
    startedAt: null,
    finishedAt: null
  };
}
