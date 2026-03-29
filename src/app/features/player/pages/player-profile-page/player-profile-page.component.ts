import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-player-profile-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="player-profile">
      <h1>{{ 'player.profile' | t }}</h1>

      @if (auth.currentUser(); as user) {
        <div class="profile-card">
          <div class="field">
            <label>{{ 'auth.name' | t }}</label>
            <input type="text" [ngModel]="fullName()" (ngModelChange)="fullName.set($event)" name="fullName" />
          </div>
          <div class="field">
            <label>{{ 'auth.email' | t }}</label>
            <input type="email" [value]="user.email" disabled />
          </div>
          <div class="field">
            <label>{{ 'player.phone' | t }}</label>
            <input type="tel" [ngModel]="phone()" (ngModelChange)="phone.set($event)" name="phone" />
          </div>

          <button class="btn btn--primary" (click)="save()">{{ 'common.save' | t }}</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .player-profile h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xl); }
    .profile-card {
      max-width: 480px;
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
      padding: var(--zh-space-xl);
      display: flex;
      flex-direction: column;
      gap: var(--zh-space-md);
    }
    .field { display: flex; flex-direction: column; gap: var(--zh-space-xs); }
    .field label { font-weight: 600; font-size: var(--zh-font-size-sm); }
    .field input {
      padding: var(--zh-space-sm) var(--zh-space-md);
      border: 1px solid var(--zh-border-default);
      border-radius: var(--zh-radius-md);
      background: var(--zh-surface-bg);
      color: var(--zh-text-primary);
      font-size: var(--zh-font-size-sm);
    }
    .field input:disabled { opacity: 0.6; }
    .btn {
      padding: var(--zh-space-sm) var(--zh-space-lg);
      border: none; border-radius: var(--zh-radius-md);
      font-weight: 600; cursor: pointer;
    }
    .btn--primary { background: var(--zh-primary); color: var(--zh-on-primary); }
    .btn--primary:hover { background: var(--zh-primary-hover); }
  `]
})
export class PlayerProfilePageComponent {
  protected readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly fullName = signal(this.auth.currentUser()?.fullName ?? '');
  readonly phone = signal(this.auth.currentUser()?.phone ?? '');

  save(): void {
    this.notifications.success('player.profileSaved');
  }
}
