import { SportParticipantConfig, ParticipantValidationResult } from '../../models/sport-config.model';
import { TournamentEligibilitySlot } from '../../models/tournament-admin.model';
import { Player } from '../../models/player.model';

/**
 * Base class for sport-specific registration strategies.
 * Provides shared validation logic (category tolerance, gender, age).
 */
export abstract class BaseRegistrationStrategy {
  constructor(public readonly config: SportParticipantConfig) {}

  abstract getSlotCount(): number;
  abstract getSlotLabel(index: number): string;

  isCategoryCompatible(playerCategoryLevel: number, requiredCategoryLevel: number): boolean {
    return Math.abs(playerCategoryLevel - requiredCategoryLevel) <= this.config.categoryToleranceLevels;
  }

  isGenderCompatible(playerGenderId: string, requiredGenderId: string | null): boolean {
    if (!requiredGenderId || !this.config.requiresGender) return true;
    return playerGenderId === requiredGenderId;
  }

  isAgeCompatible(playerBirthDate: string | null, minAge: number | null, maxAge: number | null): boolean {
    if (minAge === null && maxAge === null) return true;
    if (!playerBirthDate) return true;

    const birth = new Date(playerBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    if (minAge !== null && age < minAge) return false;
    if (maxAge !== null && age > maxAge) return false;
    return true;
  }

  validateParticipant(
    player: Player,
    slot: TournamentEligibilitySlot | null,
    categoryLevels: Map<string, number>
  ): ParticipantValidationResult {
    const errors: string[] = [];

    if (slot) {
      if (!this.isGenderCompatible(player.genderId, slot.genderId)) {
        errors.push('validation.eligibility.genderMismatch');
      }

      if (slot.categoryId && this.config.requiresCategory) {
        const playerLevel = categoryLevels.get(player.categoryId) ?? 0;
        const requiredLevel = categoryLevels.get(slot.categoryId) ?? 0;
        if (!this.isCategoryCompatible(playerLevel, requiredLevel)) {
          errors.push('validation.eligibility.categoryOutOfRange');
        }
      }

      if (!this.isAgeCompatible(player.birthDate ?? null, slot.minAge, slot.maxAge)) {
        errors.push('validation.eligibility.ageOutOfRange');
      }
    }

    return {
      slotNumber: slot?.slotNumber ?? 0,
      playerId: player.id,
      valid: errors.length === 0,
      errors
    };
  }
}
