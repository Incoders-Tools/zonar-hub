import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="empty-state" role="status">
      <div class="empty-state__icon">📭</div>
      <p class="empty-state__message">{{ message() | t }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  readonly message = input('state.empty');
}
