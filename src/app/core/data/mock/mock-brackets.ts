import { TournamentBracket } from '../../models';

export const MOCK_BRACKETS: TournamentBracket[] = [
  {
    tournamentId: 't1',
    categoryName: '1ª',
    genderLabel: 'Caballeros',
    rounds: [
      {
        name: 'bracket.round.quarterfinals',
        matches: [
          {
            id: 'bm1', roundIndex: 0, matchIndex: 0,
            pair1: { id: 'bp1', player1: 'M. García', player2: 'L. Rodríguez', seed: 1 },
            pair2: { id: 'bp2', player1: 'A. Méndez', player2: 'F. Herrera' },
            score1: ['6', '6'], score2: ['3', '4'], winnerId: 'bp1'
          },
          {
            id: 'bm2', roundIndex: 0, matchIndex: 1,
            pair1: { id: 'bp3', player1: 'D. Fernández', player2: 'N. Pérez', seed: 4 },
            pair2: { id: 'bp4', player1: 'R. Castillo', player2: 'P. Navarro' },
            score1: ['7', '4', '6'], score2: ['5', '6', '3'], winnerId: 'bp3'
          },
          {
            id: 'bm3', roundIndex: 0, matchIndex: 2,
            pair1: { id: 'bp5', player1: 'T. Ramírez', player2: 'J. Sánchez', seed: 3 },
            pair2: { id: 'bp6', player1: 'E. Villar', player2: 'C. Romero' },
            score1: ['6', '6'], score2: ['2', '1'], winnerId: 'bp5'
          },
          {
            id: 'bm4', roundIndex: 0, matchIndex: 3,
            pair1: { id: 'bp7', player1: 'H. Morales', player2: 'S. Díaz' },
            pair2: { id: 'bp8', player1: 'G. Reyes', player2: 'I. Torres', seed: 2 },
            score1: ['3', '6', '7'], score2: ['6', '3', '5'], winnerId: 'bp7'
          }
        ]
      },
      {
        name: 'bracket.round.semifinals',
        matches: [
          {
            id: 'bm5', roundIndex: 1, matchIndex: 0,
            pair1: { id: 'bp1', player1: 'M. García', player2: 'L. Rodríguez', seed: 1 },
            pair2: { id: 'bp3', player1: 'D. Fernández', player2: 'N. Pérez', seed: 4 },
            score1: ['6', '7'], score2: ['4', '5'], winnerId: 'bp1'
          },
          {
            id: 'bm6', roundIndex: 1, matchIndex: 1,
            pair1: { id: 'bp5', player1: 'T. Ramírez', player2: 'J. Sánchez', seed: 3 },
            pair2: { id: 'bp7', player1: 'H. Morales', player2: 'S. Díaz' },
            score1: ['6', '3', '4'], score2: ['4', '6', '6'], winnerId: 'bp7'
          }
        ]
      },
      {
        name: 'bracket.round.final',
        matches: [
          {
            id: 'bm7', roundIndex: 2, matchIndex: 0,
            pair1: { id: 'bp1', player1: 'M. García', player2: 'L. Rodríguez', seed: 1 },
            pair2: { id: 'bp7', player1: 'H. Morales', player2: 'S. Díaz' },
            score1: ['6', '7'], score2: ['3', '5'], winnerId: 'bp1'
          }
        ]
      }
    ]
  }
];
