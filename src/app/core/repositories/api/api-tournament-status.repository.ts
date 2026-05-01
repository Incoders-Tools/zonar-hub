import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { TournamentStatus } from '../../models';
import { TournamentStatusRepository } from '../tournament-status.repository';
import { extractApiErrorCode } from './api-error.util';

interface TournamentStatusApiDto {
  id: string;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TournamentStatusWriteRequest {
  name: string;
  key: string;
  description?: string | null;
  sortOrder: number;
}

interface TournamentStatusUpdateRequest {
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentStatusRepository implements TournamentStatusRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/tournament-statuses`;
  }

  async getAll(): Promise<TournamentStatus[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ items: TournamentStatusApiDto[] }>(this.endpoint)
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
      const request: TournamentStatusWriteRequest = {
        name: status.name,
        key: status.key,
        description: status.description,
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
      const request: TournamentStatusUpdateRequest = {
        name: changes.name ?? current.name,
        description: changes.description ?? current.description,
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
    return {
      id: dto.id,
      name: dto.name,
      key: dto.key,
      description: dto.description,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }
}
