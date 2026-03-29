import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { BracketService } from '../../../../core/services/bracket.service';
import { DrawPlannerService } from '../../../../core/services/draw-planner.service';
import { Tournament, TournamentBracket, DrawPlannerResult } from '../../../../core/models';
import { TournamentBracketComponent } from '../../../../shared/components/tournament-bracket/tournament-bracket.component';
import { MOCK_REGISTRATIONS } from '../../../../core/data/mock/mock-registrations';

export type TournamentTab = 'bracket' | 'results' | 'pairs';

interface ConfirmedPair {
  id: string;
  player1: string;
  player2: string;
  category: string;
  seed?: number;
}

@Component({
  selector: 'app-tournament-detail-page',
  standalone: true,
  imports: [RouterLink, MatIcon, TranslatePipe, FormatDatePipe, TournamentBracketComponent],
  templateUrl: './tournament-detail-page.component.html',
  styleUrl: './tournament-detail-page.component.scss'
})
export class TournamentDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly bracketService = inject(BracketService);
  private readonly drawService = inject(DrawPlannerService);

  readonly tournament = signal<Tournament | null>(null);
  readonly bracket = signal<TournamentBracket | null>(null);
  readonly drawResult = signal<DrawPlannerResult | null>(null);
  readonly confirmedPairs = signal<ConfirmedPair[]>([]);
  readonly loading = signal(true);
  readonly activeTab = signal<TournamentTab>('bracket');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.tournamentService.loadTournaments().then(() => {
      const found = this.tournamentService.getTournamentById(id);
      this.tournament.set(found ?? null);

      this.bracket.set(this.bracketService.getBracketByTournament(id));
      this.drawResult.set(this.drawService.getPublicDraw(id));

      const pairs = MOCK_REGISTRATIONS
        .filter(r => r.tournamentId === id && r.statusId === 'rs1')
        .map((r, i) => ({
          id: r.id,
          player1: r.player1Name,
          player2: r.player2Name,
          category: `${r.categoryName} ${r.genderLabel}`,
          seed: i < 4 ? i + 1 : undefined
        }));
      this.confirmedPairs.set(pairs);

      this.loading.set(false);
    });
  }

  setTab(tab: TournamentTab): void {
    this.activeTab.set(tab);
  }

  get canRegister(): boolean {
    const t = this.tournament();
    return t != null && this.tournamentService.isRegistrationOpen(t);
  }
}
