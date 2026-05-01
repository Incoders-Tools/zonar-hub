import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { extractApiErrorCode } from './api-error.util';

interface SystemSettingDto {
  id: string;
  key: string;
  value: string;
  scope: number | string;
  tenantId?: string | null;
  userId?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

interface SystemSettingListResponse {
  items: SystemSettingDto[];
}

interface CreateSystemSettingRequest {
  key: string;
  value: string;
  scope: number;
  tenantId?: string | null;
  userId?: string | null;
}

interface UpdateSystemSettingRequest {
  value: string;
  scope: number;
  tenantId?: string | null;
  userId?: string | null;
}

const USER_SCOPE = 2;

@Injectable({ providedIn: 'root' })
export class ApiSystemSettingRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/system-settings`;
  }

  async getUserSetting(
    key: string,
    userId: string,
    tenantId?: string
  ): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        scope: String(USER_SCOPE),
        userId,
        key,
        page: '1',
        pageSize: '1'
      });

      if (tenantId) {
        params.set('tenantId', tenantId);
      }

      const response = await firstValueFrom(
        this.http.get<SystemSettingListResponse>(`${this.endpoint}?${params.toString()}`)
      );

      const item = response.items?.[0];
      return item?.value ?? null;
    } catch {
      return null;
    }
  }

  async upsertUserSetting(
    key: string,
    value: string,
    userId: string,
    tenantId?: string
  ): Promise<void> {
    const existing = await this.findUserSetting(key, userId, tenantId);

    if (!existing) {
      const request: CreateSystemSettingRequest = {
        key,
        value,
        scope: USER_SCOPE,
        userId,
        tenantId: tenantId ?? null
      };

      try {
        await firstValueFrom(this.http.post<SystemSettingDto>(this.endpoint, request));
      } catch (error) {
        throw new Error(extractApiErrorCode(error));
      }

      return;
    }

    const request: UpdateSystemSettingRequest = {
      value,
      scope: USER_SCOPE,
      userId,
      tenantId: tenantId ?? null
    };

    try {
      await firstValueFrom(this.http.put<SystemSettingDto>(`${this.endpoint}/${existing.id}`, request));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  private async findUserSetting(
    key: string,
    userId: string,
    tenantId?: string
  ): Promise<SystemSettingDto | null> {
    try {
      const params = new URLSearchParams({
        scope: String(USER_SCOPE),
        userId,
        key,
        page: '1',
        pageSize: '1'
      });

      if (tenantId) {
        params.set('tenantId', tenantId);
      }

      const response = await firstValueFrom(
        this.http.get<SystemSettingListResponse>(`${this.endpoint}?${params.toString()}`)
      );

      return response.items?.[0] ?? null;
    } catch {
      return null;
    }
  }
}
