import { Injectable } from '@angular/core';
import { TournamentStatus } from '../models';

export interface TournamentStatusRepository {
  getAll(): Promise<TournamentStatus[]>;
  getById(id: string): Promise<TournamentStatus | undefined>;
  create(status: Omit<TournamentStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentStatus>;
  update(id: string, status: Partial<TournamentStatus>): Promise<TournamentStatus>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}

const MOCK_TOURNAMENT_STATUSES: TournamentStatus[] = [
  { id: 'ts1', name: 'Registration Open', key: 'registration_open', description: 'Active registration', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts2', name: 'In Progress', key: 'in_progress', description: 'Tournament running', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts3', name: 'Finished', key: 'finished', description: 'Tournament completed', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
];

@Injectable({ providedIn: 'root' })
export class MockTournamentStatusRepository implements TournamentStatusRepository {
  private statuses: TournamentStatus[] = structuredClone(MOCK_TOURNAMENT_STATUSES);
  private idCounter = this.statuses.length;

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), 400));
  }

  async getAll(): Promise<TournamentStatus[]> {
    return this.delay(structuredClone(this.statuses));
  }

  async getById(id: string): Promise<TournamentStatus | undefined> {
    return this.delay(this.statuses.find(s => s.id === id) ? structuredClone(this.statuses.find(s => s.id === id)!) : undefined);
  }

  async create(status: Omit<TournamentStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentStatus> {
    const now = new Date().toISOString();
    const newStatus: TournamentStatus = { ...status, id: `ts${++this.idCounter}`, createdAt: now, updatedAt: now };
    this.statuses.push(newStatus);
    return this.delay(structuredClone(newStatus));
  }

  async update(id: string, changes: Partial<TournamentStatus>): Promise<TournamentStatus> {
    const idx = this.statuses.findIndex(s => s.id === id);
    if (idx === -1) throw new Error(`Status ${id} not found`);
    this.statuses[idx] = { ...this.statuses[idx], ...changes, updatedAt: new Date().toISOString() };
    return this.delay(structuredClone(this.statuses[idx]));
  }

  async delete(id: string): Promise<void> {
    this.statuses = this.statuses.filter(s => s.id !== id);
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.statuses.map(s => s.key));
  }
}
