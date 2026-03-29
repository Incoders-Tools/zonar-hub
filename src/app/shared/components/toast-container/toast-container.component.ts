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
      bottom: var(--zh-space-lg);
      right: var(--zh-space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--zh-space-sm);
      z-index: 10000;
      max-width: 400px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: var(--zh-space-sm);
      padding: var(--zh-space-sm) var(--zh-space-md);
      border-radius: var(--zh-radius-md);
      box-shadow: var(--zh-elevation-md);
      font-size: var(--zh-font-size-sm);
      animation: slideIn 0.2s ease;
    }
    .toast[data-type='success'] { background: var(--zh-success); color: var(--zh-on-success); }
    .toast[data-type='error'] { background: var(--zh-danger); color: var(--zh-on-danger); }
    .toast[data-type='warning'] { background: var(--zh-warning); color: var(--zh-on-warning); }
    .toast[data-type='info'] { background: var(--zh-info); color: var(--zh-on-info); }
    .toast__dismiss {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 2px;
      font-size: var(--zh-font-size-md);
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  protected readonly notifications = inject(NotificationService);
}
