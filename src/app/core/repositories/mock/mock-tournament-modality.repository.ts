import { Injectable } from '@angular/core';
import { TournamentModality } from '../../models';
import { TournamentModalityRepository } from '../tournament-modality.repository';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;
const STORAGE_COLLECTION = 'tournament-modalities';

interface ModalityStorageState {
  data: TournamentModality[];
  counter: number;
}

const MOCK_MODALITIES: TournamentModality[] = [
  {
    id: 'mod1',
    nameEs: 'Individual',
    nameEn: 'Single',
    namePt: 'Individual',
    key: 'single',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mod2',
    nameEs: 'Parejas',
    nameEn: 'Doubles',
    namePt: 'Duplas',
    key: 'doubles',
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mod3',
    nameEs: 'Equipos',
    nameEn: 'Teams',
    namePt: 'Equipes',
    key: 'teams',
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

@Injectable({ providedIn: 'root' })
export class MockTournamentModalityRepository implements TournamentModalityRepository {
  private modalities: TournamentModality[];
  private idCounter: number;

  constructor() {
    const stored = loadFromStorage<ModalityStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.modalities = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.modalities = structuredClone(MOCK_MODALITIES);
      this.idCounter = this.modalities.length;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.modalities, counter: this.idCounter } as ModalityStorageState);
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<TournamentModality[]> {
    return this.delay(structuredClone(this.modalities));
  }

  async getById(id: string): Promise<TournamentModality | undefined> {
    const found = this.modalities.find(m => m.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(modality: Omit<TournamentModality, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentModality> {
    const now = new Date().toISOString();
    const newModality: TournamentModality = {
      ...modality,
      id: `mod${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.modalities.push(newModality);
    this.persist();
    return this.delay(structuredClone(newModality));
  }

  async update(id: string, changes: Partial<TournamentModality>): Promise<TournamentModality> {
    const idx = this.modalities.findIndex(m => m.id === id);
    if (idx === -1) {
      throw new Error(`TournamentModality ${id} not found`);
    }
    this.modalities[idx] = { ...this.modalities[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.modalities[idx]));
  }

  async delete(id: string): Promise<void> {
    this.modalities = this.modalities.filter(m => m.id !== id);
    this.persist();
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.modalities.map(m => m.key));
  }
}
