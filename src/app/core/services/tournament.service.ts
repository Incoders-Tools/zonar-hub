import { Injectable, inject, signal, computed } from '@angular/core';
import { Tournament } from '../models';
import { MockTournamentAdminRepository } from '../repositories/mock/mock-tournament-admin.repository';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly repository = inject(MockTournamentAdminRepository);
  private readonly tournamentsState = signal<Tournament[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private loaded = false;

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
      const data = await this.repository.getAll();
      this.tournamentsState.set(data);
      this.loaded = true;
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
    const now = new Date().toISOString().slice(0, 10);
    return now >= tournament.registrationStartDate && now <= tournament.registrationEndDate;
  }

  async saveTournament(tournament: Partial<Tournament>): Promise<Tournament> {
    const existing = this.tournamentsState().find(t => t.id === tournament.id);
    if (existing) {
      const updated = await this.repository.update(existing.id, tournament);
      this.tournamentsState.update(items => items.map(t => t.id === updated.id ? updated : t));
      return updated;
    }
    const created = await this.repository.create(tournament as Omit<Tournament, 'id' | 'createdAt'>);
    this.tournamentsState.update(items => [...items, created]);
    return created;
  }

  async deleteTournament(id: string): Promise<void> {
    await this.repository.delete(id);
    this.tournamentsState.update(items => items.filter(t => t.id !== id));
  }
}
