import { Injectable } from '@angular/core';
import { TournamentRuleSet } from '../../models';
import { TournamentRuleSetRepository } from '../tournament-rule-set.repository';

@Injectable({ providedIn: 'root' })
export class ApiTournamentRuleSetRepository implements TournamentRuleSetRepository {
  async getAll(): Promise<TournamentRuleSet[]> {
    return [];
  }

  async getById(_id: string): Promise<TournamentRuleSet | undefined> {
    return undefined;
  }

  async create(_ruleSet: Omit<TournamentRuleSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentRuleSet> {
    throw new Error('common.featureNotAvailable');
  }

  async update(_id: string, _ruleSet: Partial<TournamentRuleSet>): Promise<TournamentRuleSet> {
    throw new Error('common.featureNotAvailable');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }
}
