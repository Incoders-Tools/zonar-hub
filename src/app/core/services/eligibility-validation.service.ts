import { Injectable } from '@angular/core';
import { Player } from '../models/player.model';
import { Registration } from '../models/registration.model';
import { TournamentEligibilitySlot, TournamentEligibilityProfile } from '../models/tournament-admin.model';
import { Category, Gender } from '../models/catalog.model';
import { SportParticipantConfig, ParticipantValidationResult } from '../models/sport-config.model';
import { ParticipantAvailabilityState } from '../models/registration.model';

/** Levels a player's category may differ from the required one (API `RegistrationEligibility.CategoryTolerance`). */
export const ELIGIBILITY_CATEGORY_TOLERANCE = 1;

/** Gender key that admits any player (API `CatalogReferences.MixedGenderKey`). */
export const MIXED_GENDER_KEY = 'mixed';

/** Optional slots of a `teams` tournament without profile (API `RegistrationParticipant.MaxSlotNumber`). */
const TEAM_SLOT_COUNT = 16;

/** The tournament's own rules, used without an active eligibility profile (D3, L8). */
export interface TournamentEligibilityRules {
  modalityKey?: string;
  genderId?: string | null;
  categoryId?: string | null;
}

export interface EligibilityValidationOptions {
  /** Gender catalog; slots of the `mixed` gender admit any player. */
  genders?: Gender[];
  /** Fallback rules when there is no profile or the profile is inactive. Without them such slots do not restrict. */
  tournament?: TournamentEligibilityRules;
}

/**
 * Client mirror of the API D3 rules (`ZonarHub.Domain/Registrations/RegistrationEligibility.cs`), the single client
 * source of truth for participant eligibility. Per slot, in this order: a gender rule needs the same gender (the
 * `mixed` gender admits anyone); a category rule needs a known category at most one level away; an age rule needs a
 * birth date whose whole years today (UTC) fall within the limits. Missing player data never proves eligibility: it
 * fails the rule that needs it (L8), with an extra `validation.eligibility.missing*` key so the UI can ask to complete
 * the player record. An inactive profile is ignored and the tournament's own rules apply (L8).
 */
@Injectable({ providedIn: 'root' })
export class EligibilityValidationService {

  validateParticipantForSlot(
    player: Player,
    slot: TournamentEligibilitySlot | null,
    _config: SportParticipantConfig,
    categories: Category[],
    genders: Gender[] = []
  ): ParticipantValidationResult {
    return this.checkPlayer(player, slot, this.levels(categories), this.mixedGenderIds(genders));
  }

  validateAllParticipants(
    participants: { slotNumber: number; player: Player }[],
    profile: TournamentEligibilityProfile | null,
    _config: SportParticipantConfig,
    categories: Category[],
    options: EligibilityValidationOptions = {}
  ): ParticipantValidationResult[] {
    const levels = this.levels(categories);
    const mixed = this.mixedGenderIds(options.genders ?? []);
    const slots = profile?.isActive ? this.profileSlots(profile)
      : options.tournament ? this.tournamentSlots(options.tournament)
      : [];

    const results = participants.map(p =>
      this.checkPlayer(p.player, slots.find(s => s.slotNumber === p.slotNumber) ?? null, levels, mixed, p.slotNumber));

    const playerIds = participants.map(p => p.player.id);
    const duplicateIds = playerIds.filter((id, i) => playerIds.indexOf(id) !== i);
    for (const result of results) {
      if (duplicateIds.includes(result.playerId)) {
        result.valid = false;
        result.errors.push('validation.eligibility.duplicatePlayer');
      }
    }
    return results;
  }

  /**
   * Slots a registration must satisfy: those of the active profile in slot order, else the tournament's modality
   * (`single` one required slot, `teams` up to 16 optional slots, anything else two required slots), each with the
   * tournament's gender and category and no age limits.
   */
  resolveSlots(profile: TournamentEligibilityProfile | null, tournament: TournamentEligibilityRules): TournamentEligibilitySlot[] {
    return profile?.isActive ? this.profileSlots(profile) : this.tournamentSlots(tournament);
  }

  /** Errors of the filled slot numbers against the slots: a slot outside the rules, then a missing required slot. */
  validateSlotStructure(filledSlotNumbers: number[], slots: TournamentEligibilitySlot[]): string[] {
    const errors: string[] = [];
    const known = new Set(slots.map(s => s.slotNumber));
    if (filledSlotNumbers.some(n => !known.has(n))) errors.push('validation.eligibility.invalidSlot');
    const filled = new Set(filledSlotNumbers);
    if (slots.some(s => s.required && !filled.has(s.slotNumber))) errors.push('validation.eligibility.slotRequired');
    return errors;
  }

