import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { publicTournamentPath } from '../../../../core/services/public-tournament-link.service';
import { PublicTournament, Registration } from '../../../../core/models';

/**
 * Public confirmed pairs of a tournament, resolved by its share slug (`/tournaments/:slug/confirmed-pairs`).
 * Registrations have no public endpoint yet, so the list stays empty and the empty state is shown.
 */
@Component({
  selector: 'app-confirmed-pairs-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './confirmed-pairs-page.component.html',
  styleUrl: './confirmed-pairs-page.component.scss'
})
export class ConfirmedPairsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicTournaments = inject(PublicTournamentService);

  readonly tournament = signal<PublicTournament | null>(null);
  readonly pairs = signal<Registration[]>([]);
  readonly detailPath = computed(() => {
    const tournament = this.tournament();
    return tournament ? publicTournamentPath(tournament.slug) : null;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.publicTournaments.getBySlug(slug)
      .then(tournament => this.tournament.set(tournament))
      .catch(() => this.tournament.set(null));
  }
}
