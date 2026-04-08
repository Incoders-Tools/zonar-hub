export interface Player {
  id: string;
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
  habitualPartnerId?: string;
  habitualPartnerName?: string;
  ranking?: number;
  photoUrl?: string;
  city?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
