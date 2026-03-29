import { Injectable } from '@angular/core';
import { Gender } from '../../models';
import { GenderRepository } from '../gender.repository';
import { MOCK_GENDERS } from '../../data/mock/mock-catalogs';

const MOCK_DELAY = 400;

@Injectable({ providedIn: 'root' })
export class MockGenderRepository implements GenderRepository {
  private genders: Gender[] = structuredClone(MOCK_GENDERS);
  private idCounter = this.genders.length;

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
    return this.delay(structuredClone(newGender));
  }

  async update(id: string, changes: Partial<Gender>): Promise<Gender> {
    const idx = this.genders.findIndex(g => g.id === id);
    if (idx === -1) {
      throw new Error(`Gender ${id} not found`);
    }
    this.genders[idx] = { ...this.genders[idx], ...changes, updatedAt: new Date().toISOString() };
    return this.delay(structuredClone(this.genders[idx]));
  }

  async delete(id: string): Promise<void> {
    this.genders = this.genders.filter(g => g.id !== id);
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.genders.map(g => g.key));
  }
}
