import { Injectable, computed, inject, signal } from '@angular/core';
import { Tournament, TournamentDraw, TournamentDrawRequest, tournamentDrawHasResults } from '../models';
import { ApiTournamentAdminRepository } from '../repositories/api/api-tournament-admin.repository';
import { ApiTournamentDrawRepository } from '../repositories/api/api-tournament-draw.repository';

/**
 * State of the admin draw page (D9) for one tournament: the tournament, its stored draw (D1: at most one, draft or
 * published) and the last unsaved preview. Provided by the page, so each visit starts clean.
 *
 * Write methods update the state and reject with an `Error` whose message is a translation key; the page turns it
 * into a notification.
 */
@Injectable()
export class DrawPlannerService {
  private readonly drawRepository = inject(ApiTournamentDrawRepository);
  private readonly tournamentRepository = inject(ApiTournamentAdminRepository);

  private readonly tournamentIdState = signal<string | null>(null);
  private readonly tournamentState = signal<Tournament | null>(null);
  private readonly drawState = signal<TournamentDraw | null>(null);
  private readonly previewState = signal<TournamentDraw | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly tournament = this.tournamentState.asReadonly();
  /** The stored draw, or null when the tournament has none yet. */
  readonly draw = this.drawState.asReadonly();
  /** The last generated preview that is not saved yet. */
  readonly preview = this.previewState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  /** Translation key of the last load failure, or null. */
  readonly error = this.errorState.asReadonly();

  readonly hasResults = computed(() => tournamentDrawHasResults(this.drawState()));
  /** The draw shown in the page: the unsaved preview first, else the stored draw. */
  readonly shownDraw = computed(() => this.previewState() ?? this.drawState());

  async load(tournamentId: string): Promise<void> {
    this.tournamentIdState.set(tournamentId);
    this.loadingState.set(true);
    this.errorState.set(null);
    this.previewState.set(null);
    try {
      const [tournament, draw] = await Promise.all([
        this.tournamentRepository.getById(tournamentId),
        this.drawRepository.get(tournamentId)
      ]);
      this.tournamentState.set(tournament ?? null);
      this.drawState.set(draw);
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'common.unexpectedError');
      this.tournamentState.set(null);
      this.drawState.set(null);
    } finally {
      this.loadingState.set(false);
    }
  }

  async generatePreview(request: TournamentDrawRequest): Promise<TournamentDraw> {
    const preview = await this.drawRepository.preview(this.requireTournamentId(), request);
    this.previewState.set(preview);
    return preview;
  }

  async saveDraft(request: TournamentDrawRequest): Promise<TournamentDraw> {
    const draw = await this.drawRepository.saveDraft(this.requireTournamentId(), request);
    this.drawState.set(draw);
    this.previewState.set(null);
    return draw;
  }

  async publish(): Promise<TournamentDraw> {
    const draw = await this.drawRepository.publish(this.requireTournamentId());
    this.drawState.set(draw);
    return draw;
  }

  async unpublish(): Promise<TournamentDraw> {
    const draw = await this.drawRepository.unpublish(this.requireTournamentId());
    this.drawState.set(draw);
    return draw;
  }

  async delete(): Promise<void> {
    await this.drawRepository.delete(this.requireTournamentId());
    this.drawState.set(null);
    this.previewState.set(null);
  }

  discardPreview(): void {
    this.previewState.set(null);
  }

  private requireTournamentId(): string {
    const id = this.tournamentIdState();
    if (!id) {
      throw new Error('common.notFound');
    }
    return id;
  }
}
