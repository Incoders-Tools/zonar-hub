import { SportRegistrationRuleSet } from '../../models';

export const SPORT_REGISTRATION_RULES: SportRegistrationRuleSet[] = [
  // Padel — Doubles (default)
  {
    sportId: 'sp1',
    tournamentTypeId: 'tt1',
    config: {
      sportKey: 'padel',
      participantType: 'pair',
      minPlayers: 2,
      maxPlayers: 2,
      requiresGender: true,
      requiresCategory: true,
      categoryToleranceLevels: 1,
      allowsHabitualPartner: true
    }
  },
  {
    sportId: 'sp1',
    tournamentTypeId: 'tt2',
    config: {
      sportKey: 'padel',
      participantType: 'pair',
      minPlayers: 2,
      maxPlayers: 2,
      requiresGender: true,
      requiresCategory: true,
      categoryToleranceLevels: 1,
      allowsHabitualPartner: true
    }
  },
  // Tenis — Singles
  {
    sportId: 'sp2',
    tournamentTypeId: 'tt3',
    config: {
      sportKey: 'tenis',
      participantType: 'individual',
      minPlayers: 1,
      maxPlayers: 1,
      requiresGender: true,
      requiresCategory: true,
      categoryToleranceLevels: 2,
      allowsHabitualPartner: false
    }
  },
  // Tenis — Doubles
  {
    sportId: 'sp2',
    tournamentTypeId: 'tt4',
    config: {
      sportKey: 'tenis',
      participantType: 'pair',
      minPlayers: 2,
      maxPlayers: 2,
      requiresGender: true,
      requiresCategory: true,
      categoryToleranceLevels: 2,
      allowsHabitualPartner: true
    }
  },
  // Futbol — Team
  {
    sportId: 'sp3',
    tournamentTypeId: 'tt5',
    config: {
      sportKey: 'futbol',
      participantType: 'team',
      minPlayers: 5,
      maxPlayers: 11,
      requiresGender: false,
      requiresCategory: false,
      categoryToleranceLevels: 0,
      allowsHabitualPartner: false
    }
  }
];

/**
 * Default fallback config when no specific rule set matches.
 * Assumes padel doubles (the most common case in the system).
 */
export const DEFAULT_SPORT_CONFIG: SportRegistrationRuleSet['config'] = {
  sportKey: 'padel',
  participantType: 'pair',
  minPlayers: 2,
  maxPlayers: 2,
  requiresGender: true,
  requiresCategory: true,
  categoryToleranceLevels: 1,
  allowsHabitualPartner: true
};
