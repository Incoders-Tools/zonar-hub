import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { PublicOrganization, PublicTournament, PublicTournamentSport } from '../../models';
import { extractApiErrorCode } from './api-error.util';

/**
 * Server contract: anonymous, read-only showcase (see API `docs/api/public-tournaments.md`).
 * - GET /api/public/tournaments?limit=N → { items: PublicTournament[] }
 * - GET /api/public/tournaments/{slug}  → PublicTournament, or 404 `public_tournaments.not_found`
 * Unlike the admin repository it needs no active organization and sends no organization filter.
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
        this.http.get<PublicTournamentListResponse>(this.endpoint, { params })
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
        this.http.get<PublicTournamentDto>(`${this.endpoint}/${encodeURIComponent(slug)}`)
      );
      return this.toModel(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
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
