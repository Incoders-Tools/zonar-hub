import { Injectable } from '@angular/core';
import { Tournament } from '../../models';
import { TournamentAdminRepository } from '../tournament-admin.repository';
import { MOCK_TOURNAMENTS } from '../../data/mock/mock-tournaments';

const MOCK_DELAY = 400;

@Injectable({ providedIn: 'root' })
export class MockTournamentAdminRepository implements TournamentAdminRepository {
  private tournaments: Tournament[] = structuredClone(MOCK_TOURNAMENTS);
  private idCounter = this.tournaments.length;

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<Tournament[]> {
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
    return this.delay(structuredClone(newTournament));
  }

  async update(id: string, changes: Partial<Tournament>): Promise<Tournament> {
    const idx = this.tournaments.findIndex(t => t.id === id);
    if (idx === -1) {
      throw new Error(`Tournament ${id} not found`);
    }
    this.tournaments[idx] = { ...this.tournaments[idx], ...changes, updatedAt: new Date().toISOString() };
    return this.delay(structuredClone(this.tournaments[idx]));
  }

  async delete(id: string): Promise<void> {
    this.tournaments = this.tournaments.filter(t => t.id !== id);
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.tournaments.filter(t => t.key).map(t => t.key!));
  }
}
