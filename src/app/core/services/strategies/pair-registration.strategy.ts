import { BaseRegistrationStrategy } from './base-registration.strategy';
import { SportParticipantConfig } from '../../models/sport-config.model';

export class PairRegistrationStrategy extends BaseRegistrationStrategy {
  constructor(config: SportParticipantConfig) {
    super(config);
  }

  getSlotCount(): number {
    return 2;
  }

  getSlotLabel(index: number): string {
    return index === 0
      ? 'participantSearch.slot.player1'
      : 'participantSearch.slot.player2';
  }
}
