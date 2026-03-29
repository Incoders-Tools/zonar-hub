import { Injectable } from '@angular/core';
import { TournamentBracket } from '../models';
import { MOCK_BRACKETS } from '../data/mock/mock-brackets';

@Injectable({ providedIn: 'root' })
export class BracketService {
  getBracketByTournament(tournamentId: string): TournamentBracket | null {
    return MOCK_BRACKETS.find(b => b.tournamentId === tournamentId) ?? null;
  }
}
