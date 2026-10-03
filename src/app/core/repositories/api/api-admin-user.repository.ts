import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '../../models/admin-user.model';
import {
  AdminUserPage,
  AdminUserPageQuery,
  AdminUserRepository,
  PermissionSourcePage,
  PermissionSourceSearchQuery,
  PermissionSourceUser
} from '../admin-user.repository';
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

const INVALID_REQUEST_CODE = 'common.validationFailed';

/** Mirrors the API permission-source limits so invalid searches never reach the network. */
const PERMISSION_SOURCE_MIN_SEARCH_LENGTH = 2;
const PERMISSION_SOURCE_MAX_PAGE_SIZE = 20;
const PERMISSION_SOURCE_REMOVED_CHARACTERS = /[*%,()"\\]/g;

interface PermissionSourceUserDto {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  isActive: boolean;
}

interface PermissionSourcesPageDto {
  items: PermissionSourceUserDto[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
}

interface AdminUsersPageDto {
  items: AdminUserApiDto[] | null;
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

  async getPage(query: AdminUserPageQuery): Promise<AdminUserPage> {
    const url = `${this.endpoint}?${this.buildPageQueryString(query)}`;

    try {
      const response = await firstValueFrom(this.http.get<AdminUsersPageDto>(url));

      return {
        items: (response.items ?? []).map(item => this.toModel(item)),
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount
      };
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  /** Dedicated bounded search; never widens into the Users list or its `all` scope. */
  async searchPermissionSources(query: PermissionSourceSearchQuery): Promise<PermissionSourcePage> {
    const url = `${this.endpoint}/permission-sources?${this.buildPermissionSourceQueryString(query)}`;

    try {
      const response = await firstValueFrom(this.http.get<PermissionSourcesPageDto>(url));

      return {
        items: (response.items ?? []).map(item => this.toPermissionSource(item)),
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount
      };
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  /** Legacy unscoped first-200 read kept until the users facade migrates to `getPage`. */
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

  /** Validates the query before any request so an invalid scope can never widen into a global read. */
  private buildPageQueryString(query: AdminUserPageQuery): string {
    const scope = query?.scope;
    const params: [string, string][] = [];

    if (scope?.kind === 'organization') {
      const organizationId = typeof scope.organizationId === 'string' ? scope.organizationId.trim() : '';
      if (!organizationId) {
        throw new Error(INVALID_REQUEST_CODE);
      }
      params.push(['scope', 'organization'], ['organizationId', organizationId]);
    } else if (scope?.kind === 'all') {
      params.push(['scope', 'all']);
    } else {
      throw new Error(INVALID_REQUEST_CODE);
    }

    if (!this.isPositiveInteger(query.page) || !this.isPositiveInteger(query.pageSize)) {
      throw new Error(INVALID_REQUEST_CODE);
    }
    params.push(['page', String(query.page)], ['pageSize', String(query.pageSize)]);

    const search = query.search?.trim();
    if (search) {
      params.push(['search', search]);
    }
    if (query.roleId) {
      params.push(['roleId', query.roleId]);
    }
    if (query.isActive !== undefined) {
      params.push(['isActive', String(query.isActive)]);
    }

    return params
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Applies the API search normalization (removed wildcard/delimiter characters, trim) and requires two
   * characters other than `_` and whitespace. Page below 1 is normalized to 1 like the API; page size must be 1..20.
   */
  private buildPermissionSourceQueryString(query: PermissionSourceSearchQuery): string {
    const rawSearch = query?.search;
    if (typeof rawSearch !== 'string') {
      throw new Error(INVALID_REQUEST_CODE);
    }

    const search = rawSearch.replace(PERMISSION_SOURCE_REMOVED_CHARACTERS, '').trim();
    const meaningfulCount = [...search].filter(character => character !== '_' && !/\s/.test(character)).length;
    if (meaningfulCount < PERMISSION_SOURCE_MIN_SEARCH_LENGTH) {
      throw new Error(INVALID_REQUEST_CODE);
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? PERMISSION_SOURCE_MAX_PAGE_SIZE;
    if (!Number.isInteger(page) || !this.isPositiveInteger(pageSize) || pageSize > PERMISSION_SOURCE_MAX_PAGE_SIZE) {
      throw new Error(INVALID_REQUEST_CODE);
    }

    return [
      `search=${encodeURIComponent(search)}`,
      `page=${Math.max(page, 1)}`,
      `pageSize=${pageSize}`
    ].join('&');
  }

  private toPermissionSource(dto: PermissionSourceUserDto): PermissionSourceUser {
    return {
      id: dto.id,
      fullName: dto.fullName,
      email: dto.email,
      roleId: dto.roleId,
      isActive: dto.isActive
    };
  }

  private isPositiveInteger(value: number): boolean {
    return Number.isInteger(value) && value > 0;
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
