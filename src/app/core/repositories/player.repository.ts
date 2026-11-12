import { Player } from '../models/player.model';

export interface PlayerSearchFilters {
  genderId?: string;
  categoryId?: string;
  sportId?: string;
  isActive?: boolean;
}

/** Server page query of `GET /api/admin/organizations/{organizationId}/players`. */
export interface PlayerPageQuery {
  page: number;
  pageSize: number;
  /** Contains match on first name, last name, email or document, case-insensitive. */
  search?: string;
  isActive?: boolean;
}

export interface PlayerPage {
  items: Player[];
  page: number;
  pageSize: number;
  /** Server count of every player matching the query, before paging. */
  totalCount: number;
}

/** Editable fields of a player; blank optional values are stored as null. `isActive` is only read on update. */
export type PlayerWrite = Pick<Player, 'firstName' | 'lastName' | 'isActive'>
  & Partial<Pick<Player, 'email' | 'phone' | 'documentId' | 'birthDate' | 'genderId' | 'categoryId' | 'club'>>;

export interface PlayerRepository {
  getAll(): Promise<Player[]>;
  getPage(query: PlayerPageQuery): Promise<PlayerPage>;
  getById(id: string): Promise<Player | undefined>;
  search(query: string, filters?: PlayerSearchFilters): Promise<Player[]>;
  create(player: PlayerWrite): Promise<Player>;
  update(id: string, player: Partial<PlayerWrite>): Promise<Player>;
  /** Players are never deleted (their registrations keep them): this deactivates or reactivates one. */
  setActive(id: string, isActive: boolean): Promise<Player>;
  getByHabitualPartner(playerId: string): Promise<Player | undefined>;
}
