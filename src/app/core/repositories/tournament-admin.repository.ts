import { Injectable } from '@angular/core';
import { Tournament, TournamentType, TournamentEligibilityProfile } from '../models';

export interface TournamentAdminRepository {
  getAll(): Promise<Tournament[]>;
  getById(id: string): Promise<Tournament | undefined>;
  create(tournament: Omit<Tournament, 'id' | 'createdAt'>): Promise<Tournament>;
  update(id: string, tournament: Partial<Tournament>): Promise<Tournament>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}

export interface TournamentTypeRepository {
  getAll(): Promise<TournamentType[]>;
  create(type: Omit<TournamentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentType>;
  update(id: string, type: Partial<TournamentType>): Promise<TournamentType>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}

const MOCK_TYPES: TournamentType[] = [
  { id: 'tt1', name: 'singles', key: 'singles', sportId: 'sp1', sportName: 'Padel', sortOrder: 1, scoresPoints: true, appliesGender: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'tt2', name: 'doubles', key: 'doubles', sportId: 'sp1', sportName: 'Padel', sortOrder: 2, scoresPoints: true, appliesGender: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
];

@Injectable({ providedIn: 'root' })
export class MockTournamentTypeRepository implements TournamentTypeRepository {
  private types: TournamentType[] = structuredClone(MOCK_TYPES);
  private idCounter = this.types.length;

  async getAll(): Promise<TournamentType[]> {
    return new Promise(resolve => setTimeout(() => resolve(structuredClone(this.types)), 400));
  }

  async create(type: Omit<TournamentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentType> {
    const newType: TournamentType = { ...type, id: `tt${++this.idCounter}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.types.push(newType);
    return newType;
  }

  async update(id: string, changes: Partial<TournamentType>): Promise<TournamentType> {
    const idx = this.types.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Type ${id} not found`);
    this.types[idx] = { ...this.types[idx], ...changes, updatedAt: new Date().toISOString() };
    return this.types[idx];
  }

  async delete(id: string): Promise<void> {
    this.types = this.types.filter(t => t.id !== id);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.types.map(t => t.key);
  }
}

export interface TournamentEligibilityProfileRepository {
  getAll(): Promise<any[]>;
  create(profile: any): Promise<any>;
  update(id: string, profile: Partial<any>): Promise<any>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}

@Injectable({ providedIn: 'root' })
export class MockTournamentEligibilityProfileRepository implements TournamentEligibilityProfileRepository {
  private profiles: any[] = [];
  private idCounter = 0;

  async getAll(): Promise<any[]> {
    return new Promise(resolve => setTimeout(() => resolve(structuredClone(this.profiles)), 400));
  }

  async create(profile: any): Promise<any> {
    const newProfile = { ...profile, id: `tep${++this.idCounter}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.profiles.push(newProfile);
    return newProfile;
  }

  async update(id: string, changes: Partial<any>): Promise<any> {
    const idx = this.profiles.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Profile ${id} not found`);
    this.profiles[idx] = { ...this.profiles[idx], ...changes, updatedAt: new Date().toISOString() };
    return this.profiles[idx];
  }

  async delete(id: string): Promise<void> {
    this.profiles = this.profiles.filter(p => p.id !== id);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.profiles.map(p => p.key);
  }
}
