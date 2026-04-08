import { Registration } from '../models/registration.model';

export interface RegistrationRepository {
  getAll(): Promise<Registration[]>;
  getByTournament(tournamentId: string): Promise<Registration[]>;
  getByPlayer(playerId: string): Promise<Registration[]>;
  getById(id: string): Promise<Registration | undefined>;
  create(registration: Omit<Registration, 'id' | 'registeredAt'>): Promise<Registration>;
  update(id: string, registration: Partial<Registration>): Promise<Registration>;
  delete(id: string): Promise<void>;
  isDuplicateParticipantSet(tournamentId: string, playerIds: string[]): boolean;
}
