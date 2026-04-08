import { Injectable } from '@angular/core';
import { EligibilityProfileRepository } from '../eligibility-profile.repository';
import { TournamentEligibilityProfile } from '../../models/tournament-admin.model';
import { MOCK_ELIGIBILITY_PROFILES } from '../../data/mock/mock-eligibility-profiles';

@Injectable({ providedIn: 'root' })
export class MockEligibilityProfileRepository implements EligibilityProfileRepository {
  private readonly profiles: TournamentEligibilityProfile[] = structuredClone(MOCK_ELIGIBILITY_PROFILES);

  async getAll(): Promise<TournamentEligibilityProfile[]> {
    return new Promise(resolve =>
      setTimeout(() => resolve(structuredClone(this.profiles)), 300)
    );
  }

  async getById(id: string): Promise<TournamentEligibilityProfile | undefined> {
    return this.profiles.find(p => p.id === id);
  }
}
