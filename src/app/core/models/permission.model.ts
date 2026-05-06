export interface PermissionTool {
  key: string;
  moduleKey: string;
  labelKey: string;
  route?: string;
  sortOrder: number;
  isSystemAdminOnly: boolean;
  isActive: boolean;
}

export interface PermissionModule {
  key: string;
  labelKey: string;
  sortOrder: number;
  isActive: boolean;
  tools: PermissionTool[];
}

export interface PermissionCatalogResponse {
  modules: PermissionModule[];
}

export interface UserOrganizationPermissionAssignment {
  organizationId: string;
  toolKeys: string[];
}

export interface AdminUserPermissionsResponse {
  userId: string;
  permissionsByOrganization: UserOrganizationPermissionAssignment[];
}

export interface EffectivePermissionsResponse {
  organizationId?: string;
  toolKeys: string[];
}
