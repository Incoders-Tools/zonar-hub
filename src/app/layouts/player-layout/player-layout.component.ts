import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-player-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="player-layout">
      <header class="player-header">
        <div class="player-header__inner">
          <a class="player-header__logo" routerLink="/">
            <img src="/uploads/zonar-hub/zonar-hub-logos/logo_horizontal_green.png" alt="Zonar Hub" class="player-header__logo-img" />
          </a>
          <nav class="player-header__nav">
            <a routerLink="/player" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ 'player.dashboard' | t }}</a>
            <a routerLink="/player/registrations" routerLinkActive="active">{{ 'player.myRegistrations' | t }}</a>
            <a routerLink="/player/profile" routerLinkActive="active">{{ 'player.profile' | t }}</a>
            <button class="player-header__logout" (click)="auth.logout()">{{ 'nav.logout' | t }}</button>
          </nav>
        </div>
      </header>
      <main class="player-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .player-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--zh-surface-elevated);
      border-bottom: 1px solid var(--zh-border-subtle);
    }
    .player-header__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--zh-space-md);
      height: var(--zh-toolbar-height);
    }
    .player-header__logo {
      display: flex;
      align-items: center;
      text-decoration: none;
    }
    .player-header__logo-img {
      height: 30px;
      width: auto;
      object-fit: contain;
    }
    .player-header__nav {
      display: flex;
      align-items: center;
      gap: var(--zh-space-lg);
    }
    .player-header__nav a {
      color: var(--zh-text-secondary);
      text-decoration: none;
      font-weight: 500;
      font-size: var(--zh-font-size-sm);
    }
    .player-header__nav a:hover,
    .player-header__nav a.active {
      color: var(--zh-primary);
    }
    .player-header__logout {
      padding: var(--zh-space-xs) var(--zh-space-md);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-md);
      background: none;
      color: var(--zh-text-secondary);
      cursor: pointer;
      font-size: var(--zh-font-size-sm);
    }
    .player-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--zh-space-xl) var(--zh-space-md);
    }
    @media (max-width: 599px) {
      .player-header__nav {
        gap: var(--zh-space-sm);
        font-size: var(--zh-font-size-xs);
      }
    }
  `]
})
export class PlayerLayoutComponent {
  protected readonly auth = inject(AuthService);
}
