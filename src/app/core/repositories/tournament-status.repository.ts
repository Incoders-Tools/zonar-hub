import { TournamentStatus } from '../models';

export interface TournamentStatusRepository {
  getAll(): Promise<TournamentStatus[]>;
  getById(id: string): Promise<TournamentStatus | undefined>;
  create(status: Omit<TournamentStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentStatus>;
  update(id: string, status: Partial<TournamentStatus>): Promise<TournamentStatus>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}
