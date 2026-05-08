import { Injectable } from '@angular/core';
import { Team } from '../../models/team.model';
import { TeamRepository } from '../team.repository';

@Injectable({ providedIn: 'root' })
export class ApiTeamRepository implements TeamRepository {
  async getAll(): Promise<Team[]> {
    return [];
  }

  async getById(_id: string): Promise<Team | undefined> {
    return undefined;
  }

  async create(_team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    throw new Error('common.featureNotAvailable');
  }

  async update(_id: string, _team: Partial<Team>): Promise<Team> {
    throw new Error('common.featureNotAvailable');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }

  async bulkDelete(_ids: string[]): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }
}
