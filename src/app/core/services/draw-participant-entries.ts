import {
  DrawFormat,
  DrawParticipationFormat,
  TournamentDrawRequestOptions,
  TournamentDrawRequestParticipant
} from '../models/tournament-draw.model';

/**
 * Pure helpers of the admin draw page (D9): participant entries typed or pasted by the organizer, their
 * validation (same rules as the API `DrawRequestValidator`, so errors show before the request) and the mapping
 * to the D5 request. No Angular dependencies.
 */

export const DRAW_MIN_PARTICIPANTS = 2;
export const DRAW_MAX_PARTICIPANTS = 256;
const MAX_UNSIGNED_64 = 18446744073709551615n;

export interface DrawParticipantEntry {
  /** Draw-local id kept from a loaded draw; null for new entries (assigned by `toDrawRequestParticipants`). */
  id: string | null;
  displayName: string;
  members: string[];
  seedRank: number | null;
  /** Club or organisation; null when empty. */
  separationKey: string | null;
}

export type DrawParticipantIssueKey =
  | 'minParticipants'
  | 'maxParticipants'
  | 'memberRequired'
  | 'memberCount'
  | 'teamNameRequired'
  | 'invalidSeed'
  | 'duplicateName'
  | 'duplicateSeed';

export interface DrawParticipantIssue {
  /** 1-based row (form) or line (paste) number; null for list-level issues. */
  position: number | null;
  key: DrawParticipantIssueKey;
}

export interface DrawParticipantPasteResult {
  entries: DrawParticipantEntry[];
  issues: DrawParticipantIssue[];
}

/** Format options edited by the page; `drawOptionsForRequest` keeps only those of the selected format. */
export interface DrawFormatSettings {
  thirdPlaceMatch: boolean;
  legs: number;
  groupSizing: 'count' | 'size';
  groupCount: number;
  groupSize: number;
  qualifiersPerGroup: number;
  thirdSetSuperTiebreak: boolean;
}

/** First issue of one entry, independent of the other entries. */
function entryIssue(entry: DrawParticipantEntry, format: DrawParticipationFormat): DrawParticipantIssueKey | null {
  if (format === 'team' && !entry.displayName.trim()) {
    return 'teamNameRequired';
  }
  if (format === 'pair' && entry.members.length !== 2) {
    return 'memberCount';
  }
  if (format === 'individual' && entry.members.length !== 1) {
    return 'memberCount';
  }
  if (entry.members.length === 0 || entry.members.some(member => !member.trim())) {
    return 'memberRequired';
  }
  if (entry.seedRank != null && (!Number.isInteger(entry.seedRank) || entry.seedRank < 1)) {
    return 'invalidSeed';
  }
  return null;
}

/**
 * One issue per entry at most: its own issue first, then a duplicate name (case-insensitive) or seed rank
 * against an earlier entry. `positions` maps entry indexes to the reported row/line numbers.
 */
function entryIssues(
  entries: DrawParticipantEntry[],
  format: DrawParticipationFormat,
  positions: number[],
  preset: Array<DrawParticipantIssueKey | null> = []
): DrawParticipantIssue[] {
  const names = new Set<string>();
  const seeds = new Set<number>();
  const issues: DrawParticipantIssue[] = [];

  entries.forEach((entry, index) => {
    const name = entry.displayName.trim().toLocaleLowerCase();
    let key = preset[index] ?? entryIssue(entry, format);
    if (!key && name && names.has(name)) {
      key = 'duplicateName';
    }
    if (!key && entry.seedRank != null && seeds.has(entry.seedRank)) {
      key = 'duplicateSeed';
    }
    if (name) names.add(name);
    if (entry.seedRank != null) seeds.add(entry.seedRank);
    if (key) issues.push({ position: positions[index], key });
  });

  return issues;
}

/** Validates the whole participant list: count limits first, then one issue per invalid row (1-based). */
export function validateDrawParticipantEntries(
  entries: DrawParticipantEntry[],
  format: DrawParticipationFormat
): DrawParticipantIssue[] {
  const listIssues: DrawParticipantIssue[] = [];
  if (entries.length < DRAW_MIN_PARTICIPANTS) {
    listIssues.push({ position: null, key: 'minParticipants' });
  } else if (entries.length > DRAW_MAX_PARTICIPANTS) {
    listIssues.push({ position: null, key: 'maxParticipants' });
  }
  return [...listIssues, ...entryIssues(entries, format, entries.map((_, index) => index + 1))];
}

const SEED_MARKER = /\[([^\]]*)\]/g;

function splitNames(value: string): string[] {
  return value.split('/').map(name => name.trim());
}

/**
 * Parses one participant per line (empty lines are skipped):
 * - pair: `Name A / Name B`; individual: `Name`; team: `Team name: Member / Member / ...`
 * - optional seed rank marker `[n]` (positive integer, at most one) anywhere in the line
 * - optional club after `#` up to the end of the line (`#Club Norte`); the seed marker may come before or after it.
 * Every non-empty line yields an entry; issues carry the 1-based line number and block the import.
 */
