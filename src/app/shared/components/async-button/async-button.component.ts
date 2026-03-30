import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-async-button',
  standalone: true,
  imports: [],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="'async-btn async-btn--' + variant()"
      (click)="handleClick()">
      @if (loading()) {
        <span class="async-btn__spinner" role="status" aria-label="loading"></span>
      }
      <span [class.async-btn__text--hidden]="loading()">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styleUrl: './async-button.component.scss'
})
export class AsyncButtonComponent {
  readonly type = input<'button' | 'submit'>('button');
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly clicked = output<void>();

  handleClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
