import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-player-dashboard-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="player-dashboard">
      <h1>{{ 'player.dashboard' | t }}</h1>
      <p class="welcome">{{ 'player.welcome' | t }}, {{ auth.currentUser()?.fullName }}</p>

      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3>{{ 'player.myRegistrations' | t }}</h3>
          <p class="dashboard-card__desc">{{ 'player.registrationsDesc' | t }}</p>
        </div>
        <div class="dashboard-card">
          <h3>{{ 'player.profile' | t }}</h3>
          <p class="dashboard-card__desc">{{ 'player.profileDesc' | t }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .player-dashboard h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xs); }
    .welcome { color: var(--zh-text-secondary); margin: 0 0 var(--zh-space-xl); }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--zh-space-lg); }
    .dashboard-card {
      padding: var(--zh-space-lg);
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
    }
    .dashboard-card h3 { margin: 0 0 var(--zh-space-sm); font-weight: 700; }
    .dashboard-card__desc { margin: 0; color: var(--zh-text-secondary); font-size: var(--zh-font-size-sm); }
  `]
})
export class PlayerDashboardPageComponent {
  protected readonly auth = inject(AuthService);
}
