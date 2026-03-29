export interface BracketPair {
  id: string;
  player1: string;
  player2: string;
  seed?: number;
}

export interface BracketMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  pair1: BracketPair | null;
  pair2: BracketPair | null;
  score1: string[];
  score2: string[];
  winnerId: string | null;
  courtName?: string;
  scheduledAt?: string;
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

export interface TournamentBracket {
  tournamentId: string;
  categoryName: string;
  genderLabel: string;
  rounds: BracketRound[];
}
