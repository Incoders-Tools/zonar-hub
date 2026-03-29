import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="error-state" role="alert">
      <div class="error-state__icon">⚠️</div>
      <p class="error-state__title">{{ title() | t }}</p>
      <p class="error-state__message">{{ message() | t }}</p>
      <button class="error-state__retry" (click)="retried.emit()">
        {{ 'common.retry' | t }}
      </button>
    </div>
  `,
  styleUrl: './error-state.component.scss'
})
export class ErrorStateComponent {
  readonly title = input('state.error');
  readonly message = input('state.errorMessage');
  readonly retried = output<void>();
}
