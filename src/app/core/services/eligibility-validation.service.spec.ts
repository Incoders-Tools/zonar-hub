import { TestBed } from '@angular/core/testing';
import { EligibilityValidationService } from './eligibility-validation.service';
import { Category, Gender, Player, TournamentEligibilityProfile, TournamentEligibilitySlot } from '../models';
import { SportParticipantConfig } from '../models/sport-config.model';

const config: SportParticipantConfig = {
  sportKey: 'padel', participantType: 'pair', minPlayers: 2, maxPlayers: 2, requiresGender: true,
  requiresCategory: true, categoryToleranceLevels: 1, allowsHabitualPartner: true
};

const category = (id: string, level: number): Category => ({
  id, name: id, shortName: id, key: id, level, isActive: true, sortOrder: level, createdAt: '', updatedAt: ''
});
const categories = [category('c-3', 3), category('c-4', 4), category('c-6', 6)];
const gender = (id: string, key: string): Gender => ({ id, name: key, key, isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' });
const genders = [gender('g-f', 'female'), gender('g-m', 'male'), gender('g-x', 'mixed')];

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p-1', firstName: 'Ana', lastName: 'Gil', email: '', genderId: 'g-f', genderLabel: '', categoryId: 'c-4',
    categoryName: '', birthDate: '1990-05-20', isActive: true, createdAt: '', ...overrides
  };
}

function slot(overrides: Partial<TournamentEligibilitySlot> = {}): TournamentEligibilitySlot {
  return { slotNumber: 1, genderId: null, categoryId: null, minAge: null, maxAge: null, label: null, required: true, ...overrides };
}

function profile(overrides: Partial<TournamentEligibilityProfile> = {}): TournamentEligibilityProfile {
  return {
    id: 'ep-1', name: 'Damas', key: '', description: null, sortOrder: null, isActive: true, createdAt: '', updatedAt: '',
    slots: [slot({ slotNumber: 2, genderId: 'g-m' }), slot({ slotNumber: 1, genderId: 'g-f' })], ...overrides
  };
}

/** ISO date `years` before today (UTC), shifted by `dayOffset` days. */
function birthDateYearsAgo(years: number, dayOffset = 0): string {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate() + dayOffset));
  return date.toISOString().slice(0, 10);
}

