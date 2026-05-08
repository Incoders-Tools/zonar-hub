import { TournamentRule } from '../models/tournament-rule.model';

export interface TournamentRuleRepository {
  getAll(): Promise<TournamentRule[]>;
  getById(id: string): Promise<TournamentRule | undefined>;
  create(rule: Omit<TournamentRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentRule>;
  update(id: string, rule: Partial<TournamentRule>): Promise<TournamentRule>;
  delete(id: string): Promise<void>;
}
