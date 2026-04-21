// ============================================================
// Zonar Hub — Team Domain Model
// ============================================================

export interface TeamMember {
  playerId: string;
  playerName: string;
  sortOrder?: number;
}

export interface Team {
  id: string;
  organizationId?: string;
  name: string;
  sportId: string;
  sportName: string;
  categoryId?: string;
  categoryName?: string;
  players: TeamMember[];
  captainId?: string;
  captainName?: string;
  logoUrl?: string;
  observations?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
