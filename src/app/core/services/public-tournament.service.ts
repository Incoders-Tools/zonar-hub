import { Injectable, computed, inject, signal } from '@angular/core';
import { PublicTournament, TournamentDraw } from '../models';
import { ApiPublicTournamentRepository } from '../repositories/api/api-public-tournament.repository';

/**
 * Facade of the anonymous tournament showcase (`/tournaments`, its detail and the home section).
 * It reads only the public API, so it works without a session or an active organization.
 * Backoffice screens keep using `TournamentService`, which reads the admin API.
 */
@Injectable({ providedIn: 'root' })
export class PublicTournamentService {
  private readonly repository = inject(ApiPublicTournamentRepository);
  private readonly tournamentsState = signal<PublicTournament[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  /** Public tournaments as the API orders them (start date, then name). */
  readonly tournaments = this.tournamentsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  /** Translation key of the last load failure, or null. */
  readonly error = this.errorState.asReadonly();

  /** Tournaments that have not ended yet. */
  readonly upcomingTournaments = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.tournamentsState().filter(t => !t.endDate || t.endDate >= today);
  });

  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      this.tournamentsState.set(await this.repository.getAll());
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'common.unexpectedError');
      this.tournamentsState.set([]);
    } finally {
      this.loadingState.set(false);
    }
  }

  /** Returns null when the tournament does not exist or is not public; rejects on other failures. */
  async getBySlug(slug: string): Promise<PublicTournament | null> {
    return (await this.repository.getBySlug(slug)) ?? null;
  }

  /** Published draw of a public tournament; null when there is none (or the tournament is not public). Rejects on other failures. */
  getDraw(slug: string): Promise<TournamentDraw | null> {
    return this.repository.getDraw(slug);
  }
}