export function parseDrawParticipantPaste(text: string, format: DrawParticipationFormat): DrawParticipantPasteResult {
  const entries: DrawParticipantEntry[] = [];
  const positions: number[] = [];
  const preset: Array<DrawParticipantIssueKey | null> = [];

  text.split(/\r?\n/).forEach((rawLine, index) => {
    if (!rawLine.trim()) {
      return;
    }

    const markers = Array.from(rawLine.matchAll(SEED_MARKER)).map(match => match[1].trim());
    const line = rawLine.replace(SEED_MARKER, ' ');
    let seedRank: number | null = null;
    let seedIssue = false;
    if (markers.length === 1 && /^\d+$/.test(markers[0]) && Number(markers[0]) >= 1) {
      seedRank = Number(markers[0]);
    } else if (markers.length > 0) {
      seedIssue = true;
    }

    const clubIndex = line.indexOf('#');
    const names = clubIndex >= 0 ? line.slice(0, clubIndex) : line;
    const club = clubIndex >= 0 ? line.slice(clubIndex + 1).trim() : '';

    let displayName: string;
    let members: string[];
    if (format === 'team') {
      const colon = names.indexOf(':');
      displayName = colon >= 0 ? names.slice(0, colon).trim() : '';
      members = colon >= 0 ? splitNames(names.slice(colon + 1)).filter(Boolean) : splitNames(names);
    } else {
      members = splitNames(names);
      displayName = members.join(' / ');
    }

    entries.push({ id: null, displayName, members, seedRank, separationKey: club || null });
    positions.push(index + 1);
    preset.push(seedIssue && !entryIssue({ id: null, displayName, members, seedRank, separationKey: null }, format)
      ? 'invalidSeed'
      : null);
  });

  return { entries, issues: entryIssues(entries, format, positions, preset) };
}

/** Request participants: kept ids stay, new entries get the lowest free `p{n}` id. */
export function toDrawRequestParticipants(entries: DrawParticipantEntry[]): TournamentDrawRequestParticipant[] {
  const used = new Set(entries.map(entry => entry.id).filter((id): id is string => !!id));
  let next = 1;
  return entries.map(entry => {
    let id = entry.id;
    if (!id) {
      while (used.has(`p${next}`)) next++;
      id = `p${next}`;
      used.add(id);
    }
    return {
      id,
      displayName: entry.displayName.trim(),
      members: entry.members.map(member => member.trim()),
      seedRank: entry.seedRank,
      separationKey: entry.separationKey?.trim() || null
    };
  });
}

/** Options of the selected format only (D5); group stages also use the round robin legs inside each group. */
export function drawOptionsForRequest(format: DrawFormat, settings: DrawFormatSettings): TournamentDrawRequestOptions {
  const scoring = { thirdSetSuperTiebreak: settings.thirdSetSuperTiebreak };
  if (format === 'roundRobin') {
    return { roundRobin: { legs: settings.legs }, scoring };
  }
  if (format === 'groupsThenKnockout') {
    const sizing = settings.groupSizing === 'count' ? { groupCount: settings.groupCount } : { groupSize: settings.groupSize };
    return {
      groups: { ...sizing, qualifiersPerGroup: settings.qualifiersPerGroup },
      roundRobin: { legs: settings.legs },
      knockout: { thirdPlaceMatch: settings.thirdPlaceMatch },
      scoring
    };
  }
  return { knockout: { thirdPlaceMatch: settings.thirdPlaceMatch }, scoring };
}

/** Reads stored draw options back into the page settings, falling back to `defaults` per field. */
export function drawFormatSettingsFromOptions(
  options: Record<string, unknown> | null | undefined,
  defaults: DrawFormatSettings
): DrawFormatSettings {
  const value = (options ?? {}) as {
    knockout?: { thirdPlaceMatch?: boolean };
    roundRobin?: { legs?: number };
    groups?: { groupCount?: number | null; groupSize?: number | null; qualifiersPerGroup?: number };
    scoring?: { thirdSetSuperTiebreak?: boolean };
    thirdSetSuperTiebreak?: boolean;
  };
  const groupCount = value.groups?.groupCount ?? null;
  return {
    thirdPlaceMatch: value.knockout?.thirdPlaceMatch ?? defaults.thirdPlaceMatch,
    legs: value.roundRobin?.legs ?? defaults.legs,
    groupSizing: groupCount != null ? 'count' : value.groups?.groupSize != null ? 'size' : defaults.groupSizing,
    groupCount: groupCount ?? defaults.groupCount,
    groupSize: value.groups?.groupSize ?? defaults.groupSize,
    qualifiersPerGroup: value.groups?.qualifiersPerGroup ?? defaults.qualifiersPerGroup,
    thirdSetSuperTiebreak: value.scoring?.thirdSetSuperTiebreak ?? value.thirdSetSuperTiebreak ?? defaults.thirdSetSuperTiebreak
  };
}

/** Empty, or an unsigned 64-bit integer in decimal (the API `ulong` seed). */
export function isValidDrawSeed(value: string | null | undefined): boolean {
  const seed = (value ?? '').trim();
  if (!seed) {
    return true;
  }
  return /^\d{1,20}$/.test(seed) && BigInt(seed) <= MAX_UNSIGNED_64;
}
