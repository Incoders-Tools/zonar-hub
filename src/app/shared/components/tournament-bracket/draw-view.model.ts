import {
  DrawMatch,
  DrawMatchStatus,
  DrawParticipant,
  DrawPhase,
  DrawRound,
  DrawSide,
  DrawSlot,
  DrawStanding,
  TournamentDraw
} from '../../../core/models/tournament-draw.model';

/**
 * Presentation model of a draw: every label already translated, every slot already resolved to a name or a
 * placeholder. Built by `buildDrawView` (pure); the draw view components only render it.
 */

export type Translate = (key: string) => string;

export interface DrawSetView {
  games: number;
  /** Tie-break points shown next to the games of the side that lost a tie-break set. */
  tiebreak: number | null;
  won: boolean;
}

export interface DrawSideView {
  state: 'participant' | 'bye' | 'pending';
  participantId: string | null;
  /** Accessible / plain-text name: display name, BYE or the translated placeholder. */
  name: string;
  /** Visual lines: member surnames in uppercase, else the display name. Empty for bye and pending sides. */
  lines: string[];
  seedRank: number | null;
  sets: DrawSetView[];
  isWinner: boolean;
  isLoser: boolean;
  isHighlighted: boolean;
}

/** Status badge variants of the shared `app-status-badge`. */
export type DrawStatusBadge = 'upcoming' | 'in-progress' | 'completed' | 'warning';

export interface DrawMatchView {
  id: string;
  number: number;
  roundLabel: string;
  status: DrawMatchStatus;
  statusLabel: string;
  statusBadge: DrawStatusBadge;
  hasResult: boolean;
  home: DrawSideView;
  away: DrawSideView;
  isBye: boolean;
  isThirdPlace: boolean;
  courtName: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  /** `6-4, 7-6(5)`; empty without sets. */
  scoreText: string;
  ariaLabel: string;
  source: DrawMatch;
}

export interface DrawRoundView {
  key: string;
  number: number;
  /** Visible label (`R16`, `Cuartos de final`, `Fecha 2`). */
  label: string;
  /** Spoken label when it differs from the visible one (`Ronda de 16`). */
  spokenLabel: string | null;
  matches: DrawMatchView[];
  restingNames: string[];
}

export interface DrawStandingRowView {
  participantId: string;
  position: number;
  name: string;
  played: number;
  won: number;
  lost: number;
  setsDiff: string;
  gamesDiff: string;
  isHighlighted: boolean;
}

export interface DrawGroupView {
  id: string;
  label: string;
  standings: DrawStandingRowView[];
  matchdays: DrawRoundView[];
}

export interface DrawKnockoutPhaseView {
  kind: 'knockout';
  id: string;
  title: string;
  rounds: DrawRoundView[];
  thirdPlace: DrawMatchView | null;
}

export interface DrawGroupStagePhaseView {
  kind: 'groupStage';
  id: string;
  title: string;
  groups: DrawGroupView[];
}

export interface DrawRoundRobinPhaseView {
  kind: 'roundRobin';
  id: string;
  title: string;
  standings: DrawStandingRowView[];
  matchdays: DrawRoundView[];
}

export type DrawPhaseView = DrawKnockoutPhaseView | DrawGroupStagePhaseView | DrawRoundRobinPhaseView;

export interface DrawView {
  phases: DrawPhaseView[];
  hasKnockout: boolean;
  isEmpty: boolean;
}

const DECIDED_STATUSES: readonly DrawMatchStatus[] = ['completed', 'walkover', 'retired'];

const STATUS_BADGES: Record<DrawMatchStatus, DrawStatusBadge> = {
  scheduled: 'upcoming',
  inProgress: 'in-progress',
  completed: 'completed',
  walkover: 'warning',
  retired: 'warning'
};

function format(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce((text, [key, value]) => text.split(`{${key}}`).join(String(value)), template);
}

