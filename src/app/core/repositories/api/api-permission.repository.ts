import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import {
  AdminUserPermissionsResponse,
  EffectivePermissionsResponse,
  PermissionCatalogResponse,
  UserOrganizationPermissionAssignment
} from '../../models';
import { extractApiErrorCode } from './api-error.util';

interface PermissionToolDto {
  key: string;
  labelKey: string;
  route?: string;
  sortOrder: number;
  isSystemAdminOnly: boolean;
  isActive: boolean;
}

interface PermissionModuleDto {
  key: string;
  labelKey: string;
  sortOrder: number;
  isActive: boolean;
  tools: PermissionToolDto[];
}

interface PermissionCatalogDto {
  modules: PermissionModuleDto[];
}

interface UserOrganizationPermissionAssignmentDto {
  organizationId: string;
  toolKeys: string[];
}

interface AdminUserPermissionsDto {
  userId: string;
  permissionsByOrganization: UserOrganizationPermissionAssignmentDto[];
}

interface EffectivePermissionsDto {
  organizationId?: string;
  toolKeys: string[];
}

@Injectable({ providedIn: 'root' })
export class ApiPermissionRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get adminPermissionEndpoint(): string {
    return `${this.apiBaseUrl}/admin/permissions`;
  }

  private get adminUsersEndpoint(): string {
    return `${this.apiBaseUrl}/admin/users`;
  }

  private get authEndpoint(): string {
    return `${this.apiBaseUrl}/auth`;
  }

  async getCatalog(): Promise<PermissionCatalogResponse> {
    try {
      const dto = await firstValueFrom(this.http.get<PermissionCatalogDto>(`${this.adminPermissionEndpoint}/catalog`));
      return {
        modules: (dto.modules ?? []).map(module => ({
          key: module.key,
          labelKey: module.labelKey,
          sortOrder: module.sortOrder,
          isActive: module.isActive,
          tools: (module.tools ?? []).map(tool => ({
            key: tool.key,
            moduleKey: module.key,
            labelKey: tool.labelKey,
            route: tool.route,
            sortOrder: tool.sortOrder,
            isSystemAdminOnly: tool.isSystemAdminOnly,
            isActive: tool.isActive
          }))
        }))
      };
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getUserPermissions(userId: string): Promise<AdminUserPermissionsResponse> {
    try {
      const dto = await firstValueFrom(
        this.http.get<AdminUserPermissionsDto>(`${this.adminUsersEndpoint}/${userId}/permissions`)
      );

      return {
        userId: dto.userId,
        permissionsByOrganization: (dto.permissionsByOrganization ?? []).map(permission => ({
          organizationId: permission.organizationId,
          toolKeys: [...(permission.toolKeys ?? [])]
        }))
      };
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async updateUserPermissions(
    userId: string,
    permissionsByOrganization: UserOrganizationPermissionAssignment[]
  ): Promise<void> {
    try {
      await firstValueFrom(this.http.put<void>(`${this.adminUsersEndpoint}/${userId}/permissions`, {
        permissionsByOrganization
      }));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getEffectivePermissions(organizationId?: string): Promise<EffectivePermissionsResponse> {
    try {
      const dto = await firstValueFrom(
        this.http.get<EffectivePermissionsDto>(`${this.authEndpoint}/me/effective-permissions`, {
          params: organizationId ? { organizationId } : {}
        })
      );

      return {
        organizationId: dto.organizationId,
        toolKeys: [...(dto.toolKeys ?? [])]
      };
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }
}
