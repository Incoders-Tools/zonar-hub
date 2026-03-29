import { DrawPlannerResult, ZoneGroup } from '../../models';

export const MOCK_DRAW_RESULT: DrawPlannerResult = {
  tournamentId: 't1',
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
