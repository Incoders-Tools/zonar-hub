import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RegistrationService } from '../../../../core/services/registration.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { Registration, Tournament } from '../../../../core/models';

@Component({
  selector: 'app-confirmed-pairs-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="confirmed-pairs">
      @if (tournament()) {
        <a [routerLink]="['/tournaments', tournament()!.id]" class="back-link">← {{ 'tournaments.backToDetail' | t }}</a>
        <h1>{{ 'confirmedPairs.title' | t }}</h1>
        <p class="subtitle">{{ tournament()!.name }}</p>
      }

      @if (pairs().length === 0) {
        <div class="empty">{{ 'confirmedPairs.empty' | t }}</div>
      } @else {
        <div class="pairs-grid">
          @for (pair of pairs(); track pair.id) {
            <div class="pair-card">
              <div class="pair-card__players">
                <span class="pair-card__player">{{ pair.player1Name }}</span>
                <span class="pair-card__separator">&</span>
                <span class="pair-card__player">{{ pair.player2Name }}</span>
              </div>
              <div class="pair-card__meta">
                <span>{{ pair.categoryName }}</span>
                <span>{{ pair.genderLabel }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .confirmed-pairs { max-width: 900px; margin: 0 auto; padding: var(--zh-space-xl) var(--zh-space-md); }
    .back-link { color: var(--zh-text-secondary); text-decoration: none; font-size: var(--zh-font-size-sm); }
    .back-link:hover { color: var(--zh-primary); }
    h1 { margin: var(--zh-space-sm) 0 var(--zh-space-xs); font-size: var(--zh-font-size-2xl); font-weight: 800; }
    .subtitle { color: var(--zh-text-secondary); margin: 0 0 var(--zh-space-xl); }
    .empty { text-align: center; padding: var(--zh-space-2xl); color: var(--zh-text-secondary); }
    .pairs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--zh-space-md); }
    .pair-card {
      padding: var(--zh-space-lg);
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
    }
    .pair-card__players { display: flex; align-items: center; gap: var(--zh-space-sm); margin-bottom: var(--zh-space-sm); }
    .pair-card__player { font-weight: 600; }
    .pair-card__separator { color: var(--zh-primary); font-weight: 700; }
    .pair-card__meta { display: flex; gap: var(--zh-space-sm); font-size: var(--zh-font-size-xs); color: var(--zh-text-secondary); }
    .pair-card__meta span { padding: 2px var(--zh-space-xs); background: var(--zh-surface-muted); border-radius: var(--zh-radius-sm); }
  `]
})
export class ConfirmedPairsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly registrationService = inject(RegistrationService);

  readonly tournament = signal<Tournament | null>(null);
  readonly pairs = signal<Registration[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.tournamentService.loadTournaments().then(() => {
      this.tournament.set(this.tournamentService.getTournamentById(id) ?? null);
    });
    this.pairs.set(this.registrationService.getConfirmedByTournament(id));
  }
}
