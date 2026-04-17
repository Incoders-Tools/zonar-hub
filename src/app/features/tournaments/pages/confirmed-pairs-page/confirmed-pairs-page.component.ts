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
  templateUrl: './confirmed-pairs-page.component.html',
  styleUrl: './confirmed-pairs-page.component.scss'
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
