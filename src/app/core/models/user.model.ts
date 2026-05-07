export type UserRole = 'system_admin' | 'admin' | 'editor' | 'user' | 'player' | 'viewer';

export type PlanType = 'starter' | 'pro' | 'enterprise' | 'single_use';

export interface Tenant {
  id: string;
  name: string;
  key: string;
  contactEmail: string;
  contactPhone?: string;
  planId: string;
  planType: PlanType;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  key: PlanType;
  priceMonthly: number | null;
  priceAnnual: number | null;
  priceSingleUse: number | null;
  maxTournaments: number | null;
  maxRegistrations: number | null;
  maxAdmins: number;
  maxComplexes: number;
  maxCourts: number;
  features: string[];
  dedicatedServer: boolean;
  dedicatedDatabase: boolean;
  dedicatedAI: boolean;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  birthDate?: string;
  roleId: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  tenantId?: string;
  tenantIds?: string[];
  organizationId?: string;
  locale?: string;
  dateFormat?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
  tenant?: Tenant;
  organizationId?: string;
  organizationName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  birthDate?: string;
  verificationCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}
