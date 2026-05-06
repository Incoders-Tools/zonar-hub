export interface AdminUser {
  id: string;
  organizationId?: string;
  organizationName?: string;
  email: string;
  fullName: string;
  phone?: string;
  roleId?: string;
  roleName?: string;
  complexId?: string;
  complexName?: string;
  tenantIds?: string[];
  tenantNames?: string[];
  profileImagePath?: string;
  is2FAEnabled?: boolean;
  lastLogin?: string;
  isActive: boolean;
  role?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUserPermissionByOrganization {
  organizationId: string;
  toolKeys: string[];
}

export interface AdminUserCreatePayload {
  email: string;
  fullName: string;
  phone?: string;
  roleId: string;
  organizationId?: string;
  tenantIds?: string[];
  tenantNames?: string[];
  complexId?: string;
  profileImagePath?: string;
  permissionsByOrganization?: AdminUserPermissionByOrganization[];
  password?: string;
}

export interface AdminUserUpdatePayload {
  fullName?: string;
  phone?: string;
  roleId?: string;
  organizationId?: string;
  complexId?: string;
  tenantIds?: string[];
  tenantNames?: string[];
  profileImagePath?: string;
  permissionsByOrganization?: AdminUserPermissionByOrganization[];
  isActive?: boolean;
}
