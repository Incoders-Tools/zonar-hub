import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { I18nService } from '../../i18n/i18n.service';
import { TournamentStatus } from '../../models';
import { TournamentStatusRepository } from '../tournament-status.repository';
import { extractApiErrorCode } from './api-error.util';

interface TournamentStatusApiDto {
  id: string;
  key: string;
  nameEs: string;
  nameEn: string;
  namePt: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionPt: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TournamentStatusListResponse {
  items: TournamentStatusApiDto[];
}

interface CreateTournamentStatusRequest {
  key: string;
  nameEs: string;
  nameEn: string;
  namePt: string;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  sortOrder: number;
}

interface UpdateTournamentStatusRequest {
  nameEs: string;
  nameEn: string;
  namePt: string;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  sortOrder: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentStatusRepository implements TournamentStatusRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly i18n = inject(I18nService);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/tournament-statuses`;
  }

  async getAll(): Promise<TournamentStatus[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<TournamentStatusListResponse>(this.endpoint)
      );
      return response.items.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<TournamentStatus | undefined> {
    try {
      const row = await firstValueFrom(
        this.http.get<TournamentStatusApiDto>(`${this.endpoint}/${id}`)
      );
      return this.toModel(row);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }
      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(
    status: Omit<TournamentStatus, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TournamentStatus> {
    try {
      const request: CreateTournamentStatusRequest = {
        key: status.key,
        nameEs: status.nameEs,
        nameEn: status.nameEn,
        namePt: status.namePt,
        descriptionEs: status.descriptionEs,
        descriptionEn: status.descriptionEn,
        descriptionPt: status.descriptionPt,
        sortOrder: status.sortOrder ?? 0
      };

      const created = await firstValueFrom(
        this.http.post<TournamentStatusApiDto>(this.endpoint, request)
      );
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<TournamentStatus>): Promise<TournamentStatus> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('common.notFound');
    }

    try {
      const request: UpdateTournamentStatusRequest = {
        nameEs: changes.nameEs ?? current.nameEs,
        nameEn: changes.nameEn ?? current.nameEn,
        namePt: changes.namePt ?? current.namePt,
        descriptionEs: 'descriptionEs' in changes ? changes.descriptionEs : current.descriptionEs,
        descriptionEn: 'descriptionEn' in changes ? changes.descriptionEn : current.descriptionEn,
        descriptionPt: 'descriptionPt' in changes ? changes.descriptionPt : current.descriptionPt,
        sortOrder: changes.sortOrder ?? current.sortOrder ?? 0,
        isActive: changes.isActive ?? current.isActive
      };

      const updated = await firstValueFrom(
        this.http.put<TournamentStatusApiDto>(`${this.endpoint}/${id}`, request)
      );
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
    const statuses = await this.getAll();
    return statuses.map(s => s.key);
  }

  private toModel(dto: TournamentStatusApiDto): TournamentStatus {
    const locale = this.i18n.locale();
    const localizedName =
      locale === 'en' ? dto.nameEn :
      locale === 'pt' ? dto.namePt :
      dto.nameEs;
    const localizedDescription =
      locale === 'en' ? dto.descriptionEn :
      locale === 'pt' ? dto.descriptionPt :
      dto.descriptionEs;

    return {
      id: dto.id,
      key: dto.key,
      name: localizedName ?? dto.nameEs,
      description: localizedDescription ?? dto.descriptionEs ?? null,
      nameEs: dto.nameEs,
      nameEn: dto.nameEn,
      namePt: dto.namePt,
      descriptionEs: dto.descriptionEs,
      descriptionEn: dto.descriptionEn,
      descriptionPt: dto.descriptionPt,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }
}
