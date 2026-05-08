import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Tournament } from '../../models';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { TournamentAdminRepository } from '../tournament-admin.repository';
import { extractApiErrorCode } from './api-error.util';

/**
 * Server contract: /api/admin/tournaments?organizationId=<uuid>
 * The API returns the canonical column shape (UUIDs only — no resolved names).
 * Display names (sport, complex, category, etc.) are derived client-side from
 * the lookups already loaded by the tournaments facade.
 */
interface TournamentApiDto {
  id: string;
  organizationId: string;
  name: string;
  key: string | null;
  complexId: string | null;
  sportId: string;
  categoryId: string | null;
  genderId: string | null;
  modalityId: string | null;
  tournamentTypeId: string | null;
  ruleSetId: string | null;
  status: string | null;
  startDate: string;
  endDate: string;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  maxPairs: number | null;
  description: string | null;
  rules: string | null;
  imageUrl: string | null;
  coverImageUrl: string | null;
  registrationFeePerPair: number | null;
  prizeMoney: number | null;
  pointsToAward: number | null;
  sumValue: number | null;
  observations: string | null;
  isActive: boolean;
  selectedCourtIds: string[];
  createdAtUtc: string;
  updatedAtUtc: string;
}

interface TournamentListResponse {
  items: TournamentApiDto[];
}

interface TournamentWriteRequest {
  organizationId?: string | null;
  name: string;
  key?: string | null;
  complexId?: string | null;
  sportId: string;
  categoryId?: string | null;
  genderId?: string | null;
  modalityId?: string | null;
  tournamentTypeId?: string | null;
  ruleSetId?: string | null;
  status?: string | null;
  startDate: string;
  endDate: string;
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
  maxPairs?: number | null;
  description?: string | null;
  rules?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  registrationFeePerPair?: number | null;
  prizeMoney?: number | null;
  pointsToAward?: number | null;
  sumValue?: number | null;
  observations?: string | null;
  isActive: boolean;
  selectedCourtIds: string[];
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentAdminRepository implements TournamentAdminRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly activeOrg = inject(ActiveOrganizationService);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/tournaments`;
  }

  /** Tournaments are organization-scoped server-side. With no active org we
   *  return an empty list rather than throwing — the FE renders an empty
   *  state and avoids 400 noise on first paint. */
  async getAll(): Promise<Tournament[]> {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) return [];

    try {
      const params = new HttpParams().set('organizationId', organizationId);
      const response = await firstValueFrom(
        this.http.get<TournamentListResponse>(this.endpoint, { params })
      );
      return response.items.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<Tournament | undefined> {
    try {
      const dto = await firstValueFrom(this.http.get<TournamentApiDto>(`${this.endpoint}/${id}`));
      return this.toModel(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }
      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(tournament: Omit<Tournament, 'id' | 'createdAt'>): Promise<Tournament> {
    const organizationId = tournament.organizationId
      ?? this.activeOrg.activeOrganizationId()
      ?? undefined;

    if (!organizationId) {
      throw new Error('tournaments.errors.organization_required');
    }

    try {
      const body = this.toWriteRequest({ ...tournament, organizationId });
      const created = await firstValueFrom(this.http.post<TournamentApiDto>(this.endpoint, body));
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<Tournament>): Promise<Tournament> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('common.notFound');
    }

    try {
      const merged: Partial<Tournament> & { id: string } = { ...current, ...changes, id };
      const body = this.toWriteRequest(merged);
      const updated = await firstValueFrom(this.http.put<TournamentApiDto>(`${this.endpoint}/${id}`, body));
      return this.toModel(updated);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.endpoint}/${id}`));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getExistingKeys(): Promise<string[]> {
    const tournaments = await this.getAll();
    return tournaments
      .map(t => t.key)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);
  }

  private toWriteRequest(tournament: Partial<Tournament>): TournamentWriteRequest {
    return {
      organizationId: tournament.organizationId ?? null,
      name: tournament.name ?? '',
      key: tournament.key ?? null,
      complexId: tournament.complexId || null,
      sportId: tournament.sportId ?? '',
      categoryId: tournament.categoryId || null,
      genderId: tournament.genderId || null,
      modalityId: tournament.modalityId || null,
      tournamentTypeId: tournament.tournamentTypeId || null,
      ruleSetId: tournament.ruleSetId || null,
      status: tournament.statusId || null,
      startDate: tournament.startDate ?? '',
      endDate: tournament.endDate ?? '',
      registrationStartDate: tournament.registrationStartDate || null,
      registrationEndDate: tournament.registrationEndDate || null,
      maxPairs: tournament.maxPairs ?? null,
      description: tournament.description ?? null,
      rules: tournament.rules ?? null,
      imageUrl: tournament.imageUrl ?? null,
      coverImageUrl: tournament.coverImageUrl ?? null,
      registrationFeePerPair: tournament.registrationFeePerPair ?? null,
      prizeMoney: tournament.prizeMoney ?? null,
      pointsToAward: tournament.pointsToAward ?? null,
      sumValue: tournament.sumValue ?? null,
      observations: tournament.observations ?? null,
      isActive: tournament.isActive ?? true,
      selectedCourtIds: tournament.selectedCourtIds ?? []
    };
  }

  private toModel(dto: TournamentApiDto): Tournament {
    return {
      id: dto.id,
      organizationId: dto.organizationId,
      name: dto.name,
      key: dto.key ?? undefined,
      complexId: dto.complexId ?? '',
      complexName: '',
      categoryId: dto.categoryId ?? '',
      categoryName: '',
      genderId: dto.genderId ?? '',
      genderLabel: '',
      tournamentTypeId: dto.tournamentTypeId ?? '',
      tournamentTypeName: '',
      sportId: dto.sportId,
      sportName: '',
      modalityId: dto.modalityId ?? undefined,
      modalityName: undefined,
      ruleSetId: dto.ruleSetId ?? undefined,
      ruleSetDescription: undefined,
      statusId: dto.status ?? '',
      statusLabel: dto.status ?? '',
      startDate: dto.startDate,
      endDate: dto.endDate,
      registrationStartDate: dto.registrationStartDate ?? '',
      registrationEndDate: dto.registrationEndDate ?? '',
      maxPairs: dto.maxPairs,
      description: dto.description ?? '',
      rules: dto.rules ?? '',
      imageUrl: dto.imageUrl ?? undefined,
      coverImageUrl: dto.coverImageUrl ?? undefined,
      registrationFeePerPair: dto.registrationFeePerPair ?? undefined,
      prizeMoney: dto.prizeMoney ?? undefined,
      pointsToAward: dto.pointsToAward ?? undefined,
      sumValue: dto.sumValue ?? undefined,
      observations: dto.observations ?? undefined,
      isActive: dto.isActive,
      selectedCourtIds: dto.selectedCourtIds ?? [],
      createdAt: dto.createdAtUtc,
      updatedAt: dto.updatedAtUtc
    };
  }
}
