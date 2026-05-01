import { Injectable } from '@angular/core';
import { TournamentStatus } from '../../models';
import { TournamentStatusRepository } from '../tournament-status.repository';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;
const STORAGE_COLLECTION = 'tournament_statuses';

interface TsStorageState { data: TournamentStatus[]; counter: number; }

const MOCK_TOURNAMENT_STATUSES: TournamentStatus[] = [
  { id: 'ts1', name: 'Inscripción Abierta', key: 'registration_open', description: 'Período de inscripción activo', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts2', name: 'En Curso', key: 'in_progress', description: 'Torneo en progreso', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts3', name: 'Finalizado', key: 'finished', description: 'Torneo completado', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts4', name: 'Cancelado', key: 'cancelled', description: 'Torneo cancelado', sortOrder: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts5', name: 'Borrador', key: 'draft', description: 'Torneo en preparación', sortOrder: 5, isActive: false, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
];

@Injectable({ providedIn: 'root' })
export class MockTournamentStatusRepository implements TournamentStatusRepository {
  private statuses: TournamentStatus[];
  private idCounter: number;

  constructor() {
    const stored = loadFromStorage<TsStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.statuses = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.statuses = structuredClone(MOCK_TOURNAMENT_STATUSES);
      this.idCounter = this.statuses.length;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.statuses, counter: this.idCounter });
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<TournamentStatus[]> {
    return this.delay(structuredClone(this.statuses));
  }

  async getById(id: string): Promise<TournamentStatus | undefined> {
    const found = this.statuses.find(s => s.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(status: Omit<TournamentStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentStatus> {
    const now = new Date().toISOString();
    const newStatus: TournamentStatus = {
      ...status,
      id: `ts${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.statuses.push(newStatus);
    this.persist();
    return this.delay(structuredClone(newStatus));
  }

  async update(id: string, changes: Partial<TournamentStatus>): Promise<TournamentStatus> {
    const idx = this.statuses.findIndex(s => s.id === id);
    if (idx === -1) throw new Error(`TournamentStatus ${id} not found`);
    this.statuses[idx] = { ...this.statuses[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.statuses[idx]));
  }

  async delete(id: string): Promise<void> {
    this.statuses = this.statuses.filter(s => s.id !== id);
    this.persist();
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.statuses.map(s => s.key));
  }
}
