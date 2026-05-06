import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '../../models/admin-user.model';
import { AdminUserRepository } from '../admin-user.repository';
import { extractApiErrorCode } from './api-error.util';

interface AdminUserApiDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role?: string;
  roleId?: string;
  roleName?: string;
  organizationId?: string | null;
  organizationName?: string | null;
  tenantIds?: string[];
  tenantNames?: string[];
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

interface AdminUsersPageDto {
  items: AdminUserApiDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

interface CreateAdminUserRequest {
  email: string;
  fullName: string;
  phone?: string;
  roleId: string;
  organizationId?: string;
  tenantIds?: string[];
  permissionsByOrganization?: { organizationId: string; toolKeys: string[] }[];
  password?: string;
}

interface UpdateAdminUserRequest {
  fullName?: string;
  phone?: string;
  roleId?: string;
  organizationId?: string;
  tenantIds?: string[];
  permissionsByOrganization?: { organizationId: string; toolKeys: string[] }[];
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiAdminUserRepository implements AdminUserRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/users`;
  }

  async getAll(): Promise<AdminUser[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<AdminUsersPageDto>(`${this.endpoint}?page=1&pageSize=200`)
      );

      return (response.items ?? []).map(item => this.toModel(item));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<AdminUser | undefined> {
    const allUsers = await this.getAll();
    return allUsers.find(user => user.id === id);
  }

  async create(data: AdminUserCreatePayload): Promise<AdminUser> {
    try {
      const request: CreateAdminUserRequest = {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        roleId: data.roleId,
        organizationId: data.organizationId,
        tenantIds: data.tenantIds,
        permissionsByOrganization: data.permissionsByOrganization,
        password: data.password
      };

      const created = await firstValueFrom(this.http.post<AdminUserApiDto>(this.endpoint, request));
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, data: AdminUserUpdatePayload): Promise<AdminUser> {
    try {
      const request: UpdateAdminUserRequest = {
        fullName: data.fullName,
        phone: data.phone,
        roleId: data.roleId,
        organizationId: data.organizationId,
        tenantIds: data.tenantIds,
        permissionsByOrganization: data.permissionsByOrganization,
        isActive: data.isActive
      };

      const updated = await firstValueFrom(this.http.put<AdminUserApiDto>(`${this.endpoint}/${id}`, request));
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

  async deleteMany(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id)));
  }

  private toModel(dto: AdminUserApiDto): AdminUser {
    const role = dto.roleName ?? dto.role;

    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone ?? undefined,
      role,
      roleId: dto.roleId,
      roleName: dto.roleName,
      organizationId: dto.organizationId ?? undefined,
      organizationName: dto.organizationName ?? undefined,
      tenantIds: dto.tenantIds ?? [],
      tenantNames: dto.tenantNames ?? [],
      isActive: dto.isActive,
      createdAt: dto.createdAtUtc,
      updatedAt: dto.updatedAtUtc
    };
  }
}
