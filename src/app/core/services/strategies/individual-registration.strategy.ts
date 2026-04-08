import { BaseRegistrationStrategy } from './base-registration.strategy';
import { SportParticipantConfig } from '../../models/sport-config.model';

export class IndividualRegistrationStrategy extends BaseRegistrationStrategy {
  constructor(config: SportParticipantConfig) {
    super(config);
  }

  getSlotCount(): number {
    return 1;
  }

  getSlotLabel(_index: number): string {
    return 'participantSearch.slot.player';
  }
}
