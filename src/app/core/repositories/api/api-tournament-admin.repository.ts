import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Tournament } from '../../models';
import { TournamentAdminRepository } from '../tournament-admin.repository';
import { extractApiErrorCode } from './api-error.util';

interface TournamentApiDto {
  id: string;
  organizationId?: string | null;
  organizationName?: string | null;
  name: string;
  complexId: string;
  complexName: string;
  categoryId: string;
  categoryName: string;
  genderId: string;
  genderLabel: string;
  tournamentTypeId: string;
  tournamentTypeName: string;
  sportId: string;
  sportName: string;
  modalityId?: string | null;
  modalityName?: string | null;
  ruleSetId?: string | null;
  ruleSetDescription?: string | null;
  statusId: string;
  statusLabel: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxPairs?: number | null;
  description: string;
  rules: string;
  imageUrl?: string | null;
  key?: string | null;
  registrationFeePerPair?: number | null;
  prizeMoney?: number | null;
  pointsToAward?: number | null;
  sumValue?: number | null;
  coverImageUrl?: string | null;
  observations?: string | null;
  isActive: boolean;
  selectedCourtIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface TournamentWriteRequest {
  organizationId?: string | null;
  organizationName?: string | null;
  name: string;
  complexId: string;
  complexName: string;
  categoryId: string;
  categoryName: string;
  genderId: string;
  genderLabel: string;
  tournamentTypeId: string;
  tournamentTypeName: string;
  sportId: string;
  sportName: string;
  modalityId?: string | null;
  modalityName?: string | null;
  ruleSetId?: string | null;
  ruleSetDescription?: string | null;
  statusId: string;
  statusLabel: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxPairs?: number | null;
  description: string;
  rules: string;
  imageUrl?: string | null;
  key?: string | null;
  registrationFeePerPair?: number | null;
  prizeMoney?: number | null;
  pointsToAward?: number | null;
  sumValue?: number | null;
  coverImageUrl?: string | null;
  observations?: string | null;
  isActive: boolean;
  selectedCourtIds: string[];
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentAdminRepository implements TournamentAdminRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/tournaments`;
  }

  async getAll(): Promise<Tournament[]> {
    try {
      const rows = await firstValueFrom(this.http.get<TournamentApiDto[]>(this.endpoint));
      return rows.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<Tournament | undefined> {
    try {
      const row = await firstValueFrom(this.http.get<TournamentApiDto>(`${this.endpoint}/${id}`));
      return this.toModel(row);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }

      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(tournament: Omit<Tournament, 'id' | 'createdAt'>): Promise<Tournament> {
    try {
      const request = this.toWriteRequest({
        ...tournament,
        id: '',
        createdAt: '',
        updatedAt: tournament.updatedAt,
        selectedCourtIds: tournament.selectedCourtIds ?? []
      });

      const created = await firstValueFrom(this.http.post<TournamentApiDto>(this.endpoint, request));
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
      const merged: Tournament = {
        ...current,
        ...changes,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: changes.updatedAt ?? current.updatedAt,
        selectedCourtIds: changes.selectedCourtIds ?? current.selectedCourtIds ?? []
      };

      const request = this.toWriteRequest(merged);
      const updated = await firstValueFrom(this.http.put<TournamentApiDto>(`${this.endpoint}/${id}`, request));
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
      .map(tournament => tournament.key)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);
  }

  private toWriteRequest(tournament: Tournament): TournamentWriteRequest {
    return {
      organizationId: tournament.organizationId ?? null,
      organizationName: tournament.organizationName ?? null,
      name: tournament.name,
      complexId: tournament.complexId,
      complexName: tournament.complexName,
      categoryId: tournament.categoryId,
      categoryName: tournament.categoryName,
      genderId: tournament.genderId,
      genderLabel: tournament.genderLabel,
      tournamentTypeId: tournament.tournamentTypeId,
      tournamentTypeName: tournament.tournamentTypeName,
      sportId: tournament.sportId,
      sportName: tournament.sportName,
      modalityId: tournament.modalityId ?? null,
      modalityName: tournament.modalityName ?? null,
      ruleSetId: tournament.ruleSetId ?? null,
      ruleSetDescription: tournament.ruleSetDescription ?? null,
      statusId: tournament.statusId,
      statusLabel: tournament.statusLabel,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationStartDate: tournament.registrationStartDate,
      registrationEndDate: tournament.registrationEndDate,
      maxPairs: tournament.maxPairs ?? null,
      description: tournament.description,
      rules: tournament.rules,
      imageUrl: tournament.imageUrl ?? null,
      key: tournament.key ?? null,
      registrationFeePerPair: tournament.registrationFeePerPair ?? null,
      prizeMoney: tournament.prizeMoney ?? null,
      pointsToAward: tournament.pointsToAward ?? null,
      sumValue: tournament.sumValue ?? null,
      coverImageUrl: tournament.coverImageUrl ?? null,
      observations: tournament.observations ?? null,
      isActive: tournament.isActive ?? true,
      selectedCourtIds: tournament.selectedCourtIds ?? []
    };
  }

  private toModel(dto: TournamentApiDto): Tournament {
    return {
      id: dto.id,
      organizationId: dto.organizationId ?? undefined,
      organizationName: dto.organizationName ?? undefined,
      name: dto.name,
      complexId: dto.complexId,
      complexName: dto.complexName,
      categoryId: dto.categoryId,
      categoryName: dto.categoryName,
      genderId: dto.genderId,
      genderLabel: dto.genderLabel,
      tournamentTypeId: dto.tournamentTypeId,
      tournamentTypeName: dto.tournamentTypeName,
      sportId: dto.sportId,
      sportName: dto.sportName,
      modalityId: dto.modalityId ?? undefined,
      modalityName: dto.modalityName ?? undefined,
      ruleSetId: dto.ruleSetId ?? undefined,
      ruleSetDescription: dto.ruleSetDescription ?? undefined,
      statusId: dto.statusId,
      statusLabel: dto.statusLabel,
      startDate: dto.startDate,
      endDate: dto.endDate,
      registrationStartDate: dto.registrationStartDate,
      registrationEndDate: dto.registrationEndDate,
      maxPairs: dto.maxPairs ?? null,
      description: dto.description,
      rules: dto.rules,
      imageUrl: dto.imageUrl ?? undefined,
      createdAt: dto.createdAt,
      key: dto.key ?? undefined,
      registrationFeePerPair: dto.registrationFeePerPair ?? undefined,
      prizeMoney: dto.prizeMoney ?? undefined,
      pointsToAward: dto.pointsToAward ?? undefined,
      sumValue: dto.sumValue ?? undefined,
      coverImageUrl: dto.coverImageUrl ?? undefined,
      observations: dto.observations ?? undefined,
      updatedAt: dto.updatedAt,
      isActive: dto.isActive,
      selectedCourtIds: dto.selectedCourtIds ?? []
    };
  }
}
