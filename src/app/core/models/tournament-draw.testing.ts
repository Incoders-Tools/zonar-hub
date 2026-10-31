import {
  DrawGroup,
  DrawMatch,
  DrawMatchResult,
  DrawParticipant,
  DrawPhase,
  DrawRound,
  DrawSetScore,
  DrawSlot,
  DrawStanding,
  TournamentDraw
} from './tournament-draw.model';

/**
 * Test-only builders for the D7 draw contract (imported by specs only). Shapes follow the API draw engine:
 * standard seeding order with byes on the top seeds, bye matches advancing their entrant as a participant slot,
 * the third-place match as the final round's second match and group stages merged into matchdays.
 */

const FIRST_NAMES = ['Martín', 'Lucas', 'Diego', 'Pablo', 'Nicolás', 'Tomás', 'Javier', 'Franco', 'Bruno', 'Gonzalo'];
const SURNAMES = ['Gómez', 'Pérez', 'Fernández', 'Ruiz', 'Sosa', 'Díaz', 'Torres', 'Molina', 'Castro', 'Rojas',
  'Vega', 'Ríos', 'Luna', 'Ortiz', 'Medina', 'Silva', 'Acosta', 'Rey', 'Navarro', 'Cabrera'];

export function buildDrawParticipant(index: number, overrides: Partial<DrawParticipant> = {}): DrawParticipant {
  const first = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${SURNAMES[(2 * index) % SURNAMES.length]}`;
  const second = `${FIRST_NAMES[(index + 3) % FIRST_NAMES.length]} ${SURNAMES[(2 * index + 1) % SURNAMES.length]}`;
  return {
    id: `p${index + 1}`,
    displayName: `${SURNAMES[(2 * index) % SURNAMES.length]} / ${SURNAMES[(2 * index + 1) % SURNAMES.length]}`,
    members: [first, second],
    seedRank: null,
    ...overrides
  };
}

export function buildDrawParticipants(count: number, seeded = 0): DrawParticipant[] {
  return Array.from({ length: count }, (_, index) =>
    buildDrawParticipant(index, { seedRank: index < seeded ? index + 1 : null }));
}

export function participantSlot(participantId: string): DrawSlot {
  return { kind: 'participant', participantId };
}

export const BYE_SLOT: DrawSlot = { kind: 'bye' };

export function buildMatchResult(overrides: Partial<DrawMatchResult> = {}): DrawMatchResult {
  return {
    status: 'scheduled',
    sets: [],
    winnerSide: null,
    courtName: null,
    scheduledAt: null,
    startedAt: null,
    finishedAt: null,
    ...overrides
  };
}

export function sets(...scores: Array<[number, number] | [number, number, number]>): DrawSetScore[] {
  return scores.map(([home, away, tiebreak]) => (tiebreak == null ? { home, away } : { home, away, tiebreak }));
}

function standardOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const doubled = order.length * 2;
    order = order.flatMap(seed => [seed, doubled + 1 - seed]);
  }
  return order;
}

function knockoutRoundName(matchCount: number): string {
  if (matchCount === 1) return 'final';
  if (matchCount === 2) return 'semifinal';
  if (matchCount === 4) return 'quarterfinal';
  return `round_of_${matchCount * 2}`;
}

/** Knockout phase built like the API engine from entrants in seed order. */
export function buildKnockoutPhase(entrantsBySeed: DrawSlot[], thirdPlaceMatch = false, phaseId = 'KO'): DrawPhase {
  let size = 1;
  while (size < entrantsBySeed.length) size *= 2;
  const roundCount = Math.log2(size);
  let slots: DrawSlot[] = standardOrder(size).map(seed => (seed <= entrantsBySeed.length ? entrantsBySeed[seed - 1] : BYE_SLOT));
  const rounds: DrawRound[] = [];
  const matchId = (round: number, number: number) => `${phaseId}-R${round}-M${number}`;

  for (let roundNumber = 1; roundNumber <= roundCount; roundNumber++) {
    const isFinal = roundNumber === roundCount;
    const feedsThirdPlace = thirdPlaceMatch && roundNumber === roundCount - 1;
    const matches: DrawMatch[] = [];
    const nextSlots: DrawSlot[] = [];

    for (let index = 0; index < slots.length / 2; index++) {
      const id = matchId(roundNumber, index + 1);
      const match: DrawMatch = {
        id,
        roundNumber,
        number: index + 1,
        home: slots[2 * index],
        away: slots[2 * index + 1],
        winnerAdvancesTo: isFinal ? null : matchId(roundNumber + 1, Math.floor(index / 2) + 1),
        loserAdvancesTo: feedsThirdPlace ? matchId(roundCount, 2) : null,
        result: null
      };
      matches.push(match);
      nextSlots.push(match.away.kind === 'bye' ? match.home : { kind: 'winnerOf', matchId: id });
    }

    if (isFinal && thirdPlaceMatch) {
      const semifinals = rounds[rounds.length - 1].matches;
      matches.push({
        id: matchId(roundNumber, 2),
        roundNumber,
        number: 2,
        home: { kind: 'loserOf', matchId: semifinals[0].id },
        away: { kind: 'loserOf', matchId: semifinals[1].id },
        winnerAdvancesTo: null,
        loserAdvancesTo: null,
        result: null
      });
    }

    rounds.push({ number: roundNumber, name: knockoutRoundName(nextSlots.length), restingParticipantIds: [], matches });
    slots = nextSlots;
  }

  return { id: phaseId, kind: 'knockout', rounds };
}

/** Circle-method round robin; odd counts rest one participant per round. */
export function buildRoundRobinRounds(participantIds: string[], idPrefix: string): DrawRound[] {
  const circle: Array<string | null> = participantIds.length % 2 === 0 ? [...participantIds] : [...participantIds, null];
  const rounds: DrawRound[] = [];

  for (let roundIndex = 0; roundIndex < circle.length - 1; roundIndex++) {
    const matches: DrawMatch[] = [];
    const resting: string[] = [];
    for (let index = 0; index < circle.length / 2; index++) {
      const home = circle[index];
      const away = circle[circle.length - 1 - index];
      if (home == null || away == null) {
        resting.push((home ?? away) as string);
        continue;
      }
      const number = matches.length + 1;
      matches.push({
        id: `${idPrefix}-R${roundIndex + 1}-M${number}`,
        roundNumber: roundIndex + 1,
        number,
        home: participantSlot(home),
        away: participantSlot(away),
        winnerAdvancesTo: null,
        loserAdvancesTo: null,
        result: null
      });
    }
    rounds.push({ number: roundIndex + 1, name: 'matchday', restingParticipantIds: resting, matches });
    circle.splice(1, 0, circle.pop() as string | null);
  }

  return rounds;
}

function allMatches(draw: TournamentDraw): DrawMatch[] {
  return draw.phases.flatMap(phase => phase.rounds.flatMap(round => round.matches));
}

function participantOf(slot: DrawSlot): string | null {
  return slot.kind === 'participant' ? slot.participantId ?? null : slot.resolvedParticipantId ?? null;
}

/** Applies results by match id and resolves winnerOf / loserOf slots like the API resolver (D4). */
export function withResults(draw: TournamentDraw, results: Record<string, DrawMatchResult>): TournamentDraw {
  const copy: TournamentDraw = structuredClone(draw);
  const matches = allMatches(copy);
  for (const match of matches) {
    if (results[match.id]) {
      match.result = results[match.id];
    }
  }
  for (const match of matches) {
    for (const slot of [match.home, match.away]) {
      if ((slot.kind !== 'winnerOf' && slot.kind !== 'loserOf') || !slot.matchId) continue;
      const source = matches.find(candidate => candidate.id === slot.matchId);
      const winnerSide = source?.result?.winnerSide;
      if (!source || !winnerSide) continue;
      const winnerSlot = winnerSide === 'home' ? source.home : source.away;
      const loserSlot = winnerSide === 'home' ? source.away : source.home;
      slot.resolvedParticipantId = participantOf(slot.kind === 'winnerOf' ? winnerSlot : loserSlot);
    }
  }
  return copy;
}

export function buildDraw(overrides: Partial<TournamentDraw> = {}): TournamentDraw {
  return {
    status: 'published',
    format: 'singleElimination',
    participationFormat: 'pair',
    seed: '20261031',
    publishedAt: '2026-10-30T12:00:00Z',
    options: { thirdSetSuperTiebreak: true },
    participants: [],
    phases: [],
    separationConflicts: [],
    ...overrides
  };
}

export function buildKnockoutDraw(participantCount: number, thirdPlaceMatch = false): TournamentDraw {
  const participants = buildDrawParticipants(participantCount, Math.min(4, participantCount));
  return buildDraw({
    participants,
    phases: [buildKnockoutPhase(participants.map(participant => participantSlot(participant.id)), thirdPlaceMatch)]
  });
}

/**
 * 8 pairs, third-place match. QF1 completed (home, with duration 1 h 25 min), QF2 completed (away, super
 * tie-break), QF3 in progress, QF4 walkover (home); SF1 scheduled on a court; final and third place pending.
 * `p8` has no member data (display name only).
 */
export function buildEightPairKnockoutDraw(): TournamentDraw {
  const draw = buildKnockoutDraw(8, true);
  draw.participants[7] = { ...draw.participants[7], displayName: 'Club Sur', members: [] };
  return withResults(draw, {
    'KO-R1-M1': buildMatchResult({
      status: 'completed', sets: sets([6, 4], [6, 3]), winnerSide: 'home', courtName: 'Cancha 1',
      scheduledAt: '2026-11-20T10:00:00Z', startedAt: '2026-11-20T10:00:00Z', finishedAt: '2026-11-20T11:25:00Z'
    }),
    'KO-R1-M2': buildMatchResult({
      status: 'completed', sets: sets([4, 6], [6, 3], [8, 10]), winnerSide: 'away', courtName: 'Cancha 2',
      startedAt: '2026-11-20T10:00:00Z', finishedAt: '2026-11-20T11:50:00Z'
    }),
    'KO-R1-M3': buildMatchResult({
      status: 'inProgress', sets: sets([6, 2], [3, 1]), courtName: 'Cancha 3', startedAt: '2026-11-20T11:00:00Z'
    }),
    'KO-R1-M4': buildMatchResult({ status: 'walkover', winnerSide: 'home' }),
    'KO-R2-M1': buildMatchResult({ status: 'scheduled', courtName: 'Central', scheduledAt: '2026-11-21T18:30:00Z' })
  });
}

/** 6 pairs in an 8 bracket: seeds 1 and 2 get byes (KO-R1-M1 and KO-R1-M3); no results. */
export function buildSixPairByeKnockoutDraw(): TournamentDraw {
  return buildKnockoutDraw(6);
}

function standing(participantId: string, position: number, values: Partial<DrawStanding> = {}): DrawStanding {
  return {
    participantId, position, played: 0, won: 0, lost: 0, setsFor: 0, setsAgainst: 0, gamesFor: 0, gamesAgainst: 0,
    ...values
  };
}

/**
 * 2 groups of 4 then a 4-pair knockout (A1 v B2, B1 v A2). Group A is complete, so its group-position slots are
 * resolved; group B has pending matches, so `B` slots show placeholders. Standings order is the API order.
 */
export function buildGroupsThenKnockoutDraw(): TournamentDraw {
  const participants = buildDrawParticipants(8, 2);
  const groupMembers: Record<string, string[]> = { A: ['p1', 'p4', 'p5', 'p8'], B: ['p2', 'p3', 'p6', 'p7'] };
  const groupRounds = Object.fromEntries(
    Object.entries(groupMembers).map(([id, members]) => [id, buildRoundRobinRounds(members, `G-${id}`)]));

  const groups: DrawGroup[] = [
    {
      id: 'A',
      participantIds: groupMembers['A'],
      standings: [
        standing('p5', 1, { played: 3, won: 3, setsFor: 6, setsAgainst: 1, gamesFor: 40, gamesAgainst: 22 }),
        standing('p1', 2, { played: 3, won: 2, lost: 1, setsFor: 4, setsAgainst: 2, gamesFor: 33, gamesAgainst: 25 }),
        standing('p8', 3, { played: 3, won: 1, lost: 2, setsFor: 2, setsAgainst: 4, gamesFor: 24, gamesAgainst: 32 }),
        standing('p4', 4, { played: 3, lost: 3, setsFor: 1, setsAgainst: 6, gamesFor: 20, gamesAgainst: 38 })
      ]
    },
    {
      id: 'B',
      participantIds: groupMembers['B'],
      standings: [
        standing('p2', 1, { played: 1, won: 1, setsFor: 2, setsAgainst: 0, gamesFor: 12, gamesAgainst: 5 }),
        standing('p3', 2),
        standing('p6', 3),
        standing('p7', 4, { played: 1, lost: 1, setsFor: 0, setsAgainst: 2, gamesFor: 5, gamesAgainst: 12 })
      ]
    }
  ];

  const matchdays: DrawRound[] = groupRounds['A'].map((round, index) => ({
    number: round.number,
    name: 'matchday',
    restingParticipantIds: [],
    matches: [...round.matches, ...groupRounds['B'][index].matches]
  }));

  const groupStage: DrawPhase = { id: 'G', kind: 'groupStage', groups, rounds: matchdays };
  const knockout = buildKnockoutPhase([
    { kind: 'groupPosition', groupId: 'A', rank: 1, resolvedParticipantId: 'p5' },
    { kind: 'groupPosition', groupId: 'B', rank: 1 },
    { kind: 'groupPosition', groupId: 'A', rank: 2, resolvedParticipantId: 'p1' },
    { kind: 'groupPosition', groupId: 'B', rank: 2 }
  ]);

  const groupAResults: Record<string, DrawMatchResult> = {};
  for (const round of groupRounds['A']) {
    for (const match of round.matches) {
      groupAResults[match.id] = buildMatchResult({ status: 'completed', sets: sets([6, 3], [6, 4]), winnerSide: 'home' });
    }
  }

  return withResults(
    buildDraw({ format: 'groupsThenKnockout', participants, phases: [groupStage, knockout] }),
    { ...groupAResults, 'G-B-R1-M1': buildMatchResult({ status: 'completed', sets: sets([6, 2], [6, 3]), winnerSide: 'home' }) }
  );
}

/**
 * 5 pairs, single round robin: 5 matchdays of 2 matches with one resting pair each; matchday 1 is played (p1 rests).
 * Standings ride on a single `RR` group of the phase (assumed shape until the API exposes round-robin standings).
 */
export function buildFivePairRoundRobinDraw(): TournamentDraw {
  const participants = buildDrawParticipants(5);
  const rounds = buildRoundRobinRounds(participants.map(participant => participant.id), 'RR');
  const phase: DrawPhase = {
    id: 'RR',
    kind: 'roundRobin',
    rounds
  };
  const draw = buildDraw({ format: 'roundRobin', participants, phases: [phase] });
  const standings: DrawStanding[] = [
    standing('p2', 1, { played: 1, won: 1, setsFor: 2, setsAgainst: 0, gamesFor: 12, gamesAgainst: 4 }),
    standing('p3', 2, { played: 1, won: 1, setsFor: 2, setsAgainst: 1, gamesFor: 16, gamesAgainst: 14 }),
    standing('p1', 3),
    standing('p4', 4, { played: 1, lost: 1, setsFor: 1, setsAgainst: 2, gamesFor: 14, gamesAgainst: 16 }),
    standing('p5', 5, { played: 1, lost: 1, setsFor: 0, setsAgainst: 2, gamesFor: 4, gamesAgainst: 12 })
  ];
  phase.groups = [{ id: 'RR', participantIds: participants.map(participant => participant.id), standings }];
  const [first, second] = rounds[0].matches;
  return withResults(draw, {
    [first.id]: buildMatchResult({ status: 'completed', sets: sets([6, 2], [6, 2]), winnerSide: 'home' }),
    [second.id]: buildMatchResult({ status: 'completed', sets: sets([6, 7, 5], [6, 4], [10, 7]), winnerSide: 'home' })
  });
}
