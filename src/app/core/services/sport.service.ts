import { Injectable, inject, signal, computed } from '@angular/core';
import { Sport } from '../models';
import { MockSportRepository } from '../repositories/mock/mock-sport.repository';

@Injectable({ providedIn: 'root' })
export class SportService {
  private readonly repo = inject(MockSportRepository);
  private readonly sportsState = signal<Sport[]>([]);
  private readonly loadingState = signal(false);

  readonly sports = this.sportsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  readonly activeSports = computed(() =>
    this.sportsState()
      .filter(s => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  );

  async loadSports(): Promise<void> {
    this.loadingState.set(true);
    try {
      const data = await this.repo.getAll();
      this.sportsState.set(data);
    } finally {
      this.loadingState.set(false);
    }
  }
}
