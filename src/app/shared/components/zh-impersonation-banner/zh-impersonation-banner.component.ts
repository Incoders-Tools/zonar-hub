import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  OnInit,
  OnDestroy,
  HostBinding
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Persistent impersonation banner.
 * Design reference: §5.6, REQ-IMP-014 – REQ-IMP-018.
 *
 * Standalone, OnPush. Mounted once in the admin layout via @if (imp.active()).
 * All colours are resolved via CSS custom properties (--banner-impersonation-*).
 * Token defaults live in _tokens.scss; per-theme overrides in _themes.scss.
 */
@Component({
  selector: 'zh-impersonation-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './zh-impersonation-banner.component.html',
  styleUrl: './zh-impersonation-banner.component.scss'
})
export class ZhImpersonationBannerComponent implements OnInit, OnDestroy {
  // ---- Inputs ----
  readonly targetName  = input.required<string>();
  readonly targetEmail = input<string>('');
  readonly tenantName  = input<string>('');
  /** ISO-8601 expiry timestamp. */
  readonly expiresAt   = input.required<string>();

  // ---- Outputs ----
  readonly exit = output<void>();

  // ---- Accessibility ----
  @HostBinding('attr.aria-live') readonly ariaLive = 'polite';
  @HostBinding('attr.role') readonly role = 'status';

  // ---- Countdown ----
  private intervalId: ReturnType<typeof setInterval> | null = null;
  readonly remainingMs = signal<number>(0);

  readonly countdownLabel = computed(() => {
    const ms = this.remainingMs();
    if (ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  ngOnInit(): void {
    this.updateRemaining();
    this.intervalId = setInterval(() => this.updateRemaining(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  private updateRemaining(): void {
    const exp = new Date(this.expiresAt()).getTime();
    const remaining = exp - Date.now();
    this.remainingMs.set(remaining > 0 ? remaining : 0);
  }

  onExit(): void {
    this.exit.emit();
  }
}
