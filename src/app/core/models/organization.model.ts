export type OrganizationType =
  | 'empresa'
  | 'circuito'
  | 'academia'
  | 'operadora'
  | 'marca'
  | 'unidad_operativa';

export interface Organization {
  id: string;
  tenantId: string;
  displayName: string;
  legalName?: string;
  description?: string;
  type: OrganizationType;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  createdByUserId: string;
  updatedAt?: string;
}

export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  organizationName?: string;
  role: UserOrganizationRole;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export type UserOrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';
