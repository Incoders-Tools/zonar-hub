import { Injectable, signal } from '@angular/core';
import { NewsArticle, HomeSection, FlyerBackground } from '../models';
import { MOCK_NEWS, MOCK_HOME_SECTIONS } from '../data/mock/mock-content';

const MOCK_FLYER_BACKGROUNDS: FlyerBackground[] = [
  { id: 'fb-1', name: 'Court Sunset', key: 'court_sunset', imageUrl: '/assets/flyers/court-sunset.png', thumbnailUrl: '/assets/flyers/court-sunset-thumb.png', category: 'tournament', isActive: true, sortOrder: 1, createdAt: '2025-01-10' },
  { id: 'fb-2', name: 'Neon Arena', key: 'neon_arena', imageUrl: '/assets/flyers/neon-arena.png', thumbnailUrl: '/assets/flyers/neon-arena-thumb.png', category: 'tournament', isActive: true, sortOrder: 2, createdAt: '2025-01-12' },
  { id: 'fb-3', name: 'Blue Gradient', key: 'blue_gradient', imageUrl: '/assets/flyers/blue-gradient.png', thumbnailUrl: '/assets/flyers/blue-gradient-thumb.png', category: 'general', isActive: true, sortOrder: 3, createdAt: '2025-01-15' },
  { id: 'fb-4', name: 'Registration Green', key: 'registration_green', imageUrl: '/assets/flyers/reg-green.png', thumbnailUrl: '/assets/flyers/reg-green-thumb.png', category: 'registration', isActive: false, sortOrder: 4, createdAt: '2025-02-01' },
  { id: 'fb-5', name: 'Ranking Gold', key: 'ranking_gold', imageUrl: '/assets/flyers/ranking-gold.png', thumbnailUrl: '/assets/flyers/ranking-gold-thumb.png', category: 'ranking', isActive: true, sortOrder: 5, createdAt: '2025-02-10' }
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
