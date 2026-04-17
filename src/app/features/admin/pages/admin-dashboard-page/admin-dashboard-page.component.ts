import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { PlayerService } from '../../../../core/services/player.service';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';
import { MockComplexRepository } from '../../../../core/repositories/mock/mock-complex.repository';
import { MockAdminUserRepository } from '../../../../core/repositories/mock/mock-admin-user.repository';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss'
})
export class AdminDashboardPageComponent {
  protected readonly tournamentService = inject(TournamentService);
  protected readonly registrationService = inject(RegistrationService);
  protected readonly playerService = inject(PlayerService);
  private readonly adminUserRepo = inject(MockAdminUserRepository);
  private readonly sportRepo = inject(MockSportRepository);
  private readonly complexRepo = inject(MockComplexRepository);

  readonly showSetupPrompt = computed(() => this.tournamentService.tournaments().length === 0);

  readonly activeTournaments = computed(() =>
    this.tournamentService.tournaments().filter(t => t.statusId === 'ts1' || t.statusId === 'ts2').length
  );

  readonly finishedTournaments = computed(() =>
    this.tournamentService.tournaments().filter(t => t.statusId === 'ts3').length
  );

  readonly totalPlayers = computed(() => this.playerService.players().length);
  readonly totalRegistrations = computed(() => this.registrationService.registrations().length);
  readonly totalTournaments = computed(() => this.tournamentService.tournaments().length);
}
