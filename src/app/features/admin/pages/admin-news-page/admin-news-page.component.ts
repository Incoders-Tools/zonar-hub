import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ContentService } from '../../../../core/services/content.service';

@Component({
  selector: 'app-admin-news-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="admin-news">
      <h1>{{ 'admin.news' | t }}</h1>
      @if (contentService.news().length === 0) {
        <div class="empty">{{ 'states.empty' | t }}</div>
      } @else {
        <div class="news-grid">
          @for (article of contentService.news(); track article.id) {
            <div class="news-card">
              <h3>{{ article.title }}</h3>
              <p>{{ article.summary }}</p>
              <span class="news-card__date">{{ article.publishedAt }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xl); }
    .empty { text-align: center; padding: var(--zh-space-2xl); color: var(--zh-text-secondary); }
    .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--zh-space-lg); }
    .news-card {
      padding: var(--zh-space-lg);
      background: var(--zh-surface-card); border: 1px solid var(--zh-border-subtle); border-radius: var(--zh-radius-lg);
    }
    .news-card h3 { margin: 0 0 var(--zh-space-sm); font-weight: 700; }
    .news-card p { margin: 0 0 var(--zh-space-sm); font-size: var(--zh-font-size-sm); color: var(--zh-text-secondary); }
    .news-card__date { font-size: var(--zh-font-size-xs); color: var(--zh-text-secondary); }
  `]
})
export class AdminNewsPageComponent {
  protected readonly contentService = inject(ContentService);
}
