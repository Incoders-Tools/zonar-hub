import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DrawPlannerService } from '../../../../core/services/draw-planner.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { Tournament, DrawPlannerResult } from '../../../../core/models';

@Component({
  selector: 'app-public-draw-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="public-draw">
      @if (tournament()) {
        <a [routerLink]="['/tournaments', tournament()!.id]" class="back-link">← {{ 'tournaments.backToDetail' | t }}</a>
        <h1>{{ 'draw.title' | t }}</h1>
        <p class="subtitle">{{ tournament()!.name }}</p>
      }

      @if (loading()) {
        <div class="loading"><span class="spinner"></span> {{ 'states.loading' | t }}</div>
      } @else if (!drawResult()) {
        <div class="empty">{{ 'draw.notPublished' | t }}</div>
      } @else {
        <div class="zones">
          @for (zone of drawResult()!.zones; track zone.zoneName) {
            <div class="zone-card">
              <h3 class="zone-card__title">{{ zone.zoneName }}</h3>
              <ul class="zone-card__pairs">
                @for (pair of zone.pairs; track pair.registrationId) {
                  <li>
                    <span class="pair-label">{{ pair.player1Name }} & {{ pair.player2Name }}</span>
                    <span class="pair-seed" [class.seeded]="!!pair.seedPosition">
                      @if (pair.seedPosition) { ★ }
                    </span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .public-draw { max-width: 1000px; margin: 0 auto; padding: var(--zh-space-xl) var(--zh-space-md); }
    .back-link { color: var(--zh-text-secondary); text-decoration: none; font-size: var(--zh-font-size-sm); }
    .back-link:hover { color: var(--zh-primary); }
    h1 { margin: var(--zh-space-sm) 0 var(--zh-space-xs); font-size: var(--zh-font-size-2xl); font-weight: 800; }
    .subtitle { color: var(--zh-text-secondary); margin: 0 0 var(--zh-space-xl); }
    .loading, .empty { text-align: center; padding: var(--zh-space-2xl); color: var(--zh-text-secondary); }
    .zones { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--zh-space-lg); }
    .zone-card {
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
      padding: var(--zh-space-lg);
    }
    .zone-card__title { margin: 0 0 var(--zh-space-md); font-weight: 700; color: var(--zh-primary); }
    .zone-card__pairs {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--zh-space-xs);
    }
    .zone-card__pairs li {
      display: flex;
      justify-content: space-between;
      padding: var(--zh-space-xs) var(--zh-space-sm);
      background: var(--zh-surface-muted);
      border-radius: var(--zh-radius-sm);
      font-size: var(--zh-font-size-sm);
    }
    .pair-seed.seeded { color: var(--zh-warning); }
    .spinner {
      display: inline-block; width: 24px; height: 24px;
      border: 3px solid var(--zh-border-subtle); border-top-color: var(--zh-primary);
      border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PublicDrawPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly drawService = inject(DrawPlannerService);

  readonly tournament = signal<Tournament | null>(null);
  readonly drawResult = signal<DrawPlannerResult | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.tournamentService.loadTournaments().then(() => {
      this.tournament.set(this.tournamentService.getTournamentById(id) ?? null);
    });
    const result = this.drawService.getPublicDraw(id);
    this.drawResult.set(result);
    this.loading.set(false);
  }
}
