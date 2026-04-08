import { Player } from '../models/player.model';

export interface PlayerSearchFilters {
  genderId?: string;
  categoryId?: string;
  sportId?: string;
  isActive?: boolean;
}

export interface PlayerRepository {
  getAll(): Promise<Player[]>;
  getById(id: string): Promise<Player | undefined>;
  search(query: string, filters?: PlayerSearchFilters): Promise<Player[]>;
  create(player: Omit<Player, 'id' | 'createdAt'>): Promise<Player>;
  update(id: string, player: Partial<Player>): Promise<Player>;
  delete(id: string): Promise<void>;
  getByHabitualPartner(playerId: string): Promise<Player | undefined>;
}
