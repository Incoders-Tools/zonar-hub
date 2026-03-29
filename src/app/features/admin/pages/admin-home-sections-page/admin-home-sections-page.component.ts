import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ContentService } from '../../../../core/services/content.service';

@Component({
  selector: 'app-admin-home-sections-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="admin-sections">
      <h1>{{ 'admin.homeSections' | t }}</h1>
      @if (contentService.homeSections().length === 0) {
        <div class="empty">{{ 'states.empty' | t }}</div>
      } @else {
        <div class="sections-list">
          @for (section of contentService.homeSections(); track section.id) {
            <div class="section-card">
              <span class="section-card__order">#{{ section.sortOrder }}</span>
              <div class="section-card__info">
                <h3>{{ section.title }}</h3>
                <span class="section-card__type">{{ section.sectionType }}</span>
              </div>
              <span class="section-card__active" [class.active]="section.isActive">
                {{ section.isActive ? '●' : '○' }}
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xl); }
    .empty { text-align: center; padding: var(--zh-space-2xl); color: var(--zh-text-secondary); }
    .sections-list { display: flex; flex-direction: column; gap: var(--zh-space-sm); }
    .section-card {
      display: flex; align-items: center; gap: var(--zh-space-md);
      padding: var(--zh-space-md) var(--zh-space-lg);
      background: var(--zh-surface-card); border: 1px solid var(--zh-border-subtle); border-radius: var(--zh-radius-md);
    }
    .section-card__order { font-weight: 800; color: var(--zh-primary); min-width: 32px; }
    .section-card__info { flex: 1; }
    .section-card__info h3 { margin: 0; font-size: var(--zh-font-size-sm); font-weight: 600; }
    .section-card__type { font-size: var(--zh-font-size-xs); color: var(--zh-text-secondary); }
    .section-card__active { font-size: var(--zh-font-size-lg); color: var(--zh-text-secondary); }
    .section-card__active.active { color: var(--zh-success); }
  `]
})
export class AdminHomeSectionsPageComponent {
  protected readonly contentService = inject(ContentService);
}
