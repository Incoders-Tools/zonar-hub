import { Injectable, signal } from '@angular/core';
import { SecurityAttemptGuard } from '../models';

@Injectable({ providedIn: 'root' })
export class CaptchaService {
  private readonly verifiedState = signal(false);
  readonly isVerified = this.verifiedState.asReadonly();

  async verify(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    this.verifiedState.set(true);
    return true;
  }

  reset(): void {
    this.verifiedState.set(false);
  }
}

@Injectable({ providedIn: 'root' })
export class AttemptGuardService {
  private attempts = new Map<string, number>();
  private readonly maxAttempts = 5;

  isBlocked(identifier: string): boolean {
    return (this.attempts.get(identifier) ?? 0) >= this.maxAttempts;
  }

  recordAttempt(identifier: string): void {
    const current = this.attempts.get(identifier) ?? 0;
    this.attempts.set(identifier, current + 1);
  }

  getRemainingAttempts(identifier: string): number {
    return Math.max(0, this.maxAttempts - (this.attempts.get(identifier) ?? 0));
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}
