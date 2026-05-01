import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ApiSystemSettingRepository } from '../repositories/api/api-system-setting.repository';

export interface OnboardingProgress {
  userId: string;
  wizardCompleted: boolean;
  wizardStep: number;
  tourCompleted: boolean;
  tourStep: number;
  createdTournament: boolean;
  organizationCreated: boolean;
}

const STORAGE_KEY = 'zh_onboarding_progress';
const REMOTE_KEY = 'onboarding.progress.v1';

@Injectable({ providedIn: 'root' })
export class OnboardingStateService {
  private readonly auth = inject(AuthService);
  private readonly settingsRepository = inject(ApiSystemSettingRepository);
  private readonly _progress = signal<OnboardingProgress | null>(this.loadFromStorage());

  readonly progress = this._progress.asReadonly();
  readonly needsWizard = computed(() => {
    const p = this._progress();
    return p !== null && !p.wizardCompleted;
  });
  readonly needsTour = computed(() => {
    const p = this._progress();
    return p !== null && p.wizardCompleted && !p.tourCompleted;
  });
  readonly wizardStep = computed(() => this._progress()?.wizardStep ?? 0);
  readonly tourStep = computed(() => this._progress()?.tourStep ?? 0);
  readonly isComplete = computed(() => {
    const p = this._progress();
    return p !== null && p.wizardCompleted && p.tourCompleted;
  });

  initForUser(userId: string): void {
    const existing = this.loadFromStorageForUser(userId);
    if (existing) {
      this._progress.set(existing);
      void this.hydrateFromRemote(userId);
      return;
    }

    const initial: OnboardingProgress = {
      userId,
      wizardCompleted: false,
      wizardStep: 0,
      tourCompleted: false,
      tourStep: 0,
      createdTournament: false,
      organizationCreated: false
    };
    this._progress.set(initial);
    this.persist(initial);
    void this.upsertRemote(initial);
  }

  async loadExisting(userId: string): Promise<boolean> {
    const local = this.loadFromStorageForUser(userId);
    if (local) {
      this._progress.set(local);
    }

    const remote = await this.readFromRemote(userId);
    if (remote) {
      this._progress.set(remote);
      this.persist(remote);
      return true;
    }

    return local !== null;
  }

  updateWizardStep(step: number): void {
    this.update(p => ({ ...p, wizardStep: step }));
  }

  completeWizard(createdTournament: boolean): void {
    this.update(p => ({
      ...p,
      wizardCompleted: true,
      createdTournament
    }));
  }

  updateTourStep(step: number): void {
    this.update(p => ({ ...p, tourStep: step }));
  }

  completeTour(): void {
    this.update(p => ({ ...p, tourCompleted: true }));
  }

  skipWizard(): void {
    this.update(p => ({ ...p, wizardCompleted: true }));
  }

  markOrganizationCreated(): void {
    this.update(p => ({ ...p, organizationCreated: true }));
  }

  skipTour(): void {
    this.update(p => ({ ...p, tourCompleted: true }));
  }

  reset(): void {
    this._progress.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  }

  private update(fn: (p: OnboardingProgress) => OnboardingProgress): void {
    const current = this._progress();
    if (!current) return;
    const next = fn(current);
    this._progress.set(next);
    this.persist(next);
    void this.upsertRemote(next);
  }

  private loadFromStorageForUser(userId: string): OnboardingProgress | null {
    const existing = this.loadFromStorage();
    if (!existing || existing.userId !== userId) {
      return null;
    }

    return existing;
  }

  private async hydrateFromRemote(userId: string): Promise<void> {
    const remote = await this.readFromRemote(userId);
    if (!remote) {
      return;
    }

    this._progress.set(remote);
    this.persist(remote);
  }

  private async readFromRemote(userId: string): Promise<OnboardingProgress | null> {
    try {
      const tenantId = this.resolveTenantId(userId);
      const stored = await this.settingsRepository.getUserSetting(REMOTE_KEY, userId, tenantId);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as OnboardingProgress;
      if (parsed.userId !== userId) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private async upsertRemote(progress: OnboardingProgress): Promise<void> {
    try {
      const tenantId = this.resolveTenantId(progress.userId);
      await this.settingsRepository.upsertUserSetting(
        REMOTE_KEY,
        JSON.stringify(progress),
        progress.userId,
        tenantId
      );
    } catch {
      // Keep onboarding usable even if backend persistence fails.
    }
  }

  private resolveTenantId(userId: string): string | undefined {
    const current = this.auth.currentUser();
    if (!current || current.id !== userId) {
      return undefined;
    }

    return current.tenantId;
  }

  private persist(data: OnboardingProgress): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage unavailable
    }
  }

  private loadFromStorage(): OnboardingProgress | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as OnboardingProgress;
    } catch {
      return null;
    }
  }
}
