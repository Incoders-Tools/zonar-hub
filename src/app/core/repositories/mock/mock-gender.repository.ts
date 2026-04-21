import { Injectable } from '@angular/core';
import { Gender } from '../../models';
import { GenderRepository } from '../gender.repository';
import { MOCK_GENDERS } from '../../data/mock/mock-catalogs';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;
const STORAGE_COLLECTION = 'genders';

interface GenderStorageState { data: Gender[]; counter: number; }

@Injectable({ providedIn: 'root' })
export class MockGenderRepository implements GenderRepository {
  private genders: Gender[];
  private idCounter: number;

  constructor() {
    const stored = loadFromStorage<GenderStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.genders = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.genders = structuredClone(MOCK_GENDERS);
      this.idCounter = this.genders.length;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.genders, counter: this.idCounter });
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<Gender[]> {
    return this.delay(structuredClone(this.genders));
  }

  async getById(id: string): Promise<Gender | undefined> {
    const found = this.genders.find(g => g.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(gender: Omit<Gender, 'id'>): Promise<Gender> {
    const now = new Date().toISOString();
    const newGender: Gender = {
      ...gender,
      id: `g${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.genders.push(newGender);
    this.persist();
    return this.delay(structuredClone(newGender));
  }

  async update(id: string, changes: Partial<Gender>): Promise<Gender> {
    const idx = this.genders.findIndex(g => g.id === id);
    if (idx === -1) {
      throw new Error(`Gender ${id} not found`);
    }
    this.genders[idx] = { ...this.genders[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.genders[idx]));
  }

  async delete(id: string): Promise<void> {
    this.genders = this.genders.filter(g => g.id !== id);
    this.persist();
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.genders.map(g => g.key));
  }
}
