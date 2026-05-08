import { Injectable, signal } from '@angular/core';
import { NewsArticle, HomeSection, FlyerBackground } from '../models';
const MOCK_NEWS: NewsArticle[] = [];
const MOCK_HOME_SECTIONS: HomeSection[] = [];

/**
 * Generate a simple SVG placeholder for flyer backgrounds.
 * Each background gets a unique gradient based on its color stops.
 */
function svgPlaceholder(color1: string, color2: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient></defs>
    <rect width="1080" height="1080" fill="url(#g)"/>
    <text x="540" y="540" text-anchor="middle" dominant-baseline="middle"
      font-family="sans-serif" font-size="48" fill="rgba(255,255,255,0.3)">${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const MOCK_FLYER_BACKGROUNDS: FlyerBackground[] = [
  { id: 'fb-1', name: 'Court Sunset', key: 'court_sunset', imageUrl: svgPlaceholder('#c2410c', '#ea580c', 'Court Sunset'), thumbnailUrl: svgPlaceholder('#c2410c', '#ea580c', ''), category: 'tournament', isActive: true, sortOrder: 1, createdAt: '2025-01-10' },
  { id: 'fb-2', name: 'Neon Arena', key: 'neon_arena', imageUrl: svgPlaceholder('#6d28d9', '#8b5cf6', 'Neon Arena'), thumbnailUrl: svgPlaceholder('#6d28d9', '#8b5cf6', ''), category: 'tournament', isActive: true, sortOrder: 2, createdAt: '2025-01-12' },
  { id: 'fb-3', name: 'Blue Gradient', key: 'blue_gradient', imageUrl: svgPlaceholder('#1e40af', '#3b82f6', 'Blue Gradient'), thumbnailUrl: svgPlaceholder('#1e40af', '#3b82f6', ''), category: 'general', isActive: true, sortOrder: 3, createdAt: '2025-01-15' },
  { id: 'fb-4', name: 'Registration Green', key: 'registration_green', imageUrl: svgPlaceholder('#166534', '#22c55e', 'Reg Green'), thumbnailUrl: svgPlaceholder('#166534', '#22c55e', ''), category: 'registration', isActive: false, sortOrder: 4, createdAt: '2025-02-01' },
  { id: 'fb-5', name: 'Ranking Gold', key: 'ranking_gold', imageUrl: svgPlaceholder('#92400e', '#f59e0b', 'Ranking Gold'), thumbnailUrl: svgPlaceholder('#92400e', '#f59e0b', ''), category: 'ranking', isActive: true, sortOrder: 5, createdAt: '2025-02-10' }
];

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly newsState = signal<NewsArticle[]>(MOCK_NEWS);
  private readonly homeSectionsState = signal<HomeSection[]>(MOCK_HOME_SECTIONS);
  private readonly flyerBackgroundsState = signal<FlyerBackground[]>(MOCK_FLYER_BACKGROUNDS);

  readonly news = this.newsState.asReadonly();
  readonly homeSections = this.homeSectionsState.asReadonly();
  readonly flyerBackgrounds = this.flyerBackgroundsState.asReadonly();

  readonly activeHomeSections = () =>
    this.homeSectionsState()
      .filter(s => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  readonly publishedNews = () =>
    this.newsState().filter(n => n.isPublished);

  async saveNews(article: Partial<NewsArticle>): Promise<NewsArticle> {
    await this.delay(600);
    const existing = this.newsState().find(n => n.id === article.id);
    if (existing) {
      const updated = { ...existing, ...article };
      this.newsState.update(items => items.map(n => n.id === updated.id ? updated : n));
      return updated;
    }
    const created: NewsArticle = {
      ...article as NewsArticle,
      id: 'n-' + Date.now(),
      publishedAt: new Date().toISOString()
    };
    this.newsState.update(items => [...items, created]);
    return created;
  }

  async saveHomeSection(section: Partial<HomeSection>): Promise<HomeSection> {
    await this.delay(400);
    const existing = this.homeSectionsState().find(s => s.id === section.id);
    if (existing) {
      const updated = { ...existing, ...section };
      this.homeSectionsState.update(items => items.map(s => s.id === updated.id ? updated : s));
      return updated;
    }
    const created: HomeSection = { ...section as HomeSection, id: 'hs-' + Date.now() };
    this.homeSectionsState.update(items => [...items, created]);
    return created;
  }

  readonly activeFlyerBackgrounds = () =>
    this.flyerBackgroundsState().filter(f => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  flyerBackgroundsByCategory(category: string): FlyerBackground[] {
    return this.flyerBackgroundsState().filter(f => f.isActive && f.category === category);
  }

  async saveFlyerBackground(bg: Partial<FlyerBackground>): Promise<FlyerBackground> {
    await this.delay(500);
    const existing = this.flyerBackgroundsState().find(f => f.id === bg.id);
    if (existing) {
      const updated = { ...existing, ...bg };
      this.flyerBackgroundsState.update(items => items.map(f => f.id === updated.id ? updated : f));
      return updated;
    }
    const created: FlyerBackground = {
      ...bg as FlyerBackground,
      id: 'fb-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    this.flyerBackgroundsState.update(items => [...items, created]);
    return created;
  }

  async deleteFlyerBackground(id: string): Promise<void> {
    await this.delay(400);
    this.flyerBackgroundsState.update(items => items.filter(f => f.id !== id));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
