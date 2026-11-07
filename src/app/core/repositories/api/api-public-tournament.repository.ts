import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { publicRequestContext } from '../../http/public-request.context';
import { PublicOrganization, PublicTournament, PublicTournamentSport } from '../../models';
import { TournamentDraw, normalizeTournamentDraw } from '../../models/tournament-draw.model';
import { extractApiErrorCode } from './api-error.util';

/**
 * Server contract: anonymous, read-only showcase (see API `docs/api/public-tournaments.md`).
 * - GET /api/public/tournaments?limit=N → { items: PublicTournament[] }
 * - GET /api/public/tournaments/{slug}  → PublicTournament, or 404 `public_tournaments.not_found`
 * - GET /api/public/tournaments/{slug}/draw → published draw (D7 public shape), or 404
 *   `public_tournaments.not_found` / `public_draws.not_found`
 * Unlike the admin repository it needs no active organization and sends no organization filter;
 * requests carry `PUBLIC_REQUEST`, so no credentials or tenant/organization headers are attached.
 */
type PublicSportDto = Omit<PublicTournamentSport, 'iconSource'> & { iconSource: string | null };
type PublicOrganizationDto = Omit<PublicOrganization, 'links'> & { links?: PublicOrganization['links'] | null };
type PublicTournamentDto = Omit<PublicTournament, 'sport' | 'organization'> & {
  sport: PublicSportDto | null;
  organization: PublicOrganizationDto | null;
};

interface PublicTournamentListResponse {
  items: PublicTournamentDto[];
}

@Injectable({ providedIn: 'root' })
export class ApiPublicTournamentRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/public/tournaments`;
  }

  async getAll(limit?: number): Promise<PublicTournament[]> {
    try {
      const params = limit === undefined ? undefined : new HttpParams().set('limit', limit);
      const response = await firstValueFrom(
        this.http.get<PublicTournamentListResponse>(this.endpoint, { params, context: publicRequestContext() })
      );
      return response.items.map(dto => this.toModel(dto));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  /** Resolves to `undefined` when the slug is unknown or no longer public (API 404). */
  async getBySlug(slug: string): Promise<PublicTournament | undefined> {
    try {
      const dto = await firstValueFrom(
        this.http.get<PublicTournamentDto>(`${this.endpoint}/${encodeURIComponent(slug)}`, {
          context: publicRequestContext()
        })
      );
      return this.toModel(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }
      throw new Error(extractApiErrorCode(error));
    }
  }

  /**
   * Published draw of a public tournament, resolved with its results. Resolves to `null` when the API answers 404:
   * the tournament is not public (`public_tournaments.not_found`) or has no published draw (`public_draws.not_found`).
   */
  async getDraw(slug: string): Promise<TournamentDraw | null> {
    try {
      const dto = await firstValueFrom(
        this.http.get<TournamentDraw>(`${this.endpoint}/${encodeURIComponent(slug)}/draw`, {
          context: publicRequestContext()
        })
      );
      return normalizeTournamentDraw(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      throw new Error(extractApiErrorCode(error));
    }
  }

  private toModel(dto: PublicTournamentDto): PublicTournament {
    return {
      ...dto,
      sport: dto.sport
        ? { ...dto.sport, iconSource: dto.sport.iconSource === 'svg' ? 'svg' : 'unicode' }
        : null,
      organization: dto.organization
        ? { ...dto.organization, links: dto.organization.links ?? {} }
        : null
    };
  }
}
