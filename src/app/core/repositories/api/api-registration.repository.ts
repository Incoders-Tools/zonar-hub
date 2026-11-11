import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { DrawParticipant } from '../../models/tournament-draw.model';
import {
  ManualPaymentStatus,
  RegistrationTransition,
  TournamentRegistration,
  TournamentRegistrationCreate,
  TournamentRegistrationList,
  TournamentRegistrationStatus
} from '../../models/tournament-registration.model';
import { RegistrationRepository } from '../registration.repository';
import { extractApiErrorCode } from './api-error.util';

type RegistrationApiDto = TournamentRegistration;

interface RegistrationListApiDto {
  items: RegistrationApiDto[];
  capacity: TournamentRegistrationList['capacity'];
}

interface DrawParticipantApiDto {
  id: string;
  displayName: string;
  members: string[];
  seedRank: number | null;
  separationKey: string | null;
}

/** Problem codes of `docs/api/admin-registrations.md` (Registrations); each has a `registrations.errors.*` translation. */
const REGISTRATION_ERROR_CODES = new Set([
  'registrations.not_found', 'registrations.tournament_not_found', 'registrations.invalid_status',
  'registrations.participants_required', 'registrations.player_required', 'registrations.player_not_found',
  'registrations.duplicate_player', 'registrations.invalid_slot', 'registrations.required_slot_missing',
  'registrations.gender_mismatch', 'registrations.category_out_of_range', 'registrations.age_out_of_range',
  'registrations.player_already_registered', 'registrations.capacity_reached', 'registrations.invalid_transition',
  'registrations.invalid_payment_status', 'registrations.invalid_payment_transition',
  'registrations.concurrent_modification', 'registrations.invalid_contact_email', 'registrations.contact_email_required',
  'registrations.notes_too_long'
]);

/** Tournament route refusals that come before any registration rule. */
const TOURNAMENT_ERROR_KEYS: Record<string, string> = {
  'tournaments.forbidden': 'tournaments.errors.forbidden',
  'tournaments.not_found': 'tournaments.errors.not_found'
};

/**
 * Translation key of a failed registration request: `registrations.<code>` becomes `registrations.errors.<code>`,
 * the tournament refusals become `tournaments.errors.*`, network and status fallbacks stay `common.*`, anything else
 * is the generic error.
 */
export function registrationErrorKey(error: unknown): string {
  const code = extractApiErrorCode(error);
  if (REGISTRATION_ERROR_CODES.has(code)) return code.replace('registrations.', 'registrations.errors.');
  if (TOURNAMENT_ERROR_KEYS[code]) return TOURNAMENT_ERROR_KEYS[code];
  return code.startsWith('common.') ? code : 'common.unexpectedError';
}

/** Admin registrations of a tournament (S4; D2, D5): `/api/admin/tournaments/{tournamentId}/registrations`. */
@Injectable({ providedIn: 'root' })
export class ApiRegistrationRepository implements RegistrationRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private endpoint(tournamentId: string): string {
    return `${this.apiBaseUrl}/admin/tournaments/${encodeURIComponent(tournamentId)}/registrations`;
  }

  async list(tournamentId: string, status?: TournamentRegistrationStatus): Promise<TournamentRegistrationList> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    const dto = await this.request(this.http.get<RegistrationListApiDto>(this.endpoint(tournamentId), { params }));
    return { items: dto.items.map(item => toModel(item)), capacity: { ...dto.capacity } };
  }

  async getById(tournamentId: string, registrationId: string): Promise<TournamentRegistration | undefined> {
    try {
      const dto = await firstValueFrom(
        this.http.get<RegistrationApiDto>(`${this.endpoint(tournamentId)}/${encodeURIComponent(registrationId)}`));
      return toModel(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return undefined;
      throw new Error(registrationErrorKey(error));
    }
  }

  async create(tournamentId: string, registration: TournamentRegistrationCreate): Promise<TournamentRegistration> {
    const body = {
      participants: registration.participants.map(p => ({ slotNumber: p.slotNumber, playerId: p.playerId })),
      status: registration.status,
      contactEmail: blankToNull(registration.contactEmail),
      notes: blankToNull(registration.notes),
      publicNameConsent: registration.publicNameConsent
    };
    return toModel(await this.request(this.http.post<RegistrationApiDto>(this.endpoint(tournamentId), body)));
  }

  async transition(
    tournamentId: string,
    registrationId: string,
    transition: RegistrationTransition,
    revision?: number
  ): Promise<TournamentRegistration> {
    const url = `${this.endpoint(tournamentId)}/${encodeURIComponent(registrationId)}/${transition}`;
    const body = revision == null ? {} : { revision };
    return toModel(await this.request(this.http.post<RegistrationApiDto>(url, body)));
  }

  async setPayment(
    tournamentId: string,
    registrationId: string,
    paymentStatus: ManualPaymentStatus,
    revision?: number
  ): Promise<TournamentRegistration> {
    const url = `${this.endpoint(tournamentId)}/${encodeURIComponent(registrationId)}/payment`;
    const body = revision == null ? { paymentStatus } : { paymentStatus, revision };
    return toModel(await this.request(this.http.put<RegistrationApiDto>(url, body)));
  }

  async getDrawParticipants(tournamentId: string): Promise<DrawParticipant[]> {
    const rows = await this.request(
      this.http.get<DrawParticipantApiDto[] | null>(`${this.endpoint(tournamentId)}/draw-participants`));
    return (rows ?? []).map(row => ({
      id: row.id,
      displayName: row.displayName,
      members: [...(row.members ?? [])],
      seedRank: row.seedRank ?? null,
      separationKey: row.separationKey ?? null
    }));
  }

  private async request<T>(call: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(call);
    } catch (error) {
      throw new Error(registrationErrorKey(error));
    }
  }
}

function toModel(dto: RegistrationApiDto): TournamentRegistration {
  return {
    id: dto.id,
    tournamentId: dto.tournamentId,
    status: dto.status,
    source: dto.source,
    paymentStatus: dto.paymentStatus,
    contactEmail: dto.contactEmail ?? null,
    notes: dto.notes ?? null,
    publicNameConsent: dto.publicNameConsent,
    participants: [...(dto.participants ?? [])]
      .sort((a, b) => a.slotNumber - b.slotNumber)
      .map(p => ({
        slotNumber: p.slotNumber,
        playerId: p.playerId,
        firstName: p.firstName,
        lastName: p.lastName,
        displayName: p.displayName,
        club: p.club ?? null
      })),
    revision: dto.revision,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
