/**
 * Represents a tournament status (Registration Open, In Progress, Finished, etc.)
 *
 * Stored as a multilingual catalog row: every language has its own name +
 * description column. The convenience `name` / `description` fields hold the
 * value resolved for the active locale and are populated client-side.
 */
export interface TournamentStatus {
  id: string;
  key: string;
  /** Localized name resolved for the user's active locale */
  name: string;
  /** Localized description resolved for the user's active locale */
  description: string | null;
  nameEs: string;
  nameEn: string;
  namePt: string;
  descriptionEs: string | null;
  descriptionEn: string | null;
  descriptionPt: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