/** Last word of a member name, uppercase: "Martín Gómez" → "GÓMEZ". */
function surname(member: string): string {
  const words = member.trim().split(/\s+/);
  return (words[words.length - 1] ?? '').toLocaleUpperCase();
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

class DrawViewBuilder {
  private readonly participants = new Map<string, DrawParticipant>();
  private readonly matches = new Map<string, DrawMatch>();

  constructor(
    private readonly draw: TournamentDraw,
    private readonly t: Translate,
    private readonly highlightId: string | null
  ) {
    for (const participant of draw.participants) {
      this.participants.set(participant.id, participant);
    }
    for (const phase of draw.phases) {
      for (const round of phase.rounds) {
        for (const match of round.matches) {
          this.matches.set(match.id, match);
        }
      }
    }
  }

  build(): DrawView {
    const phases = this.draw.phases.map(phase => this.phase(phase));
    return {
      phases,
      hasKnockout: phases.some(phase => phase.kind === 'knockout'),
      isEmpty: phases.every(phase => this.phaseIsEmpty(phase))
    };
  }

  private phaseIsEmpty(phase: DrawPhaseView): boolean {
    if (phase.kind === 'knockout') return phase.rounds.every(round => round.matches.length === 0) && !phase.thirdPlace;
    if (phase.kind === 'groupStage') return phase.groups.length === 0;
    return phase.matchdays.every(round => round.matches.length === 0) && phase.standings.length === 0;
  }

  private phase(phase: DrawPhase): DrawPhaseView {
    if (phase.kind === 'knockout') {
      return this.knockout(phase);
    }
    if (phase.kind === 'groupStage') {
      return {
        kind: 'groupStage',
        id: phase.id,
        title: this.t('bracket.phase.groupStage'),
        groups: (phase.groups ?? []).map(group => {
          const label = format(this.t('bracket.group.title'), { group: group.id });
          const members = new Set(group.participantIds);
          const inGroup = (match: DrawMatch) =>
            members.has(match.home.participantId ?? '') || members.has(match.away.participantId ?? '');
          return {
            id: group.id,
            label,
            standings: this.standings(group.standings),
            matchdays: phase.rounds
              .map(round => this.round(phase.id, { ...round, matches: round.matches.filter(inGroup) },
                round.restingParticipantIds.filter(id => members.has(id))))
              .filter(round => round.matches.length > 0 || round.restingNames.length > 0)
          };
        })
      };
    }
    return {
      kind: 'roundRobin',
      id: phase.id,
      title: this.t('bracket.phase.roundRobin'),
      standings: this.standings(phase.groups?.[0]?.standings ?? []),
      matchdays: phase.rounds.map(round => this.round(phase.id, round, round.restingParticipantIds))
    };
  }

  private knockout(phase: DrawPhase): DrawKnockoutPhaseView {
    const rounds = [...phase.rounds].sort((a, b) => a.number - b.number);
    const finalRound = rounds[rounds.length - 1];
    const thirdPlaceSource = finalRound?.matches.find(match => match.home.kind === 'loserOf' && match.away.kind === 'loserOf') ?? null;
    const roundViews = rounds.map(round =>
      this.round(phase.id, { ...round, matches: round.matches.filter(match => match !== thirdPlaceSource) }, []));
    return {
      kind: 'knockout',
      id: phase.id,
      title: this.t('bracket.phase.knockout'),
      rounds: roundViews,
      thirdPlace: thirdPlaceSource ? this.match(thirdPlaceSource, this.t('bracket.round.thirdPlace'), true) : null
    };
  }

  private roundLabels(round: DrawRound): { label: string; spokenLabel: string | null } {
    const roundOf = /^round_of_(\d+)$/.exec(round.name);
    if (roundOf) {
      return {
        label: format(this.t('bracket.round.roundOf'), { n: roundOf[1] }),
        spokenLabel: format(this.t('bracket.round.roundOfLong'), { n: roundOf[1] })
      };
    }
    switch (round.name) {
      case 'final': return { label: this.t('bracket.round.final'), spokenLabel: null };
      case 'semifinal': return { label: this.t('bracket.round.semifinals'), spokenLabel: null };
      case 'quarterfinal': return { label: this.t('bracket.round.quarterfinals'), spokenLabel: null };
      case 'matchday': return { label: format(this.t('bracket.round.matchday'), { n: round.number }), spokenLabel: null };
      default: return { label: format(this.t('bracket.round.number'), { n: round.number }), spokenLabel: null };
    }
  }

  private round(phaseId: string, round: DrawRound, restingIds: string[]): DrawRoundView {
    const { label, spokenLabel } = this.roundLabels(round);
    return {
      key: `${phaseId}-R${round.number}`,
      number: round.number,
      label,
      spokenLabel,
      matches: round.matches.map(match => this.match(match, spokenLabel ?? label, false)),
      restingNames: restingIds.map(id => this.participants.get(id)?.displayName ?? this.t('bracket.tbd'))
    };
  }

  private standings(standings: DrawStanding[]): DrawStandingRowView[] {
    return standings.map(standing => ({
      participantId: standing.participantId,
      position: standing.position,
      name: this.participants.get(standing.participantId)?.displayName ?? this.t('bracket.tbd'),
      played: standing.played,
      won: standing.won,
      lost: standing.lost,
      setsDiff: signed(standing.setsFor - standing.setsAgainst),
      gamesDiff: signed(standing.gamesFor - standing.gamesAgainst),
      isHighlighted: standing.participantId === this.highlightId
    }));
  }

  private match(match: DrawMatch, roundLabel: string, isThirdPlace: boolean): DrawMatchView {
    const result = match.result;
    const status: DrawMatchStatus = result?.status ?? 'scheduled';
    const winnerSide: DrawSide | null = result && DECIDED_STATUSES.includes(status) ? result.winnerSide : null;
    const home = this.side(match, 'home', winnerSide);
    const away = this.side(match, 'away', winnerSide);
    const statusLabel = this.t(`bracket.status.${status}`);
    const scoreText = (result?.sets ?? [])
      .map(set => `${set.home}-${set.away}${set.tiebreak != null ? `(${set.tiebreak})` : ''}`)
      .join(', ');
    const isBye = match.home.kind === 'bye' || match.away.kind === 'bye';

    const aria = [format(this.t('bracket.match.ariaLabel'), { round: roundLabel, number: match.number, home: home.name, away: away.name })];
    if (!isBye) {
      aria.push(statusLabel);
    }
    if (scoreText) {
      aria.push(format(this.t('bracket.match.ariaScore'), { score: scoreText }));
    }
    if (winnerSide) {
      aria.push(format(this.t('bracket.match.ariaWinner'), { name: (winnerSide === 'home' ? home : away).name }));
    }

    return {
      id: match.id,
      number: match.number,
      roundLabel,
      status,
      statusLabel,
      statusBadge: STATUS_BADGES[status],
      hasResult: result != null,
      home,
      away,
      isBye,
      isThirdPlace,
      courtName: result?.courtName ?? null,
      scheduledAt: result?.scheduledAt ?? null,
      durationMinutes: this.duration(result?.startedAt ?? null, result?.finishedAt ?? null),
      scoreText,
      ariaLabel: aria.join('. '),
      source: match
    };
  }

  private duration(startedAt: string | null, finishedAt: string | null): number | null {
    if (!startedAt || !finishedAt) return null;
    const minutes = Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 60000);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
  }

  private side(match: DrawMatch, side: DrawSide, winnerSide: DrawSide | null): DrawSideView {
    const slot = side === 'home' ? match.home : match.away;
    const sets: DrawSetView[] = (match.result?.sets ?? []).map(set => {
      const own = side === 'home' ? set.home : set.away;
      const other = side === 'home' ? set.away : set.home;
      return { games: own, tiebreak: set.tiebreak != null && own < other ? set.tiebreak : null, won: own > other };
    });
    const base = {
      sets,
      isWinner: winnerSide === side,
      isLoser: winnerSide != null && winnerSide !== side
    };

    if (slot.kind === 'bye') {
      return { ...base, state: 'bye', participantId: null, name: this.t('bracket.bye'), lines: [], seedRank: null, isHighlighted: false };
    }

    const participantId = slot.kind === 'participant' ? slot.participantId ?? null : slot.resolvedParticipantId ?? null;
    const participant = participantId ? this.participants.get(participantId) : undefined;
    if (participant) {
      return {
        ...base,
        state: 'participant',
        participantId: participant.id,
        name: participant.displayName,
        lines: participant.members.length > 0 ? participant.members.map(surname) : [participant.displayName],
        seedRank: participant.seedRank,
        isHighlighted: participant.id === this.highlightId
      };
    }

    return { ...base, state: 'pending', participantId: null, name: this.placeholder(slot), lines: [], seedRank: null, isHighlighted: false };
  }

  private placeholder(slot: DrawSlot): string {
    if ((slot.kind === 'winnerOf' || slot.kind === 'loserOf') && slot.matchId) {
      const source = this.matches.get(slot.matchId);
      if (source) {
        const key = slot.kind === 'winnerOf' ? 'bracket.placeholder.winnerOf' : 'bracket.placeholder.loserOf';
        return format(this.t(key), { round: source.roundNumber, match: source.number });
      }
    }
    if (slot.kind === 'groupPosition' && slot.groupId && slot.rank) {
      const ordinalKey = `bracket.ordinal.${slot.rank}`;
      const ordinal = this.t(ordinalKey);
      const rank = ordinal === ordinalKey ? format(this.t('bracket.ordinal.other'), { n: slot.rank }) : ordinal;
      return format(this.t('bracket.placeholder.groupPosition'), { rank, group: slot.groupId });
    }
    return this.t('bracket.tbd');
  }
}

export function buildDrawView(draw: TournamentDraw | null, t: Translate, highlightParticipantId: string | null = null): DrawView {
  if (!draw) {
    return { phases: [], hasKnockout: false, isEmpty: true };
  }
  return new DrawViewBuilder(draw, t, highlightParticipantId).build();
}

/** `85` → `1 h 25 min`; `40` → `40 min`. */
export function formatDuration(minutes: number, t: Translate): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0
    ? format(t('bracket.duration.hoursMinutes'), { h: hours, m: rest })
    : format(t('bracket.duration.minutes'), { m: rest });
}
