import { Injectable } from '@angular/core';
import { SportParticipantConfig, SportRegistrationRuleSet } from '../models/sport-config.model';
import { BaseRegistrationStrategy } from './strategies/base-registration.strategy';
import { PairRegistrationStrategy } from './strategies/pair-registration.strategy';
import { IndividualRegistrationStrategy } from './strategies/individual-registration.strategy';
import { TeamRegistrationStrategy } from './strategies/team-registration.strategy';

const DEFAULT_SPORT_CONFIG: SportParticipantConfig = {
  sportKey: 'default',
  participantType: 'pair',
  minPlayers: 2,
  maxPlayers: 2,
  requiresGender: true,
  requiresCategory: true,
  categoryToleranceLevels: 1,
  allowsHabitualPartner: true
};

/** Sport-specific overrides will land server-side; until then every sport
 *  falls back to the safe pair default above. */
const SPORT_REGISTRATION_RULES: SportRegistrationRuleSet[] = [];

@Injectable({ providedIn: 'root' })
export class RegistrationStrategyService {
  private readonly rules: SportRegistrationRuleSet[] = SPORT_REGISTRATION_RULES;

  getConfig(sportId: string, tournamentTypeId: string): SportParticipantConfig {
    const rule = this.rules.find(
      r => r.sportId === sportId && r.tournamentTypeId === tournamentTypeId
    );
    return rule?.config ?? DEFAULT_SPORT_CONFIG;
  }

  getStrategy(sportId: string, tournamentTypeId: string): BaseRegistrationStrategy {
    const config = this.getConfig(sportId, tournamentTypeId);
    switch (config.participantType) {
      case 'individual':
        return new IndividualRegistrationStrategy(config);
      case 'team':
        return new TeamRegistrationStrategy(config);
      case 'pair':
      default:
        return new PairRegistrationStrategy(config);
    }
  }

  getSlotCount(sportId: string, tournamentTypeId: string): number {
    return this.getStrategy(sportId, tournamentTypeId).getSlotCount();
  }

  getParticipantType(sportId: string, tournamentTypeId: string): string {
    return this.getConfig(sportId, tournamentTypeId).participantType;
  }
}
