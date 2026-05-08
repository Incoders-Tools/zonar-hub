export interface TournamentRule {
  id: string;
  name: string;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
