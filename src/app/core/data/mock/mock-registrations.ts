import { Registration, RegistrationToken } from '../../models';

export const MOCK_REGISTRATIONS: Registration[] = [
  {
    id: 'r1', tournamentId: 't1', tournamentName: 'Copa Primavera 2026',
    participants: [
      { slotNumber: 1, playerId: 'p1', playerName: 'Martín García', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros' },
      { slotNumber: 2, playerId: 'p2', playerName: 'Lucas Rodríguez', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros' }
    ],
    player1Id: 'p1', player1Name: 'Martín García', player2Id: 'p2', player2Name: 'Lucas Rodríguez',
    categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros',
    statusId: 'rs1', statusLabel: 'Confirmada', source: 'wizard',
    registeredAt: '2026-03-05', confirmedAt: '2026-03-05',
    registrationOpenDate: '2026-02-01', registrationCloseDate: '2026-03-10'
  },
  {
    id: 'r2', tournamentId: 't1', tournamentName: 'Copa Primavera 2026',
    participants: [
      { slotNumber: 1, playerId: 'p5', playerName: 'Diego Fernández', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros' },
      { slotNumber: 2, playerId: 'p6', playerName: 'Nicolás Pérez', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros' }
    ],
    player1Id: 'p5', player1Name: 'Diego Fernández', player2Id: 'p6', player2Name: 'Nicolás Pérez',
    categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros',
    statusId: 'rs1', statusLabel: 'Confirmada', source: 'admin',
    registeredAt: '2026-03-06', confirmedAt: '2026-03-06',
    registrationOpenDate: '2026-02-01', registrationCloseDate: '2026-03-10'
  },
  {
    id: 'r3', tournamentId: 't1', tournamentName: 'Copa Primavera 2026',
    participants: [
      { slotNumber: 1, playerId: 'p10', playerName: 'Tomás Ramírez', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros' },
      { slotNumber: 2, playerId: 'p8', playerName: 'Joaquín Sánchez', categoryId: 'cat3', categoryName: '3ª', genderId: 'g1', genderLabel: 'Caballeros' }
    ],
    player1Id: 'p10', player1Name: 'Tomás Ramírez', player2Id: 'p8', player2Name: 'Joaquín Sánchez',
    categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'Caballeros',
    statusId: 'rs2', statusLabel: 'Pendiente', source: 'wizard',
    registeredAt: '2026-03-07',
    registrationOpenDate: '2026-02-01', registrationCloseDate: '2026-03-10'
  },
  {
    id: 'r4', tournamentId: 't2', tournamentName: 'Master Nocturno',
    participants: [
      { slotNumber: 1, playerId: 'p3', playerName: 'Sofía López', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas' },
      { slotNumber: 2, playerId: 'p4', playerName: 'Valentina Martínez', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas' }
    ],
    player1Id: 'p3', player1Name: 'Sofía López', player2Id: 'p4', player2Name: 'Valentina Martínez',
    categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas',
    statusId: 'rs1', statusLabel: 'Confirmada', source: 'excel',
    registeredAt: '2026-02-20', confirmedAt: '2026-02-20',
    registrationOpenDate: '2026-01-15', registrationCloseDate: '2026-02-25'
  },
  {
    id: 'r5', tournamentId: 't2', tournamentName: 'Master Nocturno',
    participants: [
      { slotNumber: 1, playerId: 'p7', playerName: 'Camila Torres', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas' },
      { slotNumber: 2, playerId: 'p9', playerName: 'María González', categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas' }
    ],
    player1Id: 'p7', player1Name: 'Camila Torres', player2Id: 'p9', player2Name: 'María González',
    categoryId: 'cat2', categoryName: '2ª', genderId: 'g2', genderLabel: 'Damas',
    statusId: 'rs3', statusLabel: 'Rechazada', source: 'wizard',
    registeredAt: '2026-02-22',
    registrationOpenDate: '2026-01-15', registrationCloseDate: '2026-02-25'
  }
];

export const MOCK_REGISTRATION_TOKENS: RegistrationToken[] = [
  { id: 'tk1', tournamentId: 't1', code: '455788', isActive: true, createdBy: 'Admin', assignedTo: null, expiresAt: '2026-04-01', createdAt: '2026-03-01' },
  { id: 'tk2', tournamentId: 't1', code: '391042', isActive: true, createdBy: 'Admin', assignedTo: 'Martín García', expiresAt: '2026-04-01', usedAt: '2026-03-05', createdAt: '2026-03-01' },
  { id: 'tk3', tournamentId: 't1', code: '728156', isActive: false, createdBy: 'Admin', assignedTo: null, expiresAt: '2026-03-15', createdAt: '2026-03-01' },
  { id: 'tk4', tournamentId: 't2', code: '614903', isActive: true, createdBy: 'Admin', assignedTo: 'Sofía López', expiresAt: '2026-03-20', usedAt: '2026-02-20', createdAt: '2026-02-01' },
  { id: 'tk5', tournamentId: 't2', code: '852347', isActive: true, createdBy: 'Admin', assignedTo: null, expiresAt: '2026-03-20', createdAt: '2026-02-01' }
];
