import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { publicRequestContext } from '../../http/public-request.context';
import {
  PublicConfirmedPair,
  PublicRegistrationCodeSent,
  PublicRegistrationInfo,
  PublicRegistrationResult,
  PublicRegistrationSubmission
} from '../../models/public-registration.model';
import { PublicRegistrationRepository } from '../public-registration.repository';
import { extractApiErrorCode } from './api-error.util';

/** Translation keys of the public registration refusals that the wizard handles on their own. */
export const PUBLIC_REGISTRATION_ERRORS = {
  closed: 'public_registrations.errors.closed',
  invalidCode: 'public_registrations.errors.invalid_code',
  codeCooldown: 'public_registrations.errors.code_cooldown',
  /** 429 of the `public-registration-code` rate limit policy, which carries no body. */
  tooManyRequests: 'public_registrations.errors.too_many_requests',
  participantUnavailable: 'public_registrations.errors.participant_unavailable',
  /** `public_tournaments.not_found`: unknown, non-public, inactive or cancelled slug. */
  notFound: 'public_registrations.errors.not_found'
} as const;

/**
 * Problem codes of `docs/api/public-registrations.md`; each `<area>.<code>` has a `<area>.errors.<code>` translation.
 * An undocumented code becomes the generic error instead of an unresolved key.
 */
const DOCUMENTED_CODES = new Set([
  'public_registrations.closed', 'public_registrations.invalid_code', 'public_registrations.code_cooldown',
  'public_registrations.participant_unavailable', 'eligibility_profiles.not_found',
  'players.first_name_required', 'players.last_name_required', 'players.name_too_long', 'players.invalid_email',
  'players.field_too_long', 'players.birth_date_in_future', 'players.unknown_gender', 'players.unknown_category',
  'registrations.contact_email_required', 'registrations.invalid_contact_email', 'registrations.participants_required',
  'registrations.duplicate_player', 'registrations.invalid_slot', 'registrations.required_slot_missing',
  'registrations.gender_mismatch', 'registrations.category_out_of_range', 'registrations.age_out_of_range'
]);

/** Translation key of a failed public registration request; network and status fallbacks stay `common.*`. */
export function publicRegistrationErrorKey(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 429 && !hasProblemCode(error)) {
    return PUBLIC_REGISTRATION_ERRORS.tooManyRequests;
  }
  const code = extractApiErrorCode(error);
  if (code === 'public_tournaments.not_found') return PUBLIC_REGISTRATION_ERRORS.notFound;
  if (DOCUMENTED_CODES.has(code)) return code.replace('.', '.errors.');
  return code.startsWith('common.') ? code : 'common.unexpectedError';
}

interface ConfirmedPairsResponse {
  items: PublicConfirmedPair[];
}

/**
 * Anonymous public registration (S2, D4): every request carries `PUBLIC_REQUEST`, so no credentials or
 * tenant/organization headers are attached, even for a logged-in visitor.
 */
@Injectable({ providedIn: 'root' })
export class ApiPublicRegistrationRepository implements PublicRegistrationRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private tournamentUrl(slug: string): string {
    return `${this.apiBaseUrl}/public/tournaments/${encodeURIComponent(slug)}`;
  }

  async getInfo(slug: string): Promise<PublicRegistrationInfo | null> {
    try {
      return await firstValueFrom(this.http.get<PublicRegistrationInfo>(
        `${this.tournamentUrl(slug)}/registration`, { context: publicRequestContext() }));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404 && hasCode(error, 'public_tournaments.not_found')) {
        return null;
      }
      throw new Error(publicRegistrationErrorKey(error));
    }
  }

  async requestCode(slug: string, contactEmail: string): Promise<PublicRegistrationCodeSent> {
    try {
      return await firstValueFrom(this.http.post<PublicRegistrationCodeSent>(
        `${this.tournamentUrl(slug)}/registration/code`, { contactEmail }, { context: publicRequestContext() }));
    } catch (error) {
      throw new Error(publicRegistrationErrorKey(error));
    }
  }

  async submit(slug: string, submission: PublicRegistrationSubmission): Promise<PublicRegistrationResult> {
    try {
      return await firstValueFrom(this.http.post<PublicRegistrationResult>(
        `${this.tournamentUrl(slug)}/registration`, submission, { context: publicRequestContext() }));
    } catch (error) {
      throw new Error(publicRegistrationErrorKey(error));
    }
  }

  async getConfirmedPairs(slug: string): Promise<PublicConfirmedPair[] | null> {
    try {
      const response = await firstValueFrom(this.http.get<ConfirmedPairsResponse>(
        `${this.tournamentUrl(slug)}/confirmed-pairs`, { context: publicRequestContext() }));
      return response.items;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      throw new Error(publicRegistrationErrorKey(error));
    }
  }
}

function hasProblemCode(error: HttpErrorResponse): boolean {
  const payload = error.error as { code?: unknown } | null;
  return !!payload && typeof payload.code === 'string' && payload.code.length > 0;
}

function hasCode(error: HttpErrorResponse, code: string): boolean {
  return (error.error as { code?: unknown } | null)?.code === code;
}
