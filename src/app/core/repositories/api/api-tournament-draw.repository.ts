import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import {
  DrawCourt,
  TournamentDraw,
  TournamentDrawMatchResultRequest,
  TournamentDrawRequest,
  normalizeTournamentDraw
} from '../../models/tournament-draw.model';
import { extractApiErrorCode } from './api-error.util';

/**
 * Admin draw endpoints (D5) under `/api/admin/tournaments/{tournamentId}/draw`: preview, save draft, read,
 * publish, unpublish, delete, match results and the courts eligible for results (D13). Every draw response goes through `normalizeTournamentDraw`.
 * Failures reject with an `Error` whose message is a translation key (`drawErrorKey`).
 */

/**
 * Codes the API returns in the problem `code`: draw engine (`DrawErrors`), use cases (`TournamentDrawErrors`) and
 * results (`MatchResultErrors`).
 */
const KNOWN_DRAW_CODES = new Set([
  'draws.participants_min',
  'draws.participants_max',
  'draws.participant_required',
  'draws.participant_id_required',
  'draws.participant_name_required',
  'draws.duplicate_participant',
  'draws.invalid_seed_rank',
  'draws.duplicate_seed_rank',
  'draws.invalid_participation_format',
  'draws.invalid_randomization_mode',
  'draws.seed_required',
  'draws.format_not_supported',
  'draws.third_place_min_participants',
  'draws.invalid_round_robin_legs',
  'draws.group_options_conflict',
  'draws.invalid_group_count',
  'draws.group_too_small',
  'draws.invalid_group_size',
  'draws.invalid_qualifiers',
  'draws.knockout_min_qualifiers',
  'draws.results_exist',
  'draws.not_found',
  'draws.not_draft',
  'draws.invalid_seed',
  'draws.concurrent_modification',
  'draws.results.invalid_set',
  'draws.results.invalid_super_tiebreak',
  'draws.results.incomplete_score',
  'draws.results.too_many_sets',
  'draws.results.score_decided',
  'draws.results.winner_required',
  'draws.results.winner_mismatch',
  'draws.results.winner_not_allowed',
  'draws.results.invalid_winner_side',
  'draws.results.invalid_status',
  'draws.results.invalid_times',
  'draws.results.sets_not_allowed_for_walkover',
  'draws.results.sets_not_allowed_for_scheduled',
  'draws.results.unknown_match',
  'draws.results.duplicate_result',
  'draws.results.bye_match',
  'draws.results.participants_pending',
  'draws.results.locked_by_next_match',
  'draws.results.invalid_court'
]);

const DRAW_CODE_PREFIX = 'draws.';
const DRAW_ERROR_PREFIX = 'draws.errors.';
const RESULTS_EXIST_KEY = 'draws.errors.results_exist';
const UNEXPECTED_DRAW_KEY = 'draws.errors.unexpected';
const TOURNAMENT_FORBIDDEN_CODE = 'tournaments.forbidden';
const TOURNAMENT_FORBIDDEN_KEY = 'tournaments.errors.forbidden';

/**
 * Translation key of a draw API failure:
 * - `draws.<code>` / `draws.errors.<code>` → `draws.errors.<code>` (unknown draw codes → `draws.errors.unexpected`),
 *   including the D12 revision conflict `draws.errors.concurrent_modification` (409);
 * - the tenant refusal → `tournaments.errors.forbidden`;
 * - a 409 without a known draw code → `draws.errors.results_exist` (D1: the draw already has results);
 * - otherwise the shared `extractApiErrorCode` key (`common.*`).
 */
export function drawErrorKey(error: unknown): string {
  const code = extractApiErrorCode(error);
  if (code === TOURNAMENT_FORBIDDEN_CODE || code === TOURNAMENT_FORBIDDEN_KEY) {
    return TOURNAMENT_FORBIDDEN_KEY;
  }

  const drawCode = code.startsWith(DRAW_ERROR_PREFIX)
    ? DRAW_CODE_PREFIX + code.slice(DRAW_ERROR_PREFIX.length)
    : code.startsWith(DRAW_CODE_PREFIX) ? code : null;
  if (drawCode && KNOWN_DRAW_CODES.has(drawCode)) {
    return DRAW_ERROR_PREFIX + drawCode.slice(DRAW_CODE_PREFIX.length);
  }

  if (error instanceof HttpErrorResponse && error.status === 409) {
    return RESULTS_EXIST_KEY;
  }
  return drawCode ? UNEXPECTED_DRAW_KEY : code;
}

