export interface PlayerSportAssignment {
  sportId: string;
  sportName: string;
  sortOrder: number;
}

/**
 * Organization player (S3). The API stores email, gender and category as optional; they are mapped to `''` when
 * missing, and the eligibility rules treat an empty value as missing data (D3, L8).
 */
export interface Player {
  id: string;
  organizationId?: string;
  organizationName?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentId?: string;
  birthDate?: string;
  categoryId: string;
  categoryName: string;
  genderId: string;
  genderLabel: string;
  sportId?: string;
  sportName?: string;
  sports?: PlayerSportAssignment[];
  habitualPartnerId?: string;
  habitualPartnerName?: string;
  ranking?: number;
  photoUrl?: string;
  city?: string;
  /** Club of the player; the draw separation key of its pairs (D5). */
  club?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
