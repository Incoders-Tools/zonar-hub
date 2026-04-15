import { Organization } from '../models';

export abstract class OrganizationRepository {
  abstract getAll(): Promise<Organization[]>;
  abstract getById(id: string): Promise<Organization>;
  abstract getByTenantId(tenantId: string): Promise<Organization[]>;
  abstract create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>;
  abstract update(id: string, data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Organization>;
  abstract delete(id: string): Promise<void>;
  abstract deactivate(id: string): Promise<Organization>;
}
