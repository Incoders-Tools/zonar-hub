import { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '../models/admin-user.model';

/**
 * Explicit list scope. Organization scope requires a selected organization;
 * a missing organization must never fall back to the global `all` scope.
 */
export type AdminUserListScope =
  | { kind: 'organization'; organizationId: string }
  | { kind: 'all' };

export interface AdminUserPageQuery {
  scope: AdminUserListScope;
  page: number;
  pageSize: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface AdminUserPage {
  items: AdminUser[];
  page: number;
  pageSize: number;
  /** Server-side count of every user matching the scope and filters, before paging. */
  totalCount: number;
}

/**
 * Bounded search for users whose permissions can be copied. `search` needs at least two meaningful
 * characters; `page` defaults to 1 and `pageSize` defaults to (and is capped at) 20.
 */
export interface PermissionSourceSearchQuery {
  search: string;
  page?: number;
  pageSize?: number;
}

/** Minimal permission-source projection; organization metadata is intentionally not exposed. */
export interface PermissionSourceUser {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  isActive: boolean;
}

export interface PermissionSourcePage {
  items: PermissionSourceUser[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface AdminUserRepository {
  getPage(query: AdminUserPageQuery): Promise<AdminUserPage>;
  searchPermissionSources(query: PermissionSourceSearchQuery): Promise<PermissionSourcePage>;
  getAll(): Promise<AdminUser[]>;
  getById(id: string): Promise<AdminUser | undefined>;
  create(data: AdminUserCreatePayload): Promise<AdminUser>;
  update(id: string, data: AdminUserUpdatePayload): Promise<AdminUser>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
