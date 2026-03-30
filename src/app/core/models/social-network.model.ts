/**
 * Represents a social network (Facebook, Instagram, Twitter, etc.)
 */
export interface SocialNetwork {
  id: string;
  name: string;
  key: string;
  url: string | null;
  description: string | null;
  faIcon: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
