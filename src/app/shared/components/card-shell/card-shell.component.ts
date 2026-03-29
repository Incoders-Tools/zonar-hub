import { Component } from '@angular/core';

@Component({
  selector: 'app-card-shell',
  standalone: true,
  template: `
    <div class="card-shell">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card-shell {
      background: var(--zh-surface-elevated);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
      box-shadow: var(--zh-elevation-sm);
      padding: var(--zh-space-lg);
    }
  `]
})
export class CardShellComponent {}
