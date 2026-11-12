// --- Participant type derived from sport + tournament type ---

export type ParticipantType = 'individual' | 'pair' | 'team';

// --- Sport-level registration configuration ---

export interface SportParticipantConfig {
  sportKey: string;
  participantType: ParticipantType;
  minPlayers: number;
  maxPlayers: number;
  requiresGender: boolean;
  requiresCategory: boolean;
  categoryToleranceLevels: number;
  allowsHabitualPartner: boolean;
}

// --- Rule set binding sport + tournament type to a config ---

export interface SportRegistrationRuleSet {
  sportId: string;
  tournamentTypeId: string;
  config: SportParticipantConfig;
}

// --- Validation result for a single participant in a slot ---

export interface ParticipantValidationResult {
  slotNumber: number;
  playerId: string;
  valid: boolean;
  errors: string[]; // i18n keys
}
