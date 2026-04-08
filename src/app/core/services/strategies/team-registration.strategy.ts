import { BaseRegistrationStrategy } from './base-registration.strategy';
import { SportParticipantConfig } from '../../models/sport-config.model';

export class TeamRegistrationStrategy extends BaseRegistrationStrategy {
  constructor(config: SportParticipantConfig) {
    super(config);
  }

  getSlotCount(): number {
    return this.config.minPlayers;
  }

  getSlotLabel(index: number): string {
    return 'participantSearch.slot.teamMember';
  }
}
