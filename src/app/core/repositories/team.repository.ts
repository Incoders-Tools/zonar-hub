import { Team } from '../models/team.model';

export interface TeamRepository {
  getAll(): Promise<Team[]>;
  getById(id: string): Promise<Team | undefined>;
  create(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team>;
  update(id: string, team: Partial<Team>): Promise<Team>;
  delete(id: string): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
}
