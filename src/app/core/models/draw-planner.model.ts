export interface DrawPlannerInput {
  tournamentId: string;
  registrationCount: number;
  confirmedPairsCount: number;
  availabilityCoverage: number;
  tournamentType: string;
  category: string;
  gender: string;
  targetGroupSize: number;
  autoManualMix: 'auto' | 'manual' | 'mixed';
  seedingStrategy: 'ranking' | 'random' | 'manual';
  availabilityStrategy: 'strict' | 'best-effort';
}

export interface ZoneGroup {
  id: string;
  zoneName: string;
  groupIndex: number;
  pairs: ZoneGroupAssignment[];
  suggestedDay?: string;
  suggestedTime?: string;
  courtName?: string;
}

export interface ZoneGroupAssignment {
  registrationId: string;
  player1Name: string;
  player2Name: string;
  seedPosition?: number;
  availabilityScore: number;
}

export interface PlannerWarning {
  type: 'availability-conflict' | 'uneven-groups' | 'missing-data' | 'seeding-gap';
  message: string;
  affectedPairs?: string[];
}

export interface DrawPlannerResult {
  tournamentId: string;
  zones: ZoneGroup[];
  warnings: PlannerWarning[];
  totalPairs: number;
  unassignedPairs: ZoneGroupAssignment[];
  generatedAt: string;
  status: 'draft' | 'published';
}

export interface TournamentZonePlan {
  id: string;
  tournamentId: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  publishedAt?: string;
}
