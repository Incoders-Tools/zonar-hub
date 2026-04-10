import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { PlayerService } from '../../../../core/services/player.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  template: `
    <div class="admin-dashboard">
      <h1>{{ 'admin.dashboard' | t }}</h1>

      @if (showSetupPrompt()) {
        <div class="setup-banner">
          <div class="setup-banner__content">
            <span class="setup-banner__icon">🚀</span>
            <div>
              <h2 class="setup-banner__title">{{ 'onboarding.banner.title' | t }}</h2>
              <p class="setup-banner__desc">{{ 'onboarding.banner.desc' | t }}</p>
            </div>
          </div>
          <a class="setup-banner__cta" routerLink="/admin/onboarding">
            {{ 'onboarding.banner.cta' | t }}
          </a>
        </div>
      }

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
    .setup-banner {
      display: flex; align-items: center; justify-content: space-between; gap: var(--zh-space-lg);
      padding: var(--zh-space-lg) var(--zh-space-xl);
      background: linear-gradient(135deg, var(--zh-primary-alpha-10), var(--zh-surface-card));
      border: 2px solid var(--zh-primary);
      border-radius: var(--zh-radius-lg);
      margin-bottom: var(--zh-space-xl);
    }
    .setup-banner__content { display: flex; align-items: center; gap: var(--zh-space-md); }
    .setup-banner__icon { font-size: var(--zh-font-size-3xl); }
    .setup-banner__title { font-size: var(--zh-font-size-lg); font-weight: 700; color: var(--zh-text-primary); margin: 0 0 var(--zh-space-2xs); }
    .setup-banner__desc { font-size: var(--zh-font-size-sm); color: var(--zh-text-secondary); margin: 0; }
    .setup-banner__cta {
      display: inline-flex; align-items: center; padding: var(--zh-space-sm) var(--zh-space-xl);
      background: var(--zh-primary); color: var(--zh-primary-contrast); border-radius: var(--zh-radius-md);
      font-weight: 600; font-size: var(--zh-font-size-sm); text-decoration: none; white-space: nowrap;
    }
    .setup-banner__cta:hover { opacity: 0.9; }
    @media (max-width: 600px) {
      .setup-banner { flex-direction: column; text-align: center; }
      .setup-banner__content { flex-direction: column; }
    }
  `]
})
export class AdminDashboardPageComponent {
  protected readonly tournamentService = inject(TournamentService);
  protected readonly registrationService = inject(RegistrationService);
  protected readonly playerService = inject(PlayerService);

  readonly showSetupPrompt = computed(() => this.tournamentService.tournaments().length === 0);
}
