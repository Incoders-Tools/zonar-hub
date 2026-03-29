import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-form-shell',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="form-shell">
      @if (titleKey()) {
        <h2 class="form-shell__title">{{ titleKey() | t }}</h2>
      }
      @if (descriptionKey()) {
        <p class="form-shell__description">{{ descriptionKey() | t }}</p>
      }
      <div class="form-shell__content">
        <ng-content></ng-content>
      </div>
      <div class="form-shell__actions">
        <ng-content select="[formActions]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './form-shell.component.scss'
})
export class FormShellComponent {
  readonly titleKey = input('');
  readonly descriptionKey = input('');
}