/** D5 request body: blank seeds are omitted (the API generates one) and empty optional participant fields too. */
function toRequestBody(request: TournamentDrawRequest): Record<string, unknown> {
  const seed = request.randomization.seed?.trim();
  return {
    format: request.format,
    participationFormat: request.participationFormat,
    randomization: seed ? { mode: request.randomization.mode, seed } : { mode: request.randomization.mode },
    options: request.options,
    participants: request.participants.map(participant => {
      const body: Record<string, unknown> = {
        id: participant.id,
        displayName: participant.displayName,
        members: participant.members
      };
      if (participant.seedRank != null) body['seedRank'] = participant.seedRank;
      const separationKey = participant.separationKey?.trim();
      if (separationKey) body['separationKey'] = separationKey;
      return body;
    })
  };
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentDrawRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private endpoint(tournamentId: string): string {
    return `${this.apiBaseUrl}/admin/tournaments/${encodeURIComponent(tournamentId)}/draw`;
  }

  /** Generates a draw without saving it. */
  preview(tournamentId: string, request: TournamentDrawRequest): Promise<TournamentDraw> {
    return this.write(tournamentId, this.http.post<TournamentDraw | null>(`${this.endpoint(tournamentId)}/preview`, toRequestBody(request)));
  }

  /** Saves (or replaces) the tournament draw as a draft; the API answers 409 when matches have results. */
  saveDraft(tournamentId: string, request: TournamentDrawRequest): Promise<TournamentDraw> {
    return this.write(tournamentId, this.http.put<TournamentDraw | null>(this.endpoint(tournamentId), toRequestBody(request)));
  }

  /** The stored draw with results and resolution, or null when the tournament has no draw (404). */
  async get(tournamentId: string): Promise<TournamentDraw | null> {
    try {
      const draw = await firstValueFrom(this.http.get<TournamentDraw | null>(this.endpoint(tournamentId)));
      return draw ? normalizeTournamentDraw(draw) : null;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      throw new Error(drawErrorKey(error));
    }
  }

  publish(tournamentId: string): Promise<TournamentDraw> {
    return this.write(tournamentId, this.http.post<TournamentDraw | null>(`${this.endpoint(tournamentId)}/publish`, {}));
  }

  unpublish(tournamentId: string): Promise<TournamentDraw> {
    return this.write(tournamentId, this.http.post<TournamentDraw | null>(`${this.endpoint(tournamentId)}/unpublish`, {}));
  }

  /** Deletes a draft without results. */
  async delete(tournamentId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(this.endpoint(tournamentId)));
    } catch (error) {
      throw new Error(drawErrorKey(error));
    }
  }

  /** Records or replaces one match result (F3); validated by the API with the D3/D4 rules. */
  saveMatchResult(tournamentId: string, matchId: string, result: TournamentDrawMatchResultRequest): Promise<TournamentDraw> {
    const url = `${this.endpoint(tournamentId)}/matches/${encodeURIComponent(matchId)}/result`;
    return this.write(tournamentId, this.http.put<TournamentDraw | null>(url, result));
  }

  /** Courts a result can be recorded on (D13), ordered by name by the API; empty when the tournament has none. */
  async getCourts(tournamentId: string): Promise<DrawCourt[]> {
    try {
      const courts = await firstValueFrom(this.http.get<DrawCourt[] | null>(`${this.endpoint(tournamentId)}/courts`));
      return (courts ?? []).map(court => ({ id: court.id, name: court.name }));
    } catch (error) {
      throw new Error(drawErrorKey(error));
    }
  }

  /** Normalises the returned draw; a write answered without a body reads the draw back. */
  private async write(tournamentId: string, call: Observable<TournamentDraw | null>): Promise<TournamentDraw> {
    let draw: TournamentDraw | null;
    try {
      draw = await firstValueFrom(call);
    } catch (error) {
      throw new Error(drawErrorKey(error));
    }
    if (draw) {
      return normalizeTournamentDraw(draw);
    }
    const stored = await this.get(tournamentId);
    if (!stored) {
      throw new Error('draws.errors.not_found');
    }
    return stored;
  }
}
