// ============================================================
// Zonar Hub — Domain Models
// ============================================================

export interface Tournament {
  id: string;
  name: string;
  complexId: string;
  complexName: string;
  categoryId: string;
  categoryName: string;
  genderId: string;
  genderLabel: string;
  tournamentTypeId: string;
  tournamentTypeName: string;
  statusId: string;
  statusLabel: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxPairs: number;
  description: string;
  rules: string;
  imageUrl?: string;
  createdAt: string;
}

export interface TournamentSlot {
  id: string;
  tournamentId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courtId?: string;
}

export interface TournamentEligibilityProfile {
  id: string;
  tournamentId: string;
  categoryId: string;
  genderId: string;
  minRanking?: number;
  maxRanking?: number;
}
