/**
 * Tournament draw contract (D7): the JSON shared by the admin draw endpoints (GET / preview) and the public
 * draw endpoint. Shapes mirror the API camelCase payload.
 *
 * Enum-like values are normalised in ONE place: `normalizeTournamentDraw` and the `toDraw*` helpers below.
 * Services that receive a draw from the API must pass it through `normalizeTournamentDraw` before handing it
 * to the UI; the shared draw view also normalises its input, so the call is idempotent.
 */

export type DrawStatus = 'draft' | 'published';
export type DrawFormat = 'singleElimination' | 'roundRobin' | 'groupsThenKnockout';
export type DrawParticipationFormat = 'individual' | 'pair' | 'team';
export type DrawPhaseKind = 'groupStage' | 'knockout' | 'roundRobin';
export type DrawSlotKind = 'participant' | 'bye' | 'winnerOf' | 'loserOf' | 'groupPosition';
export type DrawMatchStatus = 'scheduled' | 'inProgress' | 'completed' | 'walkover' | 'retired';
export type DrawSide = 'home' | 'away';
export type DrawRandomizationMode = 'random' | 'seeded';
export type DrawSeparationConflictKind = 'firstRoundMatch' | 'sameGroup';

export interface DrawParticipant {
  /** Draw-local participant id. */
  id: string;
  displayName: string;
  /** Member display names ("First Last"); empty when the participant has no member data. */
  members: string[];
  seedRank: number | null;
  /** Admin payload only. */
  separationKey?: string | null;
}

export interface DrawStanding {
  participantId: string;
  played: number;
  won: number;
  lost: number;
  setsFor: number;
  setsAgainst: number;
  gamesFor: number;
  gamesAgainst: number;
  /** 1-based final position computed by the API resolver (D4). */
  position: number;
}

export interface DrawGroup {
  /** Letter id: A, B, ... (API engine `Group.Id`). */
  id: string;
  participantIds: string[];
  /** Standings in the order given by the API. */
  standings: DrawStanding[];
}

export interface DrawSlot {
  kind: DrawSlotKind;
  participantId?: string | null;
  matchId?: string | null;
  groupId?: string | null;
  rank?: number | null;
  /** Set by the API resolver when a winnerOf / loserOf / groupPosition slot is decided. */
  resolvedParticipantId?: string | null;
}

/** Tie-break points of a 7-6 set (domain shape `TiebreakScore(Home, Away)`). */
export interface DrawTiebreakScore {
  home: number;
  away: number;
}

export interface DrawSetScore {
  home: number;
  away: number;
  /** Tie-break points of a 7-6 set, when recorded. A super tie-break is stored as the set's games instead. */
  tiebreak?: DrawTiebreakScore | null;
}

