import { Injectable, signal, computed } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class OnboardingStateService {
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
    const existing = this.loadFromStorage();
    if (existing && existing.userId === userId) {
      this._progress.set(existing);
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
  }

  loadExisting(userId: string): boolean {
    const existing = this.loadFromStorage();
    if (existing && existing.userId === userId) {
      this._progress.set(existing);
      return true;
    }
    return false;
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
