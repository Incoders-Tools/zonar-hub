import { Injectable } from '@angular/core';
import { Organization, OrganizationType } from '../../models';
import { OrganizationRepository } from '../organization.repository';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-tenant-context';
import { tenantStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const STORAGE_COLLECTION = 'organizations';

const DEMO_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-1',
    tenantId: 'tenant-1',
    displayName: 'Club Padel Barcelona',
    legalName: 'Club Padel Barcelona S.L.',
    description: 'Circuito competitivo de pádel en Barcelona y alrededores.',
    type: 'circuito',
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z',
    createdByUserId: 'u-1'
  },
  {
    id: 'org-2',
    tenantId: 'tenant-1',
    displayName: 'Arena Padel Madrid',
    legalName: 'Arena Sports S.A.',
    description: 'Operadora de torneos de pádel y tenis en la Comunidad de Madrid.',
    type: 'operadora',
    isActive: true,
    createdAt: '2025-02-01T08:00:00Z',
    createdByUserId: 'u-2'
  }
];

interface OrgStorageState {
  data: Organization[];
  nextId: number;
}

@Injectable({ providedIn: 'root' })
export class MockOrganizationRepository extends OrganizationRepository {
  private organizations: Organization[] = [];
  private nextId = 0;
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    const stored = loadFromStorage<OrgStorageState>(tenantStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.organizations = stored.data;
      this.nextId = stored.nextId;
    } else {
      this.organizations = isDemoTenant() ? structuredClone(DEMO_ORGANIZATIONS) : [];
      this.nextId = this.organizations.length + 1;
    }
  }

  private persist(): void {
    const state: OrgStorageState = { data: this.organizations, nextId: this.nextId };
    persistToStorage(tenantStorageKey(STORAGE_COLLECTION), state);
  }

  async getAll(): Promise<Organization[]> {
    this.ensureSeed();
    await this.delay();
    return JSON.parse(JSON.stringify(this.organizations));
  }

  async getById(id: string): Promise<Organization> {
    this.ensureSeed();
    await this.delay();
    const org = this.organizations.find(o => o.id === id);
    if (!org) throw new Error(`Organization ${id} not found`);
    return JSON.parse(JSON.stringify(org));
  }

  async getByTenantId(tenantId: string): Promise<Organization[]> {
    this.ensureSeed();
    await this.delay();
    return JSON.parse(JSON.stringify(this.organizations.filter(o => o.tenantId === tenantId)));
  }

  async create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    this.ensureSeed();
    await this.delay();
    const org: Organization = {
      ...data,
      id: `org-${this.nextId++}`,
      createdAt: new Date().toISOString()
    };
    this.organizations.push(org);
    this.persist();
    return JSON.parse(JSON.stringify(org));
  }

  async update(id: string, data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Organization> {
    this.ensureSeed();
    await this.delay();
    const idx = this.organizations.findIndex(o => o.id === id);
    if (idx === -1) throw new Error(`Organization ${id} not found`);
    this.organizations[idx] = { ...this.organizations[idx], ...data, updatedAt: new Date().toISOString() };
    this.persist();
    return JSON.parse(JSON.stringify(this.organizations[idx]));
  }

  async delete(id: string): Promise<void> {
    this.ensureSeed();
    await this.delay();
    const idx = this.organizations.findIndex(o => o.id === id);
    if (idx === -1) throw new Error(`Organization ${id} not found`);
    this.organizations.splice(idx, 1);
    this.persist();
  }

  async deactivate(id: string): Promise<Organization> {
    return this.update(id, { isActive: false });
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 400));
  }
}
