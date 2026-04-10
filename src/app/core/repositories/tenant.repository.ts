import { Tenant } from '../models';

export abstract class TenantRepository {
  abstract getAll(): Promise<Tenant[]>;
  abstract getById(id: string): Promise<Tenant>;
  abstract create(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant>;
  abstract update(id: string, data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant>;
  abstract delete(id: string): Promise<void>;
}
