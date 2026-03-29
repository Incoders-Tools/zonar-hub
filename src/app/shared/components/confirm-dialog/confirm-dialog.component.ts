import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AsyncButtonComponent } from '../async-button/async-button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslatePipe, AsyncButtonComponent],
  template: `
    <div class="confirm-overlay" (click)="onCancel()" role="dialog" [attr.aria-label]="titleKey() | t">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <h3 class="confirm-dialog__title">{{ titleKey() | t }}</h3>
        <p class="confirm-dialog__message">{{ messageKey() | t }}</p>
        @if (warningKey()) {
          <p class="confirm-dialog__warning">{{ warningKey() | t }}</p>
        }
        <div class="confirm-dialog__actions">
          <button class="confirm-dialog__cancel" (click)="onCancel()">
            {{ 'common.cancel' | t }}
          </button>
          <app-async-button
            [variant]="confirmVariant()"
            [loading]="loading()"
            (clicked)="confirmed.emit()">
            {{ confirmLabelKey() | t }}
          </app-async-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  readonly titleKey = input('confirm.deleteTitle');
  readonly messageKey = input('confirm.deleteMessage');
  readonly warningKey = input('confirm.deleteWarning');
  readonly confirmLabelKey = input('common.confirm');
  readonly confirmVariant = input<'primary' | 'danger'>('danger');
  readonly loading = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onCancel(): void {
    this.cancelled.emit();
  }
}
