export type OrganizationType =
  | 'estandar'
  | 'circuito'
  | 'academia'
  | 'operadora'
  | 'marca';

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
  /** Consent to appear, for free, in ZonarHub public sections (tournament showcase, promotions). */
  publicProfileEnabled?: boolean;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  whatsappPhone?: string;
  contactEmail?: string;
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
