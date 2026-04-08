import { Injectable } from '@angular/core';
import { SportParticipantConfig, SportRegistrationRuleSet } from '../models/sport-config.model';
import { SPORT_REGISTRATION_RULES, DEFAULT_SPORT_CONFIG } from '../data/mock/mock-sport-configs';
import { BaseRegistrationStrategy } from './strategies/base-registration.strategy';
import { PairRegistrationStrategy } from './strategies/pair-registration.strategy';
import { IndividualRegistrationStrategy } from './strategies/individual-registration.strategy';
import { TeamRegistrationStrategy } from './strategies/team-registration.strategy';

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
