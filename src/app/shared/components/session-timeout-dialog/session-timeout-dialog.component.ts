import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SessionTimeoutService } from '../../../core/auth/session-timeout.service';

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './session-timeout-dialog.component.html',
  styleUrl: './session-timeout-dialog.component.scss'
})
export class SessionTimeoutDialogComponent {
  readonly timeout = inject(SessionTimeoutService);

  readonly formattedCountdown = computed(() => {
    const s = this.timeout.secondsRemaining();
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  readonly isUrgent = computed(() => this.timeout.secondsRemaining() <= 60);
}
