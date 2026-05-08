import { Injectable } from '@angular/core';
import { Player } from '../../models/player.model';
import { PlayerRepository, PlayerSearchFilters } from '../player.repository';

@Injectable({ providedIn: 'root' })
export class ApiPlayerRepository implements PlayerRepository {
  async getAll(): Promise<Player[]> {
    return [];
  }

  async getById(_id: string): Promise<Player | undefined> {
    return undefined;
  }

  async search(_query: string, _filters?: PlayerSearchFilters): Promise<Player[]> {
    return [];
  }

  async create(_player: Omit<Player, 'id' | 'createdAt'>): Promise<Player> {
    throw new Error('common.featureNotAvailable');
  }

  async update(_id: string, _player: Partial<Player>): Promise<Player> {
    throw new Error('common.featureNotAvailable');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }

  async getByHabitualPartner(_playerId: string): Promise<Player | undefined> {
    return undefined;
  }
}
