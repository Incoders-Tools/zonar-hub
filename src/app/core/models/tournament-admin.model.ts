export interface TournamentType {
  id: string;
  name: string;
  key: string;
  sportId: string;
  sportName?: string;
  sortOrder: number | null;
  scoresPoints: boolean;
  appliesGender: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentEligibilityProfile {
  id: string;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  slots?: TournamentEligibilitySlot[];
}

export interface TournamentEligibilitySlot {
  id?: string;
  profileId?: string;
  slotNumber: number;
  genderId: string | null;
  genderName?: string;
  categoryId: string | null;
  categoryName?: string;
  minAge: number | null;
  maxAge: number | null;
  label: string | null;
  required: boolean;
}