  getPlayerAvailabilityState(
    player: Player,
    tournamentId: string,
    slot: TournamentEligibilitySlot | null,
    _config: SportParticipantConfig,
    existingRegistrations: Registration[],
    categories: Category[],
    genders: Gender[] = []
  ): ParticipantAvailabilityState {
    const isRegistered = existingRegistrations.some(r =>
      r.tournamentId === tournamentId &&
      r.participants.some(p => p.playerId === player.id)
    );
    if (isRegistered) return 'alreadyRegistered';

    const result = this.checkPlayer(player, slot, this.levels(categories), this.mixedGenderIds(genders));
    if (result.errors.includes('validation.eligibility.genderMismatch')) return 'incompatibleGender';
    if (result.errors.includes('validation.eligibility.categoryOutOfRange')) return 'incompatibleCategory';
    if (result.errors.includes('validation.eligibility.ageOutOfRange')) return 'incompatibleAge';
    return 'available';
  }

  isCategoryWithinTolerance(
    playerCategoryLevel: number,
    requiredCategoryLevel: number,
    tolerance: number
  ): boolean {
    return Math.abs(playerCategoryLevel - requiredCategoryLevel) <= tolerance;
  }

  private checkPlayer(
    player: Player,
    slot: TournamentEligibilitySlot | null,
    levels: Map<string, number>,
    mixedGenderIds: Set<string>,
    slotNumber = slot?.slotNumber ?? 0
  ): ParticipantValidationResult {
    const errors: string[] = [];

    if (slot?.genderId && !mixedGenderIds.has(slot.genderId) && player.genderId !== slot.genderId) {
      errors.push('validation.eligibility.genderMismatch');
      if (!player.genderId) errors.push('validation.eligibility.missingGender');
    }

    if (slot?.categoryId) {
      const playerLevel = player.categoryId ? levels.get(player.categoryId) : undefined;
      const requiredLevel = levels.get(slot.categoryId);
      if (playerLevel === undefined || requiredLevel === undefined
        || !this.isCategoryWithinTolerance(playerLevel, requiredLevel, ELIGIBILITY_CATEGORY_TOLERANCE)) {
        errors.push('validation.eligibility.categoryOutOfRange');
        if (!player.categoryId) errors.push('validation.eligibility.missingCategory');
      }
    }

    if (slot && (slot.minAge !== null || slot.maxAge !== null)) {
      const age = player.birthDate ? ageTodayUtc(player.birthDate) : null;
      if (age === null || (slot.minAge !== null && age < slot.minAge) || (slot.maxAge !== null && age > slot.maxAge)) {
        errors.push('validation.eligibility.ageOutOfRange');
        if (!player.birthDate) errors.push('validation.eligibility.missingBirthDate');
      }
    }

    return { slotNumber, playerId: player.id, valid: errors.length === 0, errors };
  }

  private profileSlots(profile: TournamentEligibilityProfile): TournamentEligibilitySlot[] {
    return [...(profile.slots ?? [])].sort((a, b) => a.slotNumber - b.slotNumber);
  }

  private tournamentSlots(tournament: TournamentEligibilityRules): TournamentEligibilitySlot[] {
    const [count, required] = tournament.modalityKey === 'single' ? [1, true]
      : tournament.modalityKey === 'teams' ? [TEAM_SLOT_COUNT, false]
      : [2, true];
    return Array.from({ length: count }, (_, i) => ({
      slotNumber: i + 1,
      genderId: tournament.genderId || null,
      categoryId: tournament.categoryId || null,
      minAge: null,
      maxAge: null,
      label: null,
      required
    }));
  }

  private levels(categories: Category[]): Map<string, number> {
    return new Map(categories.map(c => [c.id, c.level]));
  }

  private mixedGenderIds(genders: Gender[]): Set<string> {
    return new Set(genders.filter(g => g.key === MIXED_GENDER_KEY).map(g => g.id));
  }
}

/** Whole years from an ISO birth date (`yyyy-MM-dd`) to today in UTC, null when the date is not valid. */
function ageTodayUtc(birthDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const now = new Date();
  const [ty, tm, td] = [now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()];
  // Like .NET DateOnly.AddYears, a 29 February birthday falls on 28 February in common years.
  const isLeap = (ty % 4 === 0 && ty % 100 !== 0) || ty % 400 === 0;
  const birthdayDay = month === 2 && day === 29 && !isLeap ? 28 : day;
  let age = ty - year;
  if (tm < month || (tm === month && td < birthdayDay)) age--;
  return age;
}
