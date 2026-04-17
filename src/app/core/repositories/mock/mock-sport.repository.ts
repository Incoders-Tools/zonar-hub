import { Injectable } from '@angular/core';
import { Sport } from '../../models';
import { SportRepository } from '../sport.repository';

const MOCK_DELAY = 400;

const MOCK_SPORTS: Sport[] = [
  {
    id: 'sp1',
    name: 'Pádel',
    key: 'padel',
    icon: '🎾',
    iconSource: 'unicode',
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sp2',
    name: 'Fútbol',
    key: 'futbol',
    icon: '⚽',
    iconSource: 'unicode',
    isActive: true,
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sp3',
    name: 'Rugby',
    key: 'rugby',
    icon: '🏉',
    iconSource: 'unicode',
    isActive: true,
    sortOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sp4',
    name: 'Tenis',
    key: 'tenis',
    icon: '🎾',
    iconSource: 'unicode',
    isActive: true,
    sortOrder: 4,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

@Injectable({ providedIn: 'root' })
export class MockSportRepository implements SportRepository {
  private sports: Sport[] = structuredClone(MOCK_SPORTS);
  private idCounter = this.sports.length;

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<Sport[]> {
    return this.delay(structuredClone(this.sports));
  }

  async getById(id: string): Promise<Sport | undefined> {
    const found = this.sports.find(s => s.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(sport: Omit<Sport, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sport> {
    const now = new Date().toISOString();
    const newSport: Sport = {
      ...sport,
      id: `sp${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.sports.push(newSport);
    return this.delay(structuredClone(newSport));
  }

  async update(id: string, changes: Partial<Sport>): Promise<Sport> {
    const idx = this.sports.findIndex(s => s.id === id);
    if (idx === -1) {
      throw new Error(`Sport ${id} not found`);
    }
    this.sports[idx] = { ...this.sports[idx], ...changes, updatedAt: new Date().toISOString() };
    return this.delay(structuredClone(this.sports[idx]));
  }

  async delete(id: string): Promise<void> {
    this.sports = this.sports.filter(s => s.id !== id);
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.sports.map(s => s.key));
  }
}