describe('EligibilityValidationService (D3 mirror, L8)', () => {
  let service: EligibilityValidationService;

  beforeEach(() => {
    service = TestBed.inject(EligibilityValidationService);
  });

  const check = (p: Player, s: TournamentEligibilitySlot | null) =>
    service.validateParticipantForSlot(p, s, config, categories, genders);

  describe('gender rule', () => {
    it('accepts the same gender and rejects another one', () => {
      expect(check(player(), slot({ genderId: 'g-f' })).valid).toBeTrue();
      expect(check(player({ genderId: 'g-m' }), slot({ genderId: 'g-f' })).errors)
        .toEqual(['validation.eligibility.genderMismatch']);
    });

    it('admits any player, even without gender, in a mixed slot', () => {
      expect(check(player({ genderId: 'g-m' }), slot({ genderId: 'g-x' })).valid).toBeTrue();
      expect(check(player({ genderId: '' }), slot({ genderId: 'g-x' })).valid).toBeTrue();
    });

    it('makes a player without gender ineligible for a gender rule', () => {
      expect(check(player({ genderId: '' }), slot({ genderId: 'g-f' })).errors)
        .toEqual(['validation.eligibility.genderMismatch', 'validation.eligibility.missingGender']);
    });
  });

  describe('category rule', () => {
    it('accepts players at most one level away and rejects two levels away', () => {
      expect(check(player({ categoryId: 'c-3' }), slot({ categoryId: 'c-4' })).valid).toBeTrue();
      expect(check(player({ categoryId: 'c-4' }), slot({ categoryId: 'c-4' })).valid).toBeTrue();
      expect(check(player({ categoryId: 'c-6' }), slot({ categoryId: 'c-4' })).errors)
        .toEqual(['validation.eligibility.categoryOutOfRange']);
    });

    it('makes a player without category ineligible instead of treating it as level 0', () => {
      expect(check(player({ categoryId: '' }), slot({ categoryId: 'c-3' })).errors)
        .toEqual(['validation.eligibility.categoryOutOfRange', 'validation.eligibility.missingCategory']);
    });

    it('makes a player whose category is unknown ineligible', () => {
      expect(check(player({ categoryId: 'c-unknown' }), slot({ categoryId: 'c-4' })).errors)
        .toEqual(['validation.eligibility.categoryOutOfRange']);
    });
  });

  describe('age rule', () => {
    it('counts whole years and accepts the bounds', () => {
      expect(check(player({ birthDate: birthDateYearsAgo(18) }), slot({ minAge: 18, maxAge: 40 })).valid).toBeTrue();
      expect(check(player({ birthDate: birthDateYearsAgo(40) }), slot({ minAge: 18, maxAge: 40 })).valid).toBeTrue();
    });

    it('rejects a player one day before the minimum age and one past the maximum', () => {
      expect(check(player({ birthDate: birthDateYearsAgo(18, 1) }), slot({ minAge: 18 })).errors)
        .toEqual(['validation.eligibility.ageOutOfRange']);
      expect(check(player({ birthDate: birthDateYearsAgo(41) }), slot({ maxAge: 40 })).errors)
        .toEqual(['validation.eligibility.ageOutOfRange']);
    });

    it('makes a player without birth date ineligible when the slot has an age limit', () => {
      expect(check(player({ birthDate: undefined }), slot({ minAge: 18 })).errors)
        .toEqual(['validation.eligibility.ageOutOfRange', 'validation.eligibility.missingBirthDate']);
    });

    it('needs no birth date when the slot has no age limit', () => {
      expect(check(player({ birthDate: undefined, genderId: '', categoryId: '' }), slot()).valid).toBeTrue();
    });
  });

  describe('slot resolution', () => {
    it('uses the active profile slots in slot order', () => {
      const slots = service.resolveSlots(profile(), { modalityKey: 'doubles', genderId: 'g-m', categoryId: 'c-4' });
      expect(slots.map(s => [s.slotNumber, s.genderId])).toEqual([[1, 'g-f'], [2, 'g-m']]);
    });

    it('ignores an inactive profile and applies the tournament rules (L8)', () => {
      const slots = service.resolveSlots(profile({ isActive: false }), { modalityKey: 'doubles', genderId: 'g-m', categoryId: 'c-4' });
      expect(slots).toEqual([
        slot({ slotNumber: 1, genderId: 'g-m', categoryId: 'c-4' }),
        slot({ slotNumber: 2, genderId: 'g-m', categoryId: 'c-4' })
      ]);
    });

    it('derives the slots from the modality without a profile', () => {
      expect(service.resolveSlots(null, { modalityKey: 'single' }).length).toBe(1);
      expect(service.resolveSlots(null, { modalityKey: undefined }).map(s => s.required)).toEqual([true, true]);
      const teams = service.resolveSlots(null, { modalityKey: 'teams', genderId: '' });
      expect(teams.length).toBe(16);
      expect(teams.every(s => !s.required && s.genderId === null)).toBeTrue();
    });
  });

  describe('slot structure', () => {
    const slots = [slot({ slotNumber: 1 }), slot({ slotNumber: 2, required: false })];

    it('accepts filled required slots and an empty optional one', () => {
      expect(service.validateSlotStructure([1], slots)).toEqual([]);
    });

    it('reports a filled slot outside the rules, then a missing required slot', () => {
      expect(service.validateSlotStructure([3], slots))
        .toEqual(['validation.eligibility.invalidSlot', 'validation.eligibility.slotRequired']);
      expect(service.validateSlotStructure([2], slots)).toEqual(['validation.eligibility.slotRequired']);
    });
  });

  describe('validateAllParticipants', () => {
    it('validates each participant against its profile slot and flags duplicates', () => {
      const results = service.validateAllParticipants(
        [{ slotNumber: 1, player: player() }, { slotNumber: 2, player: player() }], profile(), config, categories, { genders });
      expect(results[0].errors).toEqual(['validation.eligibility.duplicatePlayer']);
      expect(results[1].errors).toEqual(['validation.eligibility.genderMismatch', 'validation.eligibility.duplicatePlayer']);
    });

    it('applies the tournament rules when the profile is inactive', () => {
      const results = service.validateAllParticipants(
        [{ slotNumber: 1, player: player() }], profile({ isActive: false }), config, categories,
        { genders, tournament: { modalityKey: 'doubles', genderId: 'g-m', categoryId: null } });
      expect(results[0].errors).toEqual(['validation.eligibility.genderMismatch']);
    });
  });

  it('reports missing data through the matching incompatible availability state', () => {
    const state = service.getPlayerAvailabilityState(
      player({ categoryId: '' }), 't-1', slot({ categoryId: 'c-4' }), config, [], categories, genders);
    expect(state).toBe('incompatibleCategory');
  });
});
