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

export interface AdminUserRepository {
  getPage(query: AdminUserPageQuery): Promise<AdminUserPage>;
  getAll(): Promise<AdminUser[]>;
  getById(id: string): Promise<AdminUser | undefined>;
  create(data: AdminUserCreatePayload): Promise<AdminUser>;
  update(id: string, data: AdminUserUpdatePayload): Promise<AdminUser>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
