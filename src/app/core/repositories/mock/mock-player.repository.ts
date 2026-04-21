import { Injectable } from '@angular/core';
import { PlayerRepository, PlayerSearchFilters } from '../player.repository';
import { Player } from '../../models/player.model';
import { MOCK_PLAYERS } from '../../data/mock/mock-players';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-tenant-context';
import { tenantStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const STORAGE_COLLECTION = 'players';

interface PlayerStorageState {
  data: Player[];
  counter: number;
}

@Injectable({ providedIn: 'root' })
export class MockPlayerRepository implements PlayerRepository {
  private players: Player[] = [];
  private idCounter = 0;
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    const stored = loadFromStorage<PlayerStorageState>(tenantStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.players = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.players = isDemoTenant() ? structuredClone(MOCK_PLAYERS) : [];
      this.idCounter = this.players.length;
    }
  }

  private persist(): void {
    persistToStorage(tenantStorageKey(STORAGE_COLLECTION), { data: this.players, counter: this.idCounter } as PlayerStorageState);
  }

  async getAll(): Promise<Player[]> {
    this.ensureSeed();
    return new Promise(resolve =>
      setTimeout(() => resolve(structuredClone(this.players)), 400)
    );
  }

  async getById(id: string): Promise<Player | undefined> {
    return this.players.find(p => p.id === id);
  }

  async search(query: string, filters?: PlayerSearchFilters): Promise<Player[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const q = query.toLowerCase();

    let results = this.players.filter(p =>
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.documentId && p.documentId.includes(q))
    );

    if (filters) {
      if (filters.genderId) results = results.filter(p => p.genderId === filters.genderId);
      if (filters.categoryId) results = results.filter(p => p.categoryId === filters.categoryId);
      if (filters.sportId) results = results.filter(p => p.sportId === filters.sportId);
      if (filters.isActive !== undefined) results = results.filter(p => p.isActive === filters.isActive);
    }

    return structuredClone(results);
  }

  async create(player: Omit<Player, 'id' | 'createdAt'>): Promise<Player> {
    const now = new Date().toISOString();
    const newPlayer: Player = {
      ...player,
      id: `p${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.players.push(newPlayer);
    this.persist();
    return structuredClone(newPlayer);
  }

  async update(id: string, changes: Partial<Player>): Promise<Player> {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Player ${id} not found`);
    this.players[idx] = { ...this.players[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return structuredClone(this.players[idx]);
  }

  async delete(id: string): Promise<void> {
    this.players = this.players.filter(p => p.id !== id);
    this.persist();
  }

  async getByHabitualPartner(playerId: string): Promise<Player | undefined> {
    // Bidirectional: if A's habitualPartnerId is B or B's habitualPartnerId is A
    const player = this.players.find(p => p.id === playerId);
    if (player?.habitualPartnerId) {
      return this.players.find(p => p.id === player.habitualPartnerId);
    }
    return this.players.find(p => p.habitualPartnerId === playerId);
  }
}
