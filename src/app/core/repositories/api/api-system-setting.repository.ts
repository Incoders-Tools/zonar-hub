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

const GLOBAL_SCOPE = 0;
const TENANT_SCOPE = 1;
const USER_SCOPE = 2;

@Injectable({ providedIn: 'root' })
export class ApiSystemSettingRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/system-settings`;
  }

  async getTenantSetting(key: string, tenantId: string): Promise<string | null> {
    return this.getScopedSettingValue(key, TENANT_SCOPE, tenantId, undefined);
  }

  async getUserSetting(
    key: string,
    userId: string,
    tenantId?: string
  ): Promise<string | null> {
    return this.getScopedSettingValue(key, USER_SCOPE, tenantId, userId);
  }

  async upsertTenantSetting(key: string, value: string, tenantId: string): Promise<void> {
    await this.upsertScopedSetting(key, value, TENANT_SCOPE, tenantId, undefined);
  }

  async upsertUserSetting(
    key: string,
    value: string,
    userId: string,
    tenantId?: string
  ): Promise<void> {
    await this.upsertScopedSetting(key, value, USER_SCOPE, tenantId, userId);
  }

  async deleteTenantSetting(key: string, tenantId: string): Promise<void> {
    await this.deleteScopedSetting(key, TENANT_SCOPE, tenantId, undefined);
  }

  async deleteUserSetting(key: string, userId: string, tenantId?: string): Promise<void> {
    await this.deleteScopedSetting(key, USER_SCOPE, tenantId, userId);
  }

  private async getScopedSettingValue(
    key: string,
    scope: number,
    tenantId?: string,
    userId?: string
  ): Promise<string | null> {
    const existing = await this.findScopedSetting(key, scope, tenantId, userId);
    return existing?.value ?? null;
  }

  private async upsertScopedSetting(
    key: string,
    value: string,
    scope: number,
    tenantId?: string,
    userId?: string
  ): Promise<void> {
    const existing = await this.findScopedSetting(key, scope, tenantId, userId);

    if (!existing) {
      const request: CreateSystemSettingRequest = {
        key,
        value,
        scope,
        tenantId: tenantId ?? null
      };

      if (scope === USER_SCOPE) {
        request.userId = userId ?? null;
      }

      if (scope === GLOBAL_SCOPE) {
        request.tenantId = null;
      }

      try {
        await firstValueFrom(this.http.post<SystemSettingDto>(this.endpoint, request));
      } catch (error) {
        throw new Error(extractApiErrorCode(error));
      }

      return;
    }

    const request: UpdateSystemSettingRequest = {
      value,
      scope,
      tenantId: tenantId ?? null
    };

    if (scope === USER_SCOPE) {
      request.userId = userId ?? null;
    }

    if (scope === GLOBAL_SCOPE) {
      request.tenantId = null;
    }

    try {
      await firstValueFrom(this.http.put<SystemSettingDto>(`${this.endpoint}/${existing.id}`, request));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  private async deleteScopedSetting(
    key: string,
    scope: number,
    tenantId?: string,
    userId?: string
  ): Promise<void> {
    const existing = await this.findScopedSetting(key, scope, tenantId, userId);
    if (!existing) {
      return;
    }

    try {
      await firstValueFrom(this.http.delete<void>(`${this.endpoint}/${existing.id}`));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  private async findScopedSetting(
    key: string,
    scope: number,
    tenantId?: string,
    userId?: string
  ): Promise<SystemSettingDto | null> {
    try {
      const params = this.buildScopedQueryParams(key, scope, tenantId, userId);

      const response = await firstValueFrom(
        this.http.get<SystemSettingListResponse>(`${this.endpoint}?${params.toString()}`)
      );

      return response.items?.[0] ?? null;
    } catch {
      return null;
    }
  }

  private buildScopedQueryParams(
    key: string,
    scope: number,
    tenantId?: string,
    userId?: string
  ): URLSearchParams {
    const params = new URLSearchParams({
      scope: String(scope),
      key,
      page: '1',
      pageSize: '1'
    });

    if (tenantId) {
      params.set('tenantId', tenantId);
    }

    if (scope === USER_SCOPE && userId) {
      params.set('userId', userId);
    }

    return params;
  }
}
