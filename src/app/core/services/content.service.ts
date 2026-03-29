import { Injectable, signal } from '@angular/core';
import { NewsArticle, HomeSection } from '../models';
import { MOCK_NEWS, MOCK_HOME_SECTIONS } from '../data/mock/mock-content';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly newsState = signal<NewsArticle[]>(MOCK_NEWS);
  private readonly homeSectionsState = signal<HomeSection[]>(MOCK_HOME_SECTIONS);

  readonly news = this.newsState.asReadonly();
  readonly homeSections = this.homeSectionsState.asReadonly();

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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
