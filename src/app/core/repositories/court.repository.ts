import { Court } from '../models';

export interface CourtRepository {
  getAll(): Promise<Court[]>;
  getById(id: string): Promise<Court | undefined>;
  getByComplexId(complexId: string): Promise<Court[]>;
  create(court: Omit<Court, 'id'>): Promise<Court>;
  update(id: string, court: Partial<Court>): Promise<Court>;
  delete(id: string): Promise<void>;
}
