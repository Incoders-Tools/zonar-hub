import { SportParticipantConfig } from '../../models/sport-config.model';

/**
 * Base class for sport-specific registration strategies: slot count and labels per participant type.
 * Participant eligibility (gender, category, age) lives in `EligibilityValidationService`, the client mirror of D3.
 */
export abstract class BaseRegistrationStrategy {
  constructor(public readonly config: SportParticipantConfig) {}

  abstract getSlotCount(): number;
  abstract getSlotLabel(index: number): string;
}
