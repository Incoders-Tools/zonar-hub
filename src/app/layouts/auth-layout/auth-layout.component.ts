import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslatePipe],
  template: `
    <div class="auth-layout">
      <div class="auth-layout__container">
        <a class="auth-layout__logo" routerLink="/">
          <img src="/uploads/zonar-hub/zonar-hub-logos/logo_horizontal_green.png" alt="Zonar Hub" />
        </a>
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--zh-space-md);
      background: var(--zh-surface-bg);
    }
    .auth-layout__container {
      width: 100%;
      max-width: 440px;
    }
    .auth-layout__logo {
      display: block;
      text-align: center;
      text-decoration: none;
      margin-bottom: var(--zh-space-xl);
      display: flex;
      justify-content: center;

      img {
        height: 36px;
        width: auto;
        object-fit: contain;
      }
    }
  `]
})
export class AuthLayoutComponent {}
