import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Sport } from '../../models';
import { SportRepository } from '../sport.repository';
import { extractApiErrorCode } from './api-error.util';

interface SportApiDto {
  id: string;
  name: string;
  key: string;
  icon: string;
  iconSource: 'unicode' | 'svg';
  modalityIds: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SportListResponse {
  items: SportApiDto[];
}

interface ScopedSportEntryDto {
  sportId: string;
  name: string;
  key: string;
  icon: string;
  iconSource: 'unicode' | 'svg';
  sortOrder: number;
  isEnabled: boolean;
}

interface ScopedSportsResponse {
  items: ScopedSportEntryDto[];
}

interface CreateSportRequest {
  name: string;
  key: string;
  icon: string;
  iconSource: 'unicode' | 'svg';
  modalityIds: string[];
  sortOrder: number;
}

interface UpdateSportRequest {
  name: string;
  icon: string;
  iconSource: 'unicode' | 'svg';
  modalityIds: string[];
  sortOrder: number;
  isActive: boolean;
}

interface SetScopedSportsRequest {
  enabledSportIds: string[];
}

@Injectable({ providedIn: 'root' })
export class ApiSportRepository implements SportRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/sports`;
  }

  async getAll(): Promise<Sport[]> {
    try {
      const response = await firstValueFrom(this.http.get<SportListResponse>(this.endpoint));
      return response.items.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<Sport | undefined> {
    try {
      const row = await firstValueFrom(this.http.get<SportApiDto>(`${this.endpoint}/${id}`));
      return this.toModel(row);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }

      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(sport: Omit<Sport, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sport> {
    try {
      const request: CreateSportRequest = {
        name: sport.name,
        key: sport.key,
        icon: sport.icon,
        iconSource: sport.iconSource,
        modalityIds: sport.modalityIds,
        sortOrder: sport.sortOrder
      };

      const created = await firstValueFrom(this.http.post<SportApiDto>(this.endpoint, request));
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<Sport>): Promise<Sport> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('common.notFound');
    }

    try {
      const request: UpdateSportRequest = {
        name: changes.name ?? current.name,
        icon: changes.icon ?? current.icon,
        iconSource: changes.iconSource ?? current.iconSource,
        modalityIds: changes.modalityIds ?? current.modalityIds,
        isActive: changes.isActive ?? current.isActive,
        sortOrder: changes.sortOrder ?? current.sortOrder
      };

      const updated = await firstValueFrom(this.http.put<SportApiDto>(`${this.endpoint}/${id}`, request));
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
    const sports = await this.getAll();
    return sports.map(sport => sport.key);
  }

  async getForOrganization(organizationId: string): Promise<Sport[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ScopedSportsResponse>(`${this.apiBaseUrl}/admin/organizations/${organizationId}/sports`)
      );

      return response.items.map(item => this.toScopedModel(item));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async setForOrganization(organizationId: string, enabledSportIds: string[]): Promise<void> {
    try {
      const request: SetScopedSportsRequest = { enabledSportIds };
      await firstValueFrom(
        this.http.put<void>(`${this.apiBaseUrl}/admin/organizations/${organizationId}/sports`, request)
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getForTenant(tenantId: string): Promise<Sport[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ScopedSportsResponse>(`${this.apiBaseUrl}/admin/tenants/${tenantId}/sports`)
      );

      return response.items.map(item => this.toScopedModel(item));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async setForTenant(tenantId: string, enabledSportIds: string[]): Promise<void> {
    try {
      const request: SetScopedSportsRequest = { enabledSportIds };
      await firstValueFrom(
        this.http.put<void>(`${this.apiBaseUrl}/admin/tenants/${tenantId}/sports`, request)
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  private toModel(dto: SportApiDto): Sport {
    return {
      id: dto.id,
      name: dto.name,
      key: dto.key,
      icon: dto.icon,
      iconSource: dto.iconSource,
      modalityIds: dto.modalityIds,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  private toScopedModel(dto: ScopedSportEntryDto): Sport {
    return {
      id: dto.sportId,
      name: dto.name,
      key: dto.key,
      icon: dto.icon,
      iconSource: dto.iconSource,
      modalityIds: [],
      isActive: dto.isEnabled,
      sortOrder: dto.sortOrder,
      createdAt: '',
      updatedAt: ''
    };
  }
}
