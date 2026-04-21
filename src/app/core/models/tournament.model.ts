// ============================================================
// Zonar Hub — Domain Models
// ============================================================

export interface Tournament {
  id: string;
  organizationId?: string;
  organizationName?: string;
  name: string;
  complexId: string;
  complexName: string;
  categoryId: string;
  categoryName: string;
  genderId: string;
  genderLabel: string;
  tournamentTypeId: string;
  tournamentTypeName: string;
  sportId: string;
  sportName: string;
  modalityId?: string;
  modalityName?: string;
  eligibilityProfileId?: string;
  eligibilityProfileName?: string;
  ruleSetId?: string;
  ruleSetDescription?: string;
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
  key?: string;
  registrationFeePerPair?: number;
  prizeMoney?: number;
  pointsToAward?: number;
  sumValue?: number;
  coverImageUrl?: string;
  observations?: string;
  updatedAt?: string;
  isActive?: boolean;
  selectedCourtIds?: string[];
}

export interface TournamentSlot {
  id: string;
  tournamentId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courtId?: string;
}
