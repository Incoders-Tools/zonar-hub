import { Injectable } from '@angular/core';
import { Team } from '../../models/team.model';
import { MOCK_TEAMS } from '../../data/mock/mock-teams';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-persistence';
import { tenantStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const STORAGE_COLLECTION = 'teams';

interface TeamStorageState {
  data: Team[];
  counter: number;
}

@Injectable({ providedIn: 'root' })
export class MockTeamRepository {
  private teams: Team[] = [];
  private idCounter = 0;
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    const stored = loadFromStorage<TeamStorageState>(tenantStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.teams = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.teams = isDemoTenant() ? structuredClone(MOCK_TEAMS) : [];
      this.idCounter = this.teams.length;
    }
  }

  private persist(): void {
    persistToStorage(tenantStorageKey(STORAGE_COLLECTION), { data: this.teams, counter: this.idCounter } as TeamStorageState);
  }

  async getAll(): Promise<Team[]> {
    this.ensureSeed();
    return new Promise(resolve =>
      setTimeout(() => resolve(structuredClone(this.teams)), 400)
    );
  }

  async getById(id: string): Promise<Team | undefined> {
    this.ensureSeed();
    return structuredClone(this.teams.find(t => t.id === id));
  }

  async create(data: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    this.ensureSeed();
    this.idCounter++;
    const team: Team = {
      ...data,
      id: `tm${this.idCounter}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.teams.push(team);
    this.persist();
    return structuredClone(team);
  }

  async update(id: string, data: Partial<Omit<Team, 'id' | 'createdAt'>>): Promise<Team> {
    this.ensureSeed();
    const idx = this.teams.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Team ${id} not found`);
    this.teams[idx] = {
      ...this.teams[idx],
      ...data,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.persist();
    return structuredClone(this.teams[idx]);
  }

  async delete(id: string): Promise<void> {
    this.ensureSeed();
    this.teams = this.teams.filter(t => t.id !== id);
    this.persist();
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.ensureSeed();
    const idSet = new Set(ids);
    this.teams = this.teams.filter(t => !idSet.has(t.id));
    this.persist();
  }
}
