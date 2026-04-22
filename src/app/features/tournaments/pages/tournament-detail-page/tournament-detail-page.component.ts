import { Component, computed, inject, OnInit, signal } from '@angular/core';
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

export type TournamentTab = 'bracket' | 'results' | 'participants';

/** Unified participant entry regardless of modality (singles / doubles / team) */
interface ConfirmedParticipant {
  id: string;
  /** Player names ordered by slot — length 1 = singles, 2 = doubles, 3+ = team */
  names: string[];
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
  readonly confirmedParticipants = signal<ConfirmedParticipant[]>([]);
  readonly loading = signal(true);
  readonly activeTab = signal<TournamentTab>('bracket');

  /**
   * Infers the participant type from the confirmed entries:
   * - 'singles'  → 1 slot per entry
   * - 'doubles'  → 2 slots per entry
   * - 'team'     → 3+ slots per entry
   */
  readonly modalityType = computed<'singles' | 'doubles' | 'team'>(() => {
    const entries = this.confirmedParticipants();
    if (entries.length === 0) return 'doubles';
    const maxSlots = Math.max(...entries.map(e => e.names.length));
    if (maxSlots === 1) return 'singles';
    if (maxSlots === 2) return 'doubles';
    return 'team';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.tournamentService.loadTournaments().then(() => {
      const found = this.tournamentService.getTournamentById(id);
      this.tournament.set(found ?? null);

      this.bracket.set(this.bracketService.getBracketByTournament(id));
      this.drawResult.set(this.drawService.getPublicDraw(id));

      const participants = MOCK_REGISTRATIONS
        .filter(r => r.tournamentId === id && r.statusId === 'rs1')
        .map((r, i) => ({
          id: r.id,
          names: r.participants.length > 0
            ? r.participants.map(p => p.playerName)
            : [r.player1Name, r.player2Name].filter(Boolean),
          category: `${r.categoryName} ${r.genderLabel}`,
          seed: i < 4 ? i + 1 : undefined
        }));
      this.confirmedParticipants.set(participants);

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

  /** Formats a player pair from a BracketPair for display, omitting empty player2 (singles). */
  formatPair(player1: string, player2: string | undefined): string {
    return player2 ? `${player1} / ${player2}` : player1;
  }
}
