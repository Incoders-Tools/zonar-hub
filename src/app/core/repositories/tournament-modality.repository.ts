import { TournamentModality } from '../models';

export interface TournamentModalityRepository {
  getAll(): Promise<TournamentModality[]>;
  getById(id: string): Promise<TournamentModality | undefined>;
  create(modality: Omit<TournamentModality, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentModality>;
  update(id: string, modality: Partial<TournamentModality>): Promise<TournamentModality>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}
