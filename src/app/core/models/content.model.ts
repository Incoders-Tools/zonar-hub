export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
  isPublished: boolean;
  authorName: string;
}

export interface HomeSection {
  id: string;
  sectionType: string;
  title: string;
  subtitle?: string;
  sortOrder: number;
  isActive: boolean;
  config?: Record<string, unknown>;
}

export interface FlyerBackground {
  id: string;
  name: string;
  key: string;
  imageUrl: string;
  thumbnailUrl: string;
  category: 'tournament' | 'registration' | 'ranking' | 'general';
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}
