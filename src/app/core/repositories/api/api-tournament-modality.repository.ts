import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { TournamentModality } from '../../models';
import { TournamentModalityRepository } from '../tournament-modality.repository';
import { extractApiErrorCode } from './api-error.util';

interface ModalityApiDto {
  id: string;
  nameEs: string;
  nameEn: string;
  namePt: string;
  key: string;
  sortOrder: number;
  isActive: boolean;
}

interface ModalityListResponse {
  items: ModalityApiDto[];
}

interface CreateModalityRequest {
  nameEs: string;
  nameEn: string;
  namePt: string;
  key: string;
  sortOrder: number;
}

interface UpdateModalityRequest {
  nameEs: string;
  nameEn: string;
  namePt: string;
  sortOrder: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentModalityRepository implements TournamentModalityRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/tournament-modalities`;
  }

  async getAll(): Promise<TournamentModality[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ModalityListResponse>(`${this.endpoint}?includeInactive=true`)
      );
      return response.items.map(dto => this.toModel(dto));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<TournamentModality | undefined> {
    try {
      const dto = await firstValueFrom(this.http.get<ModalityApiDto>(`${this.endpoint}/${id}`));
      return this.toModel(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }
      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(modality: Omit<TournamentModality, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentModality> {
    try {
      const body: CreateModalityRequest = {
        nameEs: modality.nameEs,
        nameEn: modality.nameEn,
        namePt: modality.namePt,
        key: modality.key,
        sortOrder: modality.sortOrder ?? 0
      };
      const created = await firstValueFrom(this.http.post<ModalityApiDto>(this.endpoint, body));
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<TournamentModality>): Promise<TournamentModality> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('common.notFound');
    }

    try {
      const body: UpdateModalityRequest = {
        nameEs: changes.nameEs ?? current.nameEs,
        nameEn: changes.nameEn ?? current.nameEn,
        namePt: changes.namePt ?? current.namePt,
        sortOrder: changes.sortOrder ?? current.sortOrder ?? 0,
        isActive: changes.isActive ?? current.isActive
      };
      const updated = await firstValueFrom(this.http.put<ModalityApiDto>(`${this.endpoint}/${id}`, body));
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
    const all = await this.getAll();
    return all.map(m => m.key);
  }

  private toModel(dto: ModalityApiDto): TournamentModality {
    const now = new Date().toISOString();
    return {
      id: dto.id,
      nameEs: dto.nameEs,
      nameEn: dto.nameEn,
      namePt: dto.namePt,
      key: dto.key,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      createdAt: now,
      updatedAt: now
    };
  }
}
