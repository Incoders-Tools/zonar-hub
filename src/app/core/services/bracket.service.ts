import { Injectable } from '@angular/core';
import { TournamentBracket } from '../models';

/**
 * Bracket service. Brackets are computed/persisted server-side; until that
 * surface ships the FE returns null so callers render an empty bracket
 * placeholder instead of a fake fixture.
 */
@Injectable({ providedIn: 'root' })
export class BracketService {
  getBracketByTournament(_tournamentId: string): TournamentBracket | null {
    return null;
  }
}
