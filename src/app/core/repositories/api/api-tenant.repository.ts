import { Injectable } from '@angular/core';
import { Tenant } from '../../models';
import { TenantRepository } from '../tenant.repository';

@Injectable({ providedIn: 'root' })
export class ApiTenantRepository extends TenantRepository {
  async getAll(): Promise<Tenant[]> {
    return [];
  }

  async getById(id: string): Promise<Tenant> {
    throw new Error(`Tenant ${id} not found`);
  }

  async create(_data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    throw new Error('common.featureNotAvailable');
  }

  async update(_id: string, _data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant> {
    throw new Error('common.featureNotAvailable');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }
}
