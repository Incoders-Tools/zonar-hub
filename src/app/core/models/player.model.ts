export interface Player {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  categoryId: string;
  categoryName: string;
  genderId: string;
  genderLabel: string;
  ranking?: number;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
}
