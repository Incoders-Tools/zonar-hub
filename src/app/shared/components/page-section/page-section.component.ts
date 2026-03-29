import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-page-section',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="page-section">
      @if (titleKey()) {
        <div class="page-section__header">
          <h2 class="page-section__title">{{ titleKey() | t }}</h2>
          @if (subtitleKey()) {
            <p class="page-section__subtitle">{{ subtitleKey() | t }}</p>
          }
        </div>
      }
      <div class="page-section__content">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [`
    .page-section {
      padding-block: var(--zh-space-xl);
    }
    .page-section__header {
      margin-bottom: var(--zh-space-lg);
    }
    .page-section__title {
      font-size: var(--zh-font-size-2xl);
      font-weight: 700;
      color: var(--zh-text-primary);
    }
    .page-section__subtitle {
      margin-top: var(--zh-space-xs);
      color: var(--zh-text-secondary);
    }
  `]
})
export class PageSectionComponent {
  readonly titleKey = input('');
  readonly subtitleKey = input('');
}
