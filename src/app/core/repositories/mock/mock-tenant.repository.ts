import { Injectable } from '@angular/core';
import { Tenant, PlanType } from '../../models';
import { TenantRepository } from '../tenant.repository';

@Injectable({ providedIn: 'root' })
export class MockTenantRepository extends TenantRepository {
  private tenants: Tenant[] = [
    {
      id: 'tenant-1',
      name: 'Club Padel Barcelona',
      key: 'club_padel_barcelona',
      contactEmail: 'admin@clubpadelbarcelona.com',
      contactPhone: '+34 611 222 333',
      planId: 'plan-2',
      planType: 'pro',
      isActive: true,
      createdAt: '2025-01-15T10:00:00Z'
    },
    {
      id: 'tenant-2',
      name: 'Arena Padel Madrid',
      key: 'arena_padel_madrid',
      contactEmail: 'info@arenapadelm.es',
      contactPhone: '+34 622 333 444',
      planId: 'plan-3',
      planType: 'enterprise',
      isActive: true,
      createdAt: '2025-02-01T08:00:00Z'
    },
    {
      id: 'tenant-3',
      name: 'Torneo Express',
      key: 'torneo_express',
      contactEmail: 'soporte@torneoexpress.com',
      planId: 'plan-4',
      planType: 'single_use',
      isActive: true,
      createdAt: '2025-03-10T14:00:00Z'
    },
    {
      id: 'tenant-4',
      name: 'Padel League Portugal',
      key: 'padel_league_portugal',
      contactEmail: 'contact@padelpt.com',
      planId: 'plan-1',
      planType: 'starter',
      isActive: false,
      createdAt: '2025-01-20T12:00:00Z',
      updatedAt: '2025-04-01T09:00:00Z'
    }
  ];

  private nextId = 5;

  async getAll(): Promise<Tenant[]> {
    await this.delay();
    return JSON.parse(JSON.stringify(this.tenants));
  }

  /** Synchronous access to tenants for use in computed signals */
  getAllSync(): Tenant[] {
    return JSON.parse(JSON.stringify(this.tenants));
  }

  async getById(id: string): Promise<Tenant> {
    await this.delay();
    const tenant = this.tenants.find(t => t.id === id);
    if (!tenant) throw new Error(`Tenant ${id} not found`);
    return JSON.parse(JSON.stringify(tenant));
  }

  async create(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    await this.delay();
    if (this.tenants.some(t => t.key === data.key)) {
      throw new Error(`Tenant key "${data.key}" already exists`);
    }
    const tenant: Tenant = {
      ...data,
      id: `tenant-${this.nextId++}`,
      createdAt: new Date().toISOString()
    };
    this.tenants.push(tenant);
    return JSON.parse(JSON.stringify(tenant));
  }

  async update(id: string, data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant> {
    await this.delay();
    const idx = this.tenants.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Tenant ${id} not found`);
    this.tenants[idx] = { ...this.tenants[idx], ...data, updatedAt: new Date().toISOString() };
    return JSON.parse(JSON.stringify(this.tenants[idx]));
  }

  async delete(id: string): Promise<void> {
    await this.delay();
    const idx = this.tenants.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Tenant ${id} not found`);
    this.tenants.splice(idx, 1);
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 400));
  }
}
