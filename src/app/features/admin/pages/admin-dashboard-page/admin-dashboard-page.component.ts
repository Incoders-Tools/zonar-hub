import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { PlayerService } from '../../../../core/services/player.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="admin-dashboard">
      <h1>{{ 'admin.dashboard' | t }}</h1>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card__value">{{ tournamentService.tournaments().length }}</span>
          <span class="stat-card__label">{{ 'admin.tournaments' | t }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">{{ registrationService.registrations().length }}</span>
          <span class="stat-card__label">{{ 'admin.registrations' | t }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">{{ playerService.players().length }}</span>
          <span class="stat-card__label">{{ 'admin.players' | t }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xl); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--zh-space-lg); }
    .stat-card {
      display: flex; flex-direction: column; align-items: center; gap: var(--zh-space-sm);
      padding: var(--zh-space-xl);
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
    }
    .stat-card__value { font-size: var(--zh-font-size-3xl); font-weight: 800; color: var(--zh-primary); }
    .stat-card__label { font-size: var(--zh-font-size-sm); color: var(--zh-text-secondary); }
  `]
})
export class AdminDashboardPageComponent {
  protected readonly tournamentService = inject(TournamentService);
  protected readonly registrationService = inject(RegistrationService);
  protected readonly playerService = inject(PlayerService);
}
