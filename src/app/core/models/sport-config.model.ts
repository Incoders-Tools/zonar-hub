import { TournamentEligibilitySlot } from './tournament-admin.model';

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

// --- Strategy interface for sport-specific registration behavior ---

export interface RegistrationStrategy {
  readonly config: SportParticipantConfig;
  getSlotCount(): number;
  getSlotLabel(index: number): string;
  validateParticipant(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    participant: any,
    slot: TournamentEligibilitySlot | null,
    categoryLevels: Map<string, number>
  ): ParticipantValidationResult;
  isCategoryCompatible(playerCategoryLevel: number, requiredCategoryLevel: number): boolean;
  isGenderCompatible(playerGenderId: string, requiredGenderId: string | null): boolean;
  isAgeCompatible(playerBirthDate: string | null, minAge: number | null, maxAge: number | null): boolean;
}

// --- Validation result for a single participant in a slot ---

export interface ParticipantValidationResult {
  slotNumber: number;
  playerId: string;
  valid: boolean;
  errors: string[]; // i18n keys
}
