import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { publicTournamentPath } from '../../../../core/services/public-tournament-link.service';
import { PublicTournament, DrawPlannerResult } from '../../../../core/models';

/**
 * Public draw of a tournament, resolved by its share slug (`/tournaments/:slug/draw`).
 * Draws are not published through the public API yet (phase 2), so the not-published state is shown.
 */
@Component({
  selector: 'app-public-draw-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './public-draw-page.component.html',
  styleUrl: './public-draw-page.component.scss'
})
export class PublicDrawPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicTournaments = inject(PublicTournamentService);

  readonly tournament = signal<PublicTournament | null>(null);
  readonly drawResult = signal<DrawPlannerResult | null>(null);
  readonly loading = signal(true);
  readonly detailPath = computed(() => {
    const tournament = this.tournament();
    return tournament ? publicTournamentPath(tournament.slug) : null;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.publicTournaments.getBySlug(slug)
      .then(tournament => this.tournament.set(tournament))
      .catch(() => this.tournament.set(null))
      .finally(() => this.loading.set(false));
  }
}
