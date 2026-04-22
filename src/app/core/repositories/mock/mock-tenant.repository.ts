import { Injectable } from '@angular/core';
import { Tenant, PlanType } from '../../models';
import { TenantRepository } from '../tenant.repository';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const STORAGE_COLLECTION = 'tenants';

interface TenantStorageState { data: Tenant[]; nextId: number; }

const SEED_TENANTS: Tenant[] = [
  { id: 'tenant-1', name: 'Club Padel Barcelona', key: 'club_padel_barcelona', contactEmail: 'admin@clubpadelbarcelona.com', contactPhone: '+34 611 222 333', planId: 'plan-2', planType: 'pro', isActive: true, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'tenant-2', name: 'Arena Padel Madrid', key: 'arena_padel_madrid', contactEmail: 'info@arenapadelm.es', contactPhone: '+34 622 333 444', planId: 'plan-3', planType: 'enterprise', isActive: true, createdAt: '2025-02-01T08:00:00Z' },
  { id: 'tenant-3', name: 'Torneo Express', key: 'torneo_express', contactEmail: 'soporte@torneoexpress.com', planId: 'plan-4', planType: 'single_use', isActive: true, createdAt: '2025-03-10T14:00:00Z' },
  { id: 'tenant-4', name: 'Padel League Portugal', key: 'padel_league_portugal', contactEmail: 'contact@padelpt.com', planId: 'plan-1', planType: 'starter', isActive: false, createdAt: '2025-01-20T12:00:00Z', updatedAt: '2025-04-01T09:00:00Z' }
];

@Injectable({ providedIn: 'root' })
export class MockTenantRepository extends TenantRepository {
  private tenants: Tenant[];
  private nextId: number;

  constructor() {
    super();
    const stored = loadFromStorage<TenantStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.tenants = stored.data;
      this.nextId = stored.nextId;
    } else {
      this.tenants = structuredClone(SEED_TENANTS);
      this.nextId = 5;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.tenants, nextId: this.nextId });
  }

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
    let key = data.key;
    let suffix = 2;
    while (this.tenants.some(t => t.key === key)) {
      key = `${data.key}_${suffix++}`;
    }
    const tenant: Tenant = {
      ...data,
      key,
      id: `tenant-${this.nextId++}`,
      createdAt: new Date().toISOString()
    };
    this.tenants.push(tenant);
    this.persist();
    return JSON.parse(JSON.stringify(tenant));
  }

  async update(id: string, data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant> {
    await this.delay();
    const idx = this.tenants.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Tenant ${id} not found`);
    this.tenants[idx] = { ...this.tenants[idx], ...data, updatedAt: new Date().toISOString() };
    this.persist();
    return JSON.parse(JSON.stringify(this.tenants[idx]));
  }

  async delete(id: string): Promise<void> {
    await this.delay();
    const idx = this.tenants.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Tenant ${id} not found`);
    this.tenants.splice(idx, 1);
    this.persist();
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 400));
  }
}
