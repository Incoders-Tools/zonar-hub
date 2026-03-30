import { Sport } from '../models';

export interface SportRepository {
  getAll(): Promise<Sport[]>;
  getById(id: string): Promise<Sport | undefined>;
  create(sport: Omit<Sport, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sport>;
  update(id: string, sport: Partial<Sport>): Promise<Sport>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}
