/**
 * Represents a tournament status (Registration Open, InProgress, Finished, etc.)
 */
export interface TournamentStatus {
  id: string;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
