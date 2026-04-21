import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (msg of notifications.messages(); track msg.id) {
        <div class="toast" [attr.data-type]="msg.type" role="alert">
          <span class="toast__icon">
            @switch (msg.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @case ('info') { ℹ }
            }
          </span>
          <span class="toast__text">{{ msg.message | t }}</span>
          <button class="toast__dismiss" (click)="notifications.dismiss(msg.id)" [attr.aria-label]="'common.close' | t">
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: var(--zh-space-lg);
      right: var(--zh-space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--zh-space-sm);
      z-index: 10000;
      max-width: 420px;
      min-width: 320px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: var(--zh-space-md);
      padding: var(--zh-space-md) var(--zh-space-lg);
      border-radius: var(--zh-radius-lg);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      font-size: var(--zh-font-size-sm);
      font-weight: 500;
      backdrop-filter: blur(12px);
      animation: toastSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .toast[data-type='success'] {
      background: linear-gradient(135deg, var(--zh-success), color-mix(in srgb, var(--zh-success) 85%, black));
      color: var(--zh-on-success);
    }
    .toast[data-type='error'] {
      background: linear-gradient(135deg, var(--zh-danger), color-mix(in srgb, var(--zh-danger) 85%, black));
      color: var(--zh-on-danger);
    }
    .toast[data-type='warning'] {
      background: linear-gradient(135deg, var(--zh-warning), color-mix(in srgb, var(--zh-warning) 85%, black));
      color: var(--zh-on-warning);
    }
    .toast[data-type='info'] {
      background: linear-gradient(135deg, var(--zh-info), color-mix(in srgb, var(--zh-info) 85%, black));
      color: var(--zh-on-info);
    }
    .toast__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      font-size: 14px;
      flex-shrink: 0;
    }
    .toast__text {
      flex: 1;
      line-height: 1.4;
    }
    .toast__dismiss {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px 6px;
      font-size: 12px;
      border-radius: var(--zh-radius-sm);
      transition: background 0.15s ease;
      flex-shrink: 0;
    }
    .toast__dismiss:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    @keyframes toastSlideIn {
      from { transform: translateX(100%) scale(0.95); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  protected readonly notifications = inject(NotificationService);
}
