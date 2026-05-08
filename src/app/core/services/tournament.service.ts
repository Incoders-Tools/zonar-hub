import { Injectable, inject, signal, computed } from '@angular/core';
import { Tournament } from '../models';
import { ApiTournamentAdminRepository } from '../repositories/api/api-tournament-admin.repository';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly repository = inject(ApiTournamentAdminRepository);
  private readonly tournamentsState = signal<Tournament[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly tournaments = this.tournamentsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  /** Tournaments that should be visible publicly (anything except cancelled). */
  readonly publicTournaments = computed(() =>
    this.tournamentsState().filter(t => (t.statusId || '').toLowerCase() !== 'cancelled')
  );

  /**
   * Upcoming tournaments come from the API. The previous implementation
   * merged a hard-coded MOCK_TOURNAMENTS list to keep the public landing
   * page populated; the DB is the single source of truth now and an empty
   * state is preferred over fake data.
   */
  readonly upcomingTournaments = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.tournamentsState()
      .filter(t => (t.statusId || '').toLowerCase() !== 'cancelled')
      .filter(t => !t.endDate || t.endDate >= today);
  });

  /** Tournaments scoped to whatever the active organization currently is. */
  readonly publicDisplayTournaments = computed(() => this.publicTournaments());

  async loadTournaments(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      const data = await this.repository.getAll();
      this.tournamentsState.set(data);
    } catch {
      this.errorState.set('state.error');
      this.tournamentsState.set([]);
    } finally {
      this.loadingState.set(false);
    }
  }

  getTournamentById(id: string): Tournament | undefined {
    return this.tournamentsState().find(t => t.id === id);
  }

  isRegistrationOpen(tournament: Tournament): boolean {
    if (!tournament.registrationStartDate || !tournament.registrationEndDate) return false;
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