export interface DrawMatchResult {
  status: DrawMatchStatus;
  sets: DrawSetScore[];
  winnerSide: DrawSide | null;
  courtName: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface DrawMatch {
  /** Stable id: `KO-R{round}-M{n}`, `RR-R{round}-M{n}` or `G-{group}-R{round}-M{n}`. */
  id: string;
  roundNumber: number;
  number: number;
  home: DrawSlot;
  away: DrawSlot;
  winnerAdvancesTo: string | null;
  loserAdvancesTo: string | null;
  result: DrawMatchResult | null;
}

export interface DrawRound {
  number: number;
  /** Localisation-ready key: `final`, `semifinal`, `quarterfinal`, `round_of_N`, `matchday`. */
  name: string;
  restingParticipantIds: string[];
  matches: DrawMatch[];
}

export interface DrawPhase {
  /** `G` (group stage), `KO` (knockout) or `RR` (round robin). */
  id: string;
  kind: DrawPhaseKind;
  groups?: DrawGroup[];
  rounds: DrawRound[];
}

/** Participants sharing a separation key (club) that the engine could not keep apart (API `SeparationConflict`). */
export interface DrawSeparationConflict {
  key: string;
  participantIds: string[];
  kind: DrawSeparationConflictKind;
  /** Match id (`firstRoundMatch`) or group id (`sameGroup`). */
  locationId: string;
}

export interface TournamentDraw {
  status: DrawStatus;
  format: DrawFormat;
  participationFormat: DrawParticipationFormat;
  seed: string | null;
  /** Set when the payload carries it (`randomizationMode` or `randomization.mode`); D7 does not require it. */
  randomizationMode?: DrawRandomizationMode | null;
  publishedAt: string | null;
  options: Record<string, unknown> | null;
  participants: DrawParticipant[];
  phases: DrawPhase[];
  separationConflicts: DrawSeparationConflict[];
}

// ---------------------------------------------------------------------------
// Admin write contract (D5). The repository serialises these shapes as the request body.
// ---------------------------------------------------------------------------

export interface TournamentDrawRequestParticipant {
  /** Draw-local id, unique within the request. */
  id: string;
  displayName: string;
  members: string[];
  seedRank?: number | null;
  /** Club or organisation the engine keeps apart in the first round and in groups. */
  separationKey?: string | null;
}

export interface TournamentDrawRequestOptions {
  knockout?: { thirdPlaceMatch: boolean };
  roundRobin?: { legs: number };
  /** Exactly one of `groupCount` / `groupSize`. */
  groups?: { groupCount?: number; groupSize?: number; qualifiersPerGroup: number };
  scoring?: { thirdSetSuperTiebreak: boolean };
}

export interface TournamentDrawRequest {
  format: DrawFormat;
  participationFormat: DrawParticipationFormat;
  /** `seed` is an unsigned 64-bit decimal string; without it the API generates one and returns it. */
  randomization: { mode: DrawRandomizationMode; seed?: string | null };
  options: TournamentDrawRequestOptions;
  participants: TournamentDrawRequestParticipant[];
}

/** Body of `PUT matches/{matchId}/result` (D5); validated by the API (D3/D4). Used by result entry (F3). */
export interface TournamentDrawMatchResultRequest {
  status: DrawMatchStatus;
  sets: DrawSetScore[];
  winnerSide: DrawSide | null;
  courtId?: string | null;
  courtName?: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

// ---------------------------------------------------------------------------
// Enum normalisation (single place). The contract is camelCase strings; the helpers also accept PascalCase,
// snake_case and the numeric values of the API domain enums (System.Text.Json default) so a serialiser change on
// the API side does not break the UI.
// ---------------------------------------------------------------------------

const PHASE_KINDS: readonly DrawPhaseKind[] = ['groupStage', 'knockout', 'roundRobin'];
/** API `PhaseKind` numeric values: GroupStage = 1, Knockout = 2, RoundRobin = 3. */
const PHASE_KIND_BY_NUMBER: Record<number, DrawPhaseKind> = { 1: 'groupStage', 2: 'knockout', 3: 'roundRobin' };

const MATCH_STATUSES: readonly DrawMatchStatus[] = ['scheduled', 'inProgress', 'completed', 'walkover', 'retired'];

const FORMATS: readonly DrawFormat[] = ['singleElimination', 'roundRobin', 'groupsThenKnockout'];
/** API `DrawFormat` numeric values: SingleElimination = 1, RoundRobin = 2, GroupsThenKnockout = 3. */
const FORMAT_BY_NUMBER: Record<number, DrawFormat> = { 1: 'singleElimination', 2: 'roundRobin', 3: 'groupsThenKnockout' };

const PARTICIPATION_FORMATS: readonly DrawParticipationFormat[] = ['individual', 'pair', 'team'];
/** API `ParticipationFormat` numeric values: Individual = 1, Pair = 2, Team = 3. */
const PARTICIPATION_FORMAT_BY_NUMBER: Record<number, DrawParticipationFormat> = { 1: 'individual', 2: 'pair', 3: 'team' };

const SLOT_KINDS: readonly DrawSlotKind[] = ['participant', 'bye', 'winnerOf', 'loserOf', 'groupPosition'];
const SIDES: readonly DrawSide[] = ['home', 'away'];
const STATUSES: readonly DrawStatus[] = ['draft', 'published'];
const RANDOMIZATION_MODES: readonly DrawRandomizationMode[] = ['random', 'seeded'];
const CONFLICT_KINDS: readonly DrawSeparationConflictKind[] = ['firstRoundMatch', 'sameGroup'];

/** `InProgress`, `in_progress`, `in-progress` and `inProgress` all become `inProgress`. */
function toCamelCase(value: string): string {
  const parts = value.trim().split(/[_\-\s]+/).filter(Boolean);
  return parts
    .map((part, index) =>
      index === 0 ? part.charAt(0).toLowerCase() + part.slice(1) : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function toMember<T extends string>(value: unknown, allowed: readonly T[], byNumber: Record<number, T> = {}): T | null {
  if (typeof value === 'number') {
    return byNumber[value] ?? null;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  const camel = toCamelCase(value);
  return allowed.find(item => item.toLowerCase() === camel.toLowerCase()) ?? null;
}

export function toDrawPhaseKind(value: unknown): DrawPhaseKind | null {
  return toMember(value, PHASE_KINDS, PHASE_KIND_BY_NUMBER);
}

export function toDrawMatchStatus(value: unknown): DrawMatchStatus | null {
  return toMember(value, MATCH_STATUSES);
}

export function toDrawSlotKind(value: unknown): DrawSlotKind | null {
  return toMember(value, SLOT_KINDS);
}

export function toDrawSide(value: unknown): DrawSide | null {
  return toMember(value, SIDES);
}

export function toDrawFormat(value: unknown): DrawFormat | null {
  return toMember(value, FORMATS, FORMAT_BY_NUMBER);
}

export function toDrawParticipationFormat(value: unknown): DrawParticipationFormat | null {
  return toMember(value, PARTICIPATION_FORMATS, PARTICIPATION_FORMAT_BY_NUMBER);
}

function normalizeSlot(slot: DrawSlot | null | undefined): DrawSlot {
  return { ...(slot ?? {}), kind: toDrawSlotKind(slot?.kind) ?? 'bye' } as DrawSlot;
}

/**
 * Tie-breaks are `{ home, away }` (L7). A legacy number is the loser's points: the winner then has
 * `max(7, points + 2)`.
 */
function normalizeTiebreak(set: DrawSetScore): DrawTiebreakScore | null {
  const tiebreak = set.tiebreak as DrawTiebreakScore | number | null | undefined;
  if (tiebreak == null) {
    return null;
  }
  if (typeof tiebreak === 'number') {
    const winner = Math.max(7, tiebreak + 2);
    return set.home > set.away ? { home: winner, away: tiebreak } : { home: tiebreak, away: winner };
  }
  return { home: tiebreak.home, away: tiebreak.away };
}

function normalizeSet(set: DrawSetScore): DrawSetScore {
  return { home: set.home, away: set.away, tiebreak: normalizeTiebreak(set) };
}

function normalizeResult(result: DrawMatchResult | null | undefined): DrawMatchResult | null {
  if (!result) {
    return null;
  }
  return {
    status: toDrawMatchStatus(result.status) ?? 'scheduled',
    sets: (result.sets ?? []).map(normalizeSet),
    winnerSide: toDrawSide(result.winnerSide),
    courtName: result.courtName ?? null,
    scheduledAt: result.scheduledAt ?? null,
    startedAt: result.startedAt ?? null,
    finishedAt: result.finishedAt ?? null
  };
}

function normalizeMatch(match: DrawMatch): DrawMatch {
  return {
    ...match,
    home: normalizeSlot(match.home),
    away: normalizeSlot(match.away),
    winnerAdvancesTo: match.winnerAdvancesTo ?? null,
    loserAdvancesTo: match.loserAdvancesTo ?? null,
    result: normalizeResult(match.result)
  };
}

/**
 * Maps every enum-like value of a draw payload to the camelCase contract and fills optional collections.
 * Unknown phase kinds are dropped (the view cannot render them); unknown match statuses fall back to `scheduled`.
 */
export function normalizeTournamentDraw(draw: TournamentDraw): TournamentDraw {
  const phases: DrawPhase[] = [];
  for (const phase of draw.phases ?? []) {
    const kind = toDrawPhaseKind(phase.kind);
    if (!kind) {
      continue;
    }
    phases.push({
      ...phase,
      kind,
      groups: (phase.groups ?? []).map(group => ({
        ...group,
        participantIds: group.participantIds ?? [],
        standings: group.standings ?? []
      })),
      rounds: (phase.rounds ?? []).map(round => ({
        ...round,
        restingParticipantIds: round.restingParticipantIds ?? [],
        matches: (round.matches ?? []).map(normalizeMatch)
      }))
    });
  }

  const raw = draw as TournamentDraw & { randomization?: { mode?: unknown } | null };
  return {
    ...draw,
    status: toMember(draw.status, STATUSES) ?? 'draft',
    randomizationMode: toMember(raw.randomizationMode ?? raw.randomization?.mode, RANDOMIZATION_MODES),
    format: toDrawFormat(draw.format) ?? 'singleElimination',
    participationFormat: toDrawParticipationFormat(draw.participationFormat) ?? 'pair',
    seed: draw.seed == null ? null : String(draw.seed),
    publishedAt: draw.publishedAt ?? null,
    options: draw.options ?? null,
    participants: (draw.participants ?? []).map(participant => ({
      ...participant,
      members: participant.members ?? [],
      seedRank: participant.seedRank ?? null
    })),
    phases,
    separationConflicts: (draw.separationConflicts ?? []).map(conflict => ({
      ...conflict,
      participantIds: conflict.participantIds ?? [],
      kind: toMember(conflict.kind, CONFLICT_KINDS) ?? 'firstRoundMatch'
    }))
  };
}

/**
 * True when any match carries a stored result (D1): the draw can then no longer be regenerated, replaced or
 * deleted. A result row in `scheduled` status (court or time only) counts too, matching the API check.
 */
export function tournamentDrawHasResults(draw: TournamentDraw | null | undefined): boolean {
  return (draw?.phases ?? []).some(phase =>
    phase.rounds.some(round => round.matches.some(match => match.result != null)));
}
