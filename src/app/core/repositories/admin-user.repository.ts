import { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '../models/admin-user.model';

export interface AdminUserRepository {
  getAll(): Promise<AdminUser[]>;
  getById(id: string): Promise<AdminUser | undefined>;
  create(data: AdminUserCreatePayload): Promise<AdminUser>;
  update(id: string, data: AdminUserUpdatePayload): Promise<AdminUser>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
