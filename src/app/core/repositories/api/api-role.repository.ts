import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Role, RoleCreatePayload, RoleUpdatePayload } from '../../models';
import { RoleRepository } from '../role.repository';
import { extractApiErrorCode } from './api-error.util';

interface RoleApiDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoleListResponse {
  items: RoleApiDto[];
}

interface CreateRoleRequest {
  name: string;
  description: string;
  isActive: boolean;
}

interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiRoleRepository extends RoleRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/roles`;
  }

  async getAll(): Promise<Role[]> {
    try {
      const response = await firstValueFrom(this.http.get<RoleListResponse>(this.endpoint));
      return response.items.map(item => this.toModel(item));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<Role> {
    try {
      const response = await firstValueFrom(this.http.get<RoleApiDto>(`${this.endpoint}/${id}`));
      return this.toModel(response);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        throw new Error('common.notFound');
      }

      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(data: RoleCreatePayload): Promise<Role> {
    try {
      const request: CreateRoleRequest = {
        name: data.name,
        description: data.description,
        isActive: data.isActive
      };

      const created = await firstValueFrom(this.http.post<RoleApiDto>(this.endpoint, request));
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, data: RoleUpdatePayload): Promise<Role> {
    try {
      const request: UpdateRoleRequest = {
        name: data.name,
        description: data.description,
        isActive: data.isActive
      };

      const updated = await firstValueFrom(this.http.put<RoleApiDto>(`${this.endpoint}/${id}`, request));
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

  private toModel(dto: RoleApiDto): Role {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    };
  }
}
