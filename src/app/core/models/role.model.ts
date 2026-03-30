export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const SYSTEM_ROLE_NAMES = ['system_admin', 'admin', 'user', 'viewer'];

export function isSystemRole(name: string): boolean {
  return SYSTEM_ROLE_NAMES.includes(name.toLowerCase());
}

export interface RoleFormData extends Omit<Role, 'id' | 'createdAt' | 'updatedAt'> {}

export interface RoleCreatePayload extends Omit<Role, 'id' | 'createdAt' | 'updatedAt'> {}

export interface RoleUpdatePayload extends Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>> {}
