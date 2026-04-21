import { Team } from '../../models/team.model';

export const MOCK_TEAMS: Team[] = [
  {
    id: 'tm1',
    name: 'Los Tigres de Buenos Aires',
    sportId: 'sp1',
    sportName: 'Padel',
    categoryId: 'cat1',
    categoryName: '1ª',
    players: [
      { playerId: 'p1', playerName: 'Martín García', sortOrder: 1 },
      { playerId: 'p2', playerName: 'Lucas Rodríguez', sortOrder: 2 },
      { playerId: 'p5', playerName: 'Diego Fernández', sortOrder: 3 },
      { playerId: 'p6', playerName: 'Nicolás Pérez', sortOrder: 4 }
    ],
    captainId: 'p1',
    captainName: 'Martín García',
    isActive: true,
    createdAt: '2025-06-01',
    updatedAt: '2025-06-01'
  },
  {
    id: 'tm2',
    name: 'Damas Córdoba',
    sportId: 'sp1',
    sportName: 'Padel',
    categoryId: 'cat2',
    categoryName: '2ª',
    players: [
      { playerId: 'p3', playerName: 'Sofía López', sortOrder: 1 },
      { playerId: 'p4', playerName: 'Valentina Martínez', sortOrder: 2 },
      { playerId: 'p7', playerName: 'Camila Torres', sortOrder: 3 }
    ],
    captainId: 'p3',
    captainName: 'Sofía López',
    isActive: true,
    createdAt: '2025-07-01',
    updatedAt: '2025-07-01'
  },
  {
    id: 'tm3',
    name: 'Club Rosario Élite',
    sportId: 'sp1',
    sportName: 'Padel',
    categoryId: 'cat2',
    categoryName: '2ª',
    players: [
      { playerId: 'p8', playerName: 'Joaquín Sánchez', sortOrder: 1 },
      { playerId: 'p10', playerName: 'Tomás Ramírez', sortOrder: 2 },
      { playerId: 'p13', playerName: 'Agustín Herrera', sortOrder: 3 },
      { playerId: 'p15', playerName: 'Mateo Romero', sortOrder: 4 },
      { playerId: 'p19', playerName: 'Bruno Acosta', sortOrder: 5 }
    ],
    captainId: 'p8',
    captainName: 'Joaquín Sánchez',
    isActive: true,
    createdAt: '2025-08-01',
    updatedAt: '2025-08-01'
  },
  {
    id: 'tm4',
    name: 'Equipo Inactivo Demo',
    sportId: 'sp1',
    sportName: 'Padel',
    players: [
      { playerId: 'p21', playerName: 'Ezequiel Suárez', sortOrder: 1 }
    ],
    observations: 'Equipo de ejemplo desactivado',
    isActive: false,
    createdAt: '2025-09-01',
    updatedAt: '2025-09-01'
  }
];
