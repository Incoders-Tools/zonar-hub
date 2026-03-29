import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { Tournament } from '../../../../core/models';

@Component({
  selector: 'app-tournament-detail-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './tournament-detail-page.component.html',
  styleUrl: './tournament-detail-page.component.scss'
})
export class TournamentDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  readonly tournament = signal<Tournament | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.tournamentService.loadTournaments().then(() => {
      const found = this.tournamentService.getTournamentById(id);
      this.tournament.set(found ?? null);
      this.loading.set(false);
    });
  }

  get canRegister(): boolean {
    const t = this.tournament();
    return t != null && this.tournamentService.isRegistrationOpen(t);
  }
}
