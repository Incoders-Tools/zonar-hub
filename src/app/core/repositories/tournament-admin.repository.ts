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

export interface TournamentEligibilityProfileRepository {
  getAll(): Promise<TournamentEligibilityProfile[]>;
  create(profile: Omit<TournamentEligibilityProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentEligibilityProfile>;
  update(id: string, profile: Partial<TournamentEligibilityProfile>): Promise<TournamentEligibilityProfile>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentEligibilityProfileRepository implements TournamentEligibilityProfileRepository {
  async getAll(): Promise<TournamentEligibilityProfile[]> {
    return [];
  }

  async create(_profile: Omit<TournamentEligibilityProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentEligibilityProfile> {
    throw new Error('common.featureNotAvailable');
  }

  async update(_id: string, _changes: Partial<TournamentEligibilityProfile>): Promise<TournamentEligibilityProfile> {
    throw new Error('common.featureNotAvailable');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }

  async getExistingKeys(): Promise<string[]> {
    return [];
  }
}
