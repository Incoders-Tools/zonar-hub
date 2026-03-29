import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private counter = 0;
  private readonly messagesState = signal<ToastMessage[]>([]);

  readonly messages = this.messagesState.asReadonly();

  success(message: string, duration = 3000): void {
    this.addMessage(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.addMessage(message, 'error', duration);
  }

  warning(message: string, duration = 4000): void {
    this.addMessage(message, 'warning', duration);
  }

  info(message: string, duration = 3000): void {
    this.addMessage(message, 'info', duration);
  }

  dismiss(id: number): void {
    this.messagesState.update(msgs => msgs.filter(m => m.id !== id));
  }

  private addMessage(message: string, type: ToastMessage['type'], duration: number): void {
    const id = ++this.counter;
    this.messagesState.update(msgs => [...msgs, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
