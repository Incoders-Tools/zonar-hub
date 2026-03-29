import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-admin-sponsors-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="admin-page-shell">
      <h1>{{ 'admin.sponsors' | t }}</h1>
      <div class="placeholder">{{ 'states.comingSoon' | t }}</div>
    </div>
  `,
  styles: [`
    h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xl); }
    .placeholder { text-align: center; padding: var(--zh-space-2xl); color: var(--zh-text-secondary); background: var(--zh-surface-card); border: 1px solid var(--zh-border-subtle); border-radius: var(--zh-radius-lg); }
  `]
})
export class AdminSponsorsPageComponent {}
