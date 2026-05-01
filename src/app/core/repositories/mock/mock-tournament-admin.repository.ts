import { Injectable } from '@angular/core';
import { Tournament } from '../../models';
import { TournamentAdminRepository } from '../tournament-admin.repository';
import { MOCK_TOURNAMENTS } from '../../data/mock/mock-tournaments';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-persistence';
import { tenantStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;
const STORAGE_COLLECTION = 'tournaments';

interface TournamentStorageState {
  data: Tournament[];
  counter: number;
}

@Injectable({ providedIn: 'root' })
export class MockTournamentAdminRepository implements TournamentAdminRepository {
  private tournaments: Tournament[] = [];
  private idCounter = 0;
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    const stored = loadFromStorage<TournamentStorageState>(tenantStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.tournaments = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.tournaments = isDemoTenant() ? structuredClone(MOCK_TOURNAMENTS) : [];
      this.idCounter = this.tournaments.length;
    }
  }

  private persist(): void {
    persistToStorage(tenantStorageKey(STORAGE_COLLECTION), { data: this.tournaments, counter: this.idCounter } as TournamentStorageState);
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<Tournament[]> {
    this.ensureSeed();
    return this.delay(structuredClone(this.tournaments));
  }

  async getById(id: string): Promise<Tournament | undefined> {
    const found = this.tournaments.find(t => t.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(tournament: Omit<Tournament, 'id' | 'createdAt'>): Promise<Tournament> {
    const now = new Date().toISOString();
    const newTournament: Tournament = {
      ...tournament,
      id: `t${++this.idCounter}`,
      createdAt: now
    };
    this.tournaments.push(newTournament);
    this.persist();
    return this.delay(structuredClone(newTournament));
  }

  async update(id: string, changes: Partial<Tournament>): Promise<Tournament> {
    const idx = this.tournaments.findIndex(t => t.id === id);
    if (idx === -1) {
      throw new Error(`Tournament ${id} not found`);
    }
    this.tournaments[idx] = { ...this.tournaments[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.tournaments[idx]));
  }

  async delete(id: string): Promise<void> {
    this.tournaments = this.tournaments.filter(t => t.id !== id);
    this.persist();
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.tournaments.filter(t => t.key).map(t => t.key!));
  }
}
