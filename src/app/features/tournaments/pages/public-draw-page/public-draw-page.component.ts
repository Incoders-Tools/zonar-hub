import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { PublicDrawLiveService } from '../../../../core/services/public-draw-live.service';
import { publicTournamentPath } from '../../../../core/services/public-tournament-link.service';
import { PublicTournament } from '../../../../core/models';
import { PublicDrawPanelComponent } from '../../components/public-draw-panel/public-draw-panel.component';

/**
 * Full-width public draw of a tournament, resolved by its share slug (`/tournaments/:slug/draw`).
 * Shows the same live published draw as the tournament detail (D10): the page provides its own
 * `PublicDrawLiveService` and renders it with the shared `app-public-draw-panel`.
 */
@Component({
  selector: 'app-public-draw-page',
  standalone: true,
  imports: [RouterLink, MatIcon, TranslatePipe, PublicDrawPanelComponent],
  providers: [PublicDrawLiveService],
  templateUrl: './public-draw-page.component.html',
  styleUrl: './public-draw-page.component.scss'
})
export class PublicDrawPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicTournaments = inject(PublicTournamentService);
  private readonly liveDraw = inject(PublicDrawLiveService);
  private requestId = 0;

  /** Header data only; the draw is loaded on its own, so a missing tournament never blocks it. */
  readonly tournament = signal<PublicTournament | null>(null);
  readonly detailPath = computed(() => {
    const tournament = this.tournament();
    return tournament ? publicTournamentPath(tournament.slug) : null;
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const slug = params.get('slug') ?? '';
      void this.loadTournament(slug);
      this.liveDraw.start(slug);
    });
  }

  private async loadTournament(slug: string): Promise<void> {
    const requestId = ++this.requestId;
    this.tournament.set(null);
    let tournament: PublicTournament | null = null;
    try {
      tournament = await this.publicTournaments.getBySlug(slug);
    } catch {
      tournament = null;
    }
    if (requestId === this.requestId) {
      this.tournament.set(tournament);
    }
  }
}
