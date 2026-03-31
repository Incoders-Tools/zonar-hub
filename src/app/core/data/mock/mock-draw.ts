import { DrawPlannerResult } from '../../models';

export const MOCK_DRAW_RESULT: DrawPlannerResult = {
  id: 'dp-mock-1',
  name: 'Draw Apertura 2026',
  tournamentId: 't1',
  tournamentName: 'Apertura 2026 - 4ta',
  totalPairs: 4,
  status: 'draft',
  generatedAt: '2026-03-28T10:00:00Z',
  warnings: [
    { type: 'availability-conflict', message: 'La pareja Ramírez/Sánchez tiene baja disponibilidad horaria.' }
  ],
  unassignedPairs: [],
  zones: [
    {
      id: 'zg1',
      zoneName: 'Zona A',
      groupIndex: 0,
      suggestedDay: '2026-04-15',
      suggestedTime: '18:00',
      courtName: 'Cancha 1',
      pairs: [
        { registrationId: 'r1', player1Name: 'Martín García', player2Name: 'Lucas Rodríguez', seedPosition: 1, availabilityScore: 0.9 },
        { registrationId: 'r3', player1Name: 'Tomás Ramírez', player2Name: 'Joaquín Sánchez', seedPosition: 4, availabilityScore: 0.5 }
      ]
    },
    {
      id: 'zg2',
      zoneName: 'Zona B',
      groupIndex: 1,
      suggestedDay: '2026-04-15',
      suggestedTime: '20:00',
      courtName: 'Cancha 2',
      pairs: [
        { registrationId: 'r2', player1Name: 'Diego Fernández', player2Name: 'Nicolás Pérez', seedPosition: 2, availabilityScore: 0.85 }
      ]
    }
  ]
};

export const MOCK_SAVED_DRAWS: DrawPlannerResult[] = [
  {
    id: 'dp-saved-1',
    name: 'Draw A - Apertura 2026',
    tournamentId: 't1',
    tournamentName: 'Apertura 2026 - 4ta',
    zones: [],
    warnings: [],
    totalPairs: 16,
    unassignedPairs: [],
    generatedAt: '2026-03-25T14:00:00Z',
    status: 'draft'
  },
  {
    id: 'dp-saved-2',
    name: 'Draw B - Copa Primavera',
    tournamentId: 't2',
    tournamentName: 'Copa Primavera - 5ta',
    zones: [],
    warnings: [],
    totalPairs: 8,
    unassignedPairs: [],
    generatedAt: '2026-03-20T10:00:00Z',
    status: 'active'
  },
  {
    id: 'dp-saved-3',
    name: 'Draw C - Liga Invierno',
    tournamentId: 't3',
    tournamentName: 'Liga Invierno 2025',
    zones: [],
    warnings: [],
    totalPairs: 12,
    unassignedPairs: [],
    generatedAt: '2025-12-01T09:00:00Z',
    status: 'finished'
  }
];
