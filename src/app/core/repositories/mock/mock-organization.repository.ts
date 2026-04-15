import { Injectable } from '@angular/core';
import { Organization, OrganizationType } from '../../models';
import { OrganizationRepository } from '../organization.repository';

@Injectable({ providedIn: 'root' })
export class MockOrganizationRepository extends OrganizationRepository {
  private organizations: Organization[] = [
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
      tenantId: 'tenant-2',
      displayName: 'Arena Padel Madrid',
      legalName: 'Arena Sports S.A.',
      description: 'Operadora de torneos de pádel y tenis en la Comunidad de Madrid.',
      type: 'operadora',
      isActive: true,
      createdAt: '2025-02-01T08:00:00Z',
      createdByUserId: 'u-2'
    },
    {
      id: 'org-3',
      tenantId: 'tenant-3',
      displayName: 'Torneo Express',
      description: 'Organización puntual de torneos por evento único.',
      type: 'empresa',
      isActive: true,
      createdAt: '2025-03-10T14:00:00Z',
      createdByUserId: 'u-3'
    },
    {
      id: 'org-4',
      tenantId: 'tenant-4',
      displayName: 'Padel League Portugal',
      legalName: 'Padel League Lda.',
      description: 'Liga de pádel amateur en Portugal.',
      type: 'circuito',
      isActive: false,
      createdAt: '2025-01-20T12:00:00Z',
      createdByUserId: 'u-4',
      updatedAt: '2025-04-01T09:00:00Z'
    }
  ];

  private nextId = 5;

  async getAll(): Promise<Organization[]> {
    await this.delay();
    return JSON.parse(JSON.stringify(this.organizations));
  }

  async getById(id: string): Promise<Organization> {
    await this.delay();
    const org = this.organizations.find(o => o.id === id);
    if (!org) throw new Error(`Organization ${id} not found`);
    return JSON.parse(JSON.stringify(org));
  }

  async getByTenantId(tenantId: string): Promise<Organization[]> {
    await this.delay();
    return JSON.parse(JSON.stringify(this.organizations.filter(o => o.tenantId === tenantId)));
  }

  async create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    await this.delay();
    const org: Organization = {
      ...data,
      id: `org-${this.nextId++}`,
      createdAt: new Date().toISOString()
    };
    this.organizations.push(org);
    return JSON.parse(JSON.stringify(org));
  }

  async update(id: string, data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Organization> {
    await this.delay();
    const idx = this.organizations.findIndex(o => o.id === id);
    if (idx === -1) throw new Error(`Organization ${id} not found`);
    this.organizations[idx] = { ...this.organizations[idx], ...data, updatedAt: new Date().toISOString() };
    return JSON.parse(JSON.stringify(this.organizations[idx]));
  }

  async delete(id: string): Promise<void> {
    await this.delay();
    const idx = this.organizations.findIndex(o => o.id === id);
    if (idx === -1) throw new Error(`Organization ${id} not found`);
    this.organizations.splice(idx, 1);
  }

  async deactivate(id: string): Promise<Organization> {
    return this.update(id, { isActive: false });
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 400));
  }
}
