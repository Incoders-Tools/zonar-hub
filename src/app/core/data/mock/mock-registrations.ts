import { Registration } from '../../models';

export const MOCK_REGISTRATIONS: Registration[] = [
  { id: 'r1', tournamentId: 't1', player1Id: 'p1', player1Name: 'Martín García', player2Id: 'p2', player2Name: 'Lucas Rodríguez', categoryId: 'cat1', categoryName: '4ta', genderId: 'g1', genderLabel: 'Masculino', statusId: 'rs1', statusLabel: 'Confirmada', registeredAt: '2026-03-05', confirmedAt: '2026-03-05' },
  { id: 'r2', tournamentId: 't1', player1Id: 'p5', player1Name: 'Diego Fernández', player2Id: 'p6', player2Name: 'Nicolás Pérez', categoryId: 'cat1', categoryName: '4ta', genderId: 'g1', genderLabel: 'Masculino', statusId: 'rs1', statusLabel: 'Confirmada', registeredAt: '2026-03-06', confirmedAt: '2026-03-06' },
  { id: 'r3', tournamentId: 't1', player1Id: 'p10', player1Name: 'Tomás Ramírez', player2Id: 'p8', player2Name: 'Joaquín Sánchez', categoryId: 'cat1', categoryName: '4ta', genderId: 'g1', genderLabel: 'Masculino', statusId: 'rs2', statusLabel: 'Pendiente', registeredAt: '2026-03-07' },
  { id: 'r4', tournamentId: 't2', player1Id: 'p3', player1Name: 'Sofía López', player2Id: 'p4', player2Name: 'Valentina Martínez', categoryId: 'cat2', categoryName: '5ta', genderId: 'g2', genderLabel: 'Femenino', statusId: 'rs1', statusLabel: 'Confirmada', registeredAt: '2026-02-20', confirmedAt: '2026-02-20' },
  { id: 'r5', tournamentId: 't2', player1Id: 'p7', player1Name: 'Camila Torres', player2Id: 'p9', player2Name: 'María González', categoryId: 'cat2', categoryName: '5ta', genderId: 'g2', genderLabel: 'Femenino', statusId: 'rs1', statusLabel: 'Confirmada', registeredAt: '2026-02-22', confirmedAt: '2026-02-22' }
];
