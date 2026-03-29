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
