import { Role, RoleCreatePayload, RoleUpdatePayload } from '../models';

export abstract class RoleRepository {
  abstract getAll(): Promise<Role[]>;
  abstract getById(id: string): Promise<Role>;
  abstract create(data: RoleCreatePayload): Promise<Role>;
  abstract update(id: string, data: RoleUpdatePayload): Promise<Role>;
  abstract delete(id: string): Promise<void>;
}
