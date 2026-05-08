import { Injectable } from '@angular/core';
import { TournamentEligibilityProfile } from '../../models/tournament-admin.model';
import { EligibilityProfileRepository } from '../eligibility-profile.repository';

@Injectable({ providedIn: 'root' })
export class ApiEligibilityProfileRepository implements EligibilityProfileRepository {
  async getAll(): Promise<TournamentEligibilityProfile[]> {
    return [];
  }

  async getById(_id: string): Promise<TournamentEligibilityProfile | undefined> {
    return undefined;
  }
}
