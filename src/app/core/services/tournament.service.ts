import { Injectable, signal, computed } from '@angular/core';
import { Tournament } from '../models';
import { MOCK_TOURNAMENTS } from '../data/mock/mock-tournaments';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly tournamentsState = signal<Tournament[]>(MOCK_TOURNAMENTS);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly tournaments = this.tournamentsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly publicTournaments = computed(() =>
    this.tournamentsState().filter(t => t.statusId !== 'ts6')
  );

  readonly upcomingTournaments = computed(() =>
    this.tournamentsState().filter(t => ['ts1', 'ts2'].includes(t.statusId))
  );

  async loadTournaments(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      await this.delay(600);
      this.tournamentsState.set(MOCK_TOURNAMENTS);
    } catch {
      this.errorState.set('state.error');
    } finally {
      this.loadingState.set(false);
    }
  }

  getTournamentById(id: string): Tournament | undefined {
    return this.tournamentsState().find(t => t.id === id);
  }

  isRegistrationOpen(tournament: Tournament): boolean {
    const now = new Date().toISOString().split('T')[0];
    return now >= tournament.registrationStartDate && now <= tournament.registrationEndDate;
  }

  async saveTournament(tournament: Partial<Tournament>): Promise<Tournament> {
    await this.delay(800);
    const existing = this.tournamentsState().find(t => t.id === tournament.id);
    if (existing) {
      const updated = { ...existing, ...tournament };
      this.tournamentsState.update(items => items.map(t => t.id === updated.id ? updated : t));
      return updated;
    }
    const created: Tournament = {
      ...tournament as Tournament,
      id: 't-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    this.tournamentsState.update(items => [...items, created]);
    return created;
  }

  async deleteTournament(id: string): Promise<void> {
    await this.delay(500);
    this.tournamentsState.update(items => items.filter(t => t.id !== id));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
