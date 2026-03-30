import { TournamentRuleSet } from '../models';

export interface TournamentRuleSetRepository {
  getAll(): Promise<TournamentRuleSet[]>;
  getById(id: string): Promise<TournamentRuleSet | undefined>;
  create(ruleSet: Omit<TournamentRuleSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentRuleSet>;
  update(id: string, ruleSet: Partial<TournamentRuleSet>): Promise<TournamentRuleSet>;
  delete(id: string): Promise<void>;
}
