import { TournamentEligibilityProfile } from '../models/tournament-admin.model';

export interface EligibilityProfileRepository {
  getAll(): Promise<TournamentEligibilityProfile[]>;
  getById(id: string): Promise<TournamentEligibilityProfile | undefined>;
}
