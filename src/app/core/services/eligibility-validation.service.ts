import { Injectable } from '@angular/core';
import { Player } from '../models/player.model';
import { Registration } from '../models/registration.model';
import { TournamentEligibilitySlot, TournamentEligibilityProfile } from '../models/tournament-admin.model';
import { Category } from '../models/catalog.model';
import { SportParticipantConfig, ParticipantValidationResult } from '../models/sport-config.model';
import { ParticipantAvailabilityState } from '../models/registration.model';
import { BaseRegistrationStrategy } from './strategies/base-registration.strategy';
import { PairRegistrationStrategy } from './strategies/pair-registration.strategy';
import { IndividualRegistrationStrategy } from './strategies/individual-registration.strategy';
import { TeamRegistrationStrategy } from './strategies/team-registration.strategy';

@Injectable({ providedIn: 'root' })
export class EligibilityValidationService {

  validateParticipantForSlot(
    player: Player,
    slot: TournamentEligibilitySlot | null,
    config: SportParticipantConfig,
    categories: Category[]
  ): ParticipantValidationResult {
    const categoryLevels = new Map<string, number>(
      categories.map(c => [c.id, c.level])
    );
    const strategy = this.buildStrategy(config);
    return strategy.validateParticipant(player, slot, categoryLevels);
  }

  validateAllParticipants(
    participants: { slotNumber: number; player: Player }[],
    profile: TournamentEligibilityProfile | null,
    config: SportParticipantConfig,
    categories: Category[]
  ): ParticipantValidationResult[] {
    const results: ParticipantValidationResult[] = [];
    const categoryLevels = new Map<string, number>(
      categories.map(c => [c.id, c.level])
    );
    const strategy = this.buildStrategy(config);

    for (const p of participants) {
      const slot = profile?.slots?.find(s => s.slotNumber === p.slotNumber) ?? null;
      results.push(strategy.validateParticipant(p.player, slot, categoryLevels));
    }

    // Check for duplicate players across slots
    const playerIds = participants.map(p => p.player.id);
    const duplicateIds = playerIds.filter((id, i) => playerIds.indexOf(id) !== i);
    if (duplicateIds.length > 0) {
      for (const result of results) {
        if (duplicateIds.includes(result.playerId)) {
          result.valid = false;
          result.errors.push('validation.eligibility.duplicatePlayer');
        }
      }
    }

    return results;
  }

  getPlayerAvailabilityState(
    player: Player,
    tournamentId: string,
    slot: TournamentEligibilitySlot | null,
    config: SportParticipantConfig,
    existingRegistrations: Registration[],
    categories: Category[]
  ): ParticipantAvailabilityState {
    const isRegistered = existingRegistrations.some(r =>
      r.tournamentId === tournamentId &&
      r.participants.some(p => p.playerId === player.id)
    );
    if (isRegistered) return 'alreadyRegistered';

    if (slot) {
      const categoryLevels = new Map<string, number>(
        categories.map(c => [c.id, c.level])
      );
      const strategy = this.buildStrategy(config);
      const result = strategy.validateParticipant(player, slot, categoryLevels);

      if (!result.valid) {
        if (result.errors.includes('validation.eligibility.genderMismatch')) return 'incompatibleGender';
        if (result.errors.includes('validation.eligibility.categoryOutOfRange')) return 'incompatibleCategory';
        if (result.errors.includes('validation.eligibility.ageOutOfRange')) return 'incompatibleAge';
      }
    }

    return 'available';
  }

  isCategoryWithinTolerance(
    playerCategoryLevel: number,
    requiredCategoryLevel: number,
    tolerance: number
  ): boolean {
    return Math.abs(playerCategoryLevel - requiredCategoryLevel) <= tolerance;
  }

  private buildStrategy(config: SportParticipantConfig): BaseRegistrationStrategy {
    switch (config.participantType) {
      case 'individual': return new IndividualRegistrationStrategy(config);
      case 'team': return new TeamRegistrationStrategy(config);
      case 'pair':
      default: return new PairRegistrationStrategy(config);
    }
  }
}
