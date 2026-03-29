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
  { id: 'ts1', label: 'Próximo', color: 'upcoming' },
  { id: 'ts2', label: 'Inscripción abierta', color: 'open' },
  { id: 'ts3', label: 'En curso', color: 'in-progress' },
  { id: 'ts4', label: 'Finalizado', color: 'completed' },
  { id: 'ts5', label: 'Cancelado', color: 'cancelled' },
  { id: 'ts6', label: 'Borrador', color: 'draft' }
];

export const MOCK_TOURNAMENT_TYPES: TournamentType[] = [
  { id: 'tt1', name: 'Zonas + Eliminación', description: 'Fase de zonas seguida de cuadro eliminatorio.' },
  { id: 'tt2', name: 'Solo Zonas', description: 'Se juegan solo zonas sin eliminación directa.' },
  { id: 'tt3', name: 'Eliminación Directa', description: 'Cuadro directo desde el inicio.' }
];

export const MOCK_CITIES: City[] = [
  { id: 'city1', name: 'Buenos Aires', provinceOrState: 'CABA' },
  { id: 'city2', name: 'Córdoba', provinceOrState: 'Córdoba' },
  { id: 'city3', name: 'Rosario', provinceOrState: 'Santa Fe' }
];

export const MOCK_ROLES: Role[] = [
  { id: 'role1', name: 'admin' },
  { id: 'role2', name: 'player' },
  { id: 'role3', name: 'viewer' }
];
