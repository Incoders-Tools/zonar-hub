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
  templateUrl: './public-draw-page.component.html',
  styleUrl: './public-draw-page.component.scss'
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
