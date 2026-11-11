import { Injectable } from '@angular/core';
import { Tournament, TournamentType } from '../models';

export interface TournamentAdminRepository {
  getAll(): Promise<Tournament[]>;
  getById(id: string): Promise<Tournament | undefined>;
  create(tournament: Omit<Tournament, 'id' | 'createdAt'>): Promise<Tournament>;
  update(id: string, tournament: Partial<Tournament>): Promise<Tournament>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
  /** Eligibility profile assigned to the tournament (R2b), null when it has none. */
  getEligibilityProfileId(tournamentId: string): Promise<string | null>;
  /**
   * Assigns an eligibility profile of the tournament's own organization, or clears it with null. An inactive profile
   * may be assigned: while inactive it is ignored and the tournament's own rules apply (L8).
   */
  setEligibilityProfile(tournamentId: string, eligibilityProfileId: string | null): Promise<string | null>;
}

export interface TournamentTypeRepository {
  getAll(): Promise<TournamentType[]>;
  create(type: Omit<TournamentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentType>;
  update(id: string, type: Partial<TournamentType>): Promise<TournamentType>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentTypeRepository implements TournamentTypeRepository {
  async getAll(): Promise<TournamentType[]> {
    return [];
  }

  async create(_type: Omit<TournamentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentType> {
    throw new Error('common.featureNotAvailable');
  }

  async update(_id: string, _changes: Partial<TournamentType>): Promise<TournamentType> {
    throw new Error('common.featureNotAvailable');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }

  async getExistingKeys(): Promise<string[]> {
    return [];
  }
}
