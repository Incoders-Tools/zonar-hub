import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';

@Component({
  selector: 'app-tournament-list-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, FormatDatePipe],
  templateUrl: './tournament-list-page.component.html',
  styleUrl: './tournament-list-page.component.scss'
})
export class TournamentListPageComponent implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  readonly tournaments = this.tournamentService.publicDisplayTournaments;
  readonly loading = this.tournamentService.loading;

  ngOnInit(): void {
    this.tournamentService.loadTournaments();
  }

  getStatusClass(statusId: string): string {
    return `status--${statusId}`;
  }
}
