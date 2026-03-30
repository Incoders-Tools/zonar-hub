import { Category, Gender, TournamentStatus, TournamentType, City, Role } from '../../models';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: '1ª Categoría', shortName: '1ª', key: 'first', level: 1, isActive: true, sortOrder: 1, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'cat2', name: '2ª Categoría', shortName: '2ª', key: 'second', level: 2, isActive: true, sortOrder: 2, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'cat3', name: '3ª Categoría', shortName: '3ª', key: 'third', level: 3, isActive: true, sortOrder: 3, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'cat4', name: '4ª Categoría', shortName: '4ª', key: 'fourth', level: 4, isActive: true, sortOrder: 4, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'cat5', name: '5ª Categoría', shortName: '5ª', key: 'fifth', level: 5, isActive: true, sortOrder: 5, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'cat6', name: '6ª Categoría', shortName: '6ª', key: 'sixth', level: 6, isActive: true, sortOrder: 6, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'cat7', name: '7ª Categoría', shortName: '7ª', key: 'seventh', level: 7, isActive: true, sortOrder: 7, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'cat8', name: 'Promocional', shortName: 'Promo', key: 'promotional', level: 8, isActive: false, sortOrder: 8, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-06-01T14:00:00Z' }
];

export const MOCK_GENDERS: Gender[] = [
  { id: 'g1', name: 'Caballeros', key: 'male', isActive: true, sortOrder: 1, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'g2', name: 'Damas', key: 'female', isActive: true, sortOrder: 2, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' },
  { id: 'g3', name: 'Mixto', key: 'mixed', isActive: true, sortOrder: 3, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-15T10:00:00Z' }
];

export const MOCK_TOURNAMENT_STATUSES: TournamentStatus[] = [
  { id: 'ts1', name: 'Registration Open', key: 'registration_open', description: 'Active registration', sortOrder: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts2', name: 'In Progress', key: 'in_progress', description: 'Tournament running', sortOrder: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts3', name: 'Finished', key: 'finished', description: 'Tournament completed', sortOrder: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts4', name: 'Cancelled', key: 'cancelled', description: 'Tournament cancelled', sortOrder: 4, isActive: false, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'ts5', name: 'Draft', key: 'draft', description: 'Draft status', sortOrder: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
];

export const MOCK_TOURNAMENT_TYPES: TournamentType[] = [
  { id: 'tt1', name: 'Zones + Elimination', key: 'zones_elimination', sortOrder: 1, scoresPoints: true, appliesGender: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'tt2', name: 'Zones Only', key: 'zones_only', sortOrder: 2, scoresPoints: true, appliesGender: false, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'tt3', name: 'Direct Elimination', key: 'direct_elimination', sortOrder: 3, scoresPoints: false, appliesGender: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }
];

export const MOCK_CITIES: City[] = [
  { id: 'city1', name: 'Buenos Aires', provinceOrState: 'CABA' },
  { id: 'city2', name: 'Córdoba', provinceOrState: 'Córdoba' },
  { id: 'city3', name: 'Rosario', provinceOrState: 'Santa Fe' }
];

export const MOCK_ROLES: Role[] = [
  { id: 'role1', name: 'admin', description: 'Administrative user', isActive: true, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'role2', name: 'player', description: 'Tournament player', isActive: true, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: 'role3', name: 'viewer', description: 'View-only access', isActive: true, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') }
];
