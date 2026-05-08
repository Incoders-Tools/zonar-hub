import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { TournamentRule } from '../../models/tournament-rule.model';
import { TournamentRuleRepository } from '../tournament-rule.repository';
import { extractApiErrorCode } from './api-error.util';

interface TournamentRuleApiDto {
  id: string;
  name: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionPt: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TournamentRuleListResponse {
  items: TournamentRuleApiDto[];
}

interface CreateTournamentRuleRequest {
  name: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionPt: string | null;
  sortOrder: number;
}

interface UpdateTournamentRuleRequest extends CreateTournamentRuleRequest {
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentRuleRepository implements TournamentRuleRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/tournament-rules`;
  }

  async getAll(): Promise<TournamentRule[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<TournamentRuleListResponse>(this.endpoint)
      );
      return response.items.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<TournamentRule | undefined> {
    try {
      const dto = await firstValueFrom(
        this.http.get<TournamentRuleApiDto>(`${this.endpoint}/${id}`)
      );
      return this.toModel(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }
      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(rule: Omit<TournamentRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentRule> {
    try {
      const body: CreateTournamentRuleRequest = {
        name: rule.name,
        descriptionEs: this.normalize(rule.descriptionEs),
        descriptionEn: this.normalize(rule.descriptionEn),
        descriptionPt: this.normalize(rule.descriptionPt),
        sortOrder: rule.sortOrder ?? 0
      };
      const created = await firstValueFrom(
        this.http.post<TournamentRuleApiDto>(this.endpoint, body)
      );
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<TournamentRule>): Promise<TournamentRule> {
    const current = await this.getById(id);
    if (!current) throw new Error('common.notFound');
    try {
      const merged: TournamentRule = { ...current, ...changes, id };
      const body: UpdateTournamentRuleRequest = {
        name: merged.name,
        descriptionEs: this.normalize(merged.descriptionEs),
        descriptionEn: this.normalize(merged.descriptionEn),
        descriptionPt: this.normalize(merged.descriptionPt),
        sortOrder: merged.sortOrder ?? 0,
        isActive: merged.isActive
      };
      const updated = await firstValueFrom(
        this.http.put<TournamentRuleApiDto>(`${this.endpoint}/${id}`, body)
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

  private toModel(dto: TournamentRuleApiDto): TournamentRule {
    return {
      id: dto.id,
      name: dto.name,
      descriptionEs: dto.descriptionEs ?? null,
      descriptionEn: dto.descriptionEn ?? null,
      descriptionPt: dto.descriptionPt ?? null,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  private normalize(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
