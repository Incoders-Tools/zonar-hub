import { Injectable, computed, signal } from '@angular/core';
import { ImpersonationHealthResponse, ImpersonationSession, StartImpersonationRequest, StartImpersonationResponse } from './impersonation.model';
import { ImpersonationRepository } from './impersonation.repository';

/** sessionStorage key for the persisted impersonation session. */
const SESSION_KEY = 'zh_impersonation_session';

/**
 * Core service managing the impersonation session lifecycle.
 * Design reference: §5.2, §5.5.
 *
 * The service receives its repository dependency via setRepository() rather
 * than constructor injection. This breaks the compile-time dependency that
 * would otherwise make AuthService → ImpersonationService → ApiImpersonationRepository
 * appear as a circular reference when AuthService is also bootstrapped.
 *
 * In production, APP_INITIALIZER or the interceptor's first call to ImpersonationService
 * triggers wiring via the ApiImpersonationRepository provider in the root injector.
 * ApiImpersonationRepository itself calls setRepository() in its constructor.
 *
 * Signal API (all readonly outside this service):
 *   session   — full session or null when not impersonating
 *   active    — true when session is non-null
 *   target    — target user identity or null
 *   expiresAt — ISO expiry string or null
 */
@Injectable({ providedIn: 'root' })
export class ImpersonationService {
  private repoInstance: ImpersonationRepository | null = null;

  /**
   * Wire the repository. Called by ApiImpersonationRepository constructor
   * and by test specs via makeRepoStub().
   */
  setRepository(repo: ImpersonationRepository): void {
    this.repoInstance = repo;
  }

  private resolveRepo(): ImpersonationRepository | null {
    return this.repoInstance;
  }

  // ---------------------------------------------------------------------------
  // Signals
  // ---------------------------------------------------------------------------

  private readonly sessionSignal = signal<ImpersonationSession | null>(null);

  readonly session = this.sessionSignal.asReadonly();
  readonly active = computed(() => this.sessionSignal() !== null);
  readonly target = computed(() => this.sessionSignal()?.target ?? null);
  readonly expiresAt = computed(() => this.sessionSignal()?.expiresAt ?? null);

  constructor() {
    this.rehydrate();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Starts an impersonation session.
   * Calls repository.start(), stores the returned session in-memory and sessionStorage.
   */
  async start(targetUserId: string, reason?: string): Promise<void> {
    const repo = this.resolveRepo();
    if (!repo) {
      throw new Error('ImpersonationRepository not injected');
    }
    const request: StartImpersonationRequest = { userId: targetUserId, reason };
    const response: StartImpersonationResponse = await repo.start(request);
    const session: ImpersonationSession = {
      token: response.token,
      expiresAt: response.expiresAt,
      sessionId: response.sessionId,
      target: response.target
    };
    this.setSession(session);
  }

  /**
   * Stops the current session by calling the API.
   * Clears the session even if the API call fails.
   */
  async stop(): Promise<void> {
    try {
      const repo = this.resolveRepo();
      if (repo) {
        await repo.stop();
      }
    } catch {
      // Best-effort stop: always clear the local session regardless of API failure
    } finally {
      this.clearSession();
    }
  }

  /**
   * Immediately clears the session without calling the API.
   * Used by the interceptor on 401 responses under impersonation.
   */
  forceStop(): void {
    this.clearSession();
  }

  /**
   * Returns the current impersonation token or null.
   * Used by authTokenInterceptor to select which bearer to attach.
   */
  token(): string | null {
    return this.sessionSignal()?.token ?? null;
  }

  /**
   * Fetches the feature-flag status from the backend.
   * Result is not cached here — callers may cache for their session if needed.
   */
  async checkAvailability(): Promise<ImpersonationHealthResponse> {
    const repo = this.resolveRepo();
    if (!repo) {
      return { enabled: false };
    }
    return repo.health();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private setSession(session: ImpersonationSession): void {
    this.sessionSignal.set(session);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // storage unavailable
    }
  }

  private clearSession(): void {
    this.sessionSignal.set(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // storage unavailable
    }
  }

  private rehydrate(): void {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ImpersonationSession>;
      if (!parsed?.token || !parsed?.expiresAt || !parsed?.sessionId || !parsed?.target) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      this.sessionSignal.set(parsed as ImpersonationSession);
    } catch {
      // malformed JSON or storage unavailable
    }
  }
}
