import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ImpersonationService } from '../impersonation/impersonation.service';

/**
 * Inactivity-based session timeout. After a configurable idle window the
 * service raises a warning dialog with a countdown. Any explicit "continue"
 * action resets idle tracking; passive activity during the warning is
 * intentionally ignored so the user has to confirm presence.
 */

const IDLE_BEFORE_WARNING_MS = 25 * 60 * 1000;
const WARNING_DURATION_MS = 5 * 60 * 1000;
const TICK_INTERVAL_MS = 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'mousemove', 'wheel', 'touchstart', 'scroll'] as const;

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly imp = inject(ImpersonationService);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastActivity = Date.now();
  private warningStartedAt: number | null = null;
  /** Track whether we already fired the impersonation expiry for the current session. */
  private impExpiryFired = false;

  private readonly warningActiveState = signal(false);
  readonly secondsRemaining = signal<number>(0);
  readonly showWarning = computed(() => this.warningActiveState());

  private readonly activityHandler = (): void => this.recordActivity();

  startMonitoring(): void {
    this.stopMonitoring();
    this.lastActivity = Date.now();
    this.warningStartedAt = null;
    this.impExpiryFired = false;
    this.warningActiveState.set(false);
    this.secondsRemaining.set(0);
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, this.activityHandler, { passive: true });
    }
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  stopMonitoring(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, this.activityHandler);
    }
    this.warningStartedAt = null;
    this.warningActiveState.set(false);
    this.secondsRemaining.set(0);
  }

  /** Explicit user action: dismiss the warning and resume the idle window. */
  continueSession(): void {
    this.lastActivity = Date.now();
    this.warningStartedAt = null;
    this.warningActiveState.set(false);
    this.secondsRemaining.set(0);
  }

  logout(): void {
    this.stopMonitoring();
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  private recordActivity(): void {
    if (this.warningStartedAt !== null) {
      // Ignore passive activity while the warning is showing — require an
      // explicit "Continuar sesión" click so the user is aware of the prompt.
      return;
    }
    this.lastActivity = Date.now();
  }

  private tick(): void {
    if (!this.auth.session()) {
      this.warningActiveState.set(false);
      this.secondsRemaining.set(0);
      return;
    }

    // --- Impersonation expiry check (absolute clock, design §6.3 / ADR-005) ---
    if (this.imp.active() && !this.impExpiryFired) {
      const expiresAt = this.imp.expiresAt();
      if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
        this.impExpiryFired = true;
        this.imp.forceStop();
        void this.router.navigate(['/admin']);
        return; // Do NOT proceed to real-session idle check this tick
      }
    }
    // Reset fire-guard if impersonation ended (e.g. user manually stopped it)
    if (!this.imp.active()) {
      this.impExpiryFired = false;
    }

    const now = Date.now();

    if (this.warningStartedAt === null) {
      const idleMs = now - this.lastActivity;
      if (idleMs >= IDLE_BEFORE_WARNING_MS) {
        this.warningStartedAt = now;
        this.warningActiveState.set(true);
        this.secondsRemaining.set(Math.floor(WARNING_DURATION_MS / 1000));
      }
      return;
    }

    const elapsedSinceWarning = now - this.warningStartedAt;
    const remainingMs = WARNING_DURATION_MS - elapsedSinceWarning;
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    this.secondsRemaining.set(remainingSeconds);

    if (remainingMs <= 0) {
      this.logout();
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}
