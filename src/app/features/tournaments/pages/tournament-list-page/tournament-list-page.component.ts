import { Component, inject, OnInit } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { PublicTournamentCardComponent } from '../../components/public-tournament-card/public-tournament-card.component';

/** Public `/tournaments` showcase: every tournament an organization made public, read anonymously. */
@Component({
  selector: 'app-tournament-list-page',
  standalone: true,
  imports: [TranslatePipe, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent, PublicTournamentCardComponent],
  templateUrl: './tournament-list-page.component.html',
  styleUrl: './tournament-list-page.component.scss'
})
export class TournamentListPageComponent implements OnInit {
  protected readonly publicTournaments = inject(PublicTournamentService);
  readonly tournaments = this.publicTournaments.tournaments;
  readonly loading = this.publicTournaments.loading;
  readonly error = this.publicTournaments.error;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    void this.publicTournaments.load();
  }
}
