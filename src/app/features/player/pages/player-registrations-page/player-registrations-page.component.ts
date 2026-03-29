import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { Registration } from '../../../../core/models';

@Component({
  selector: 'app-player-registrations-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="player-registrations">
      <h1>{{ 'player.myRegistrations' | t }}</h1>

      @if (registrations().length === 0) {
        <div class="empty">{{ 'player.noRegistrations' | t }}</div>
      } @else {
        <div class="registrations-list">
          @for (reg of registrations(); track reg.id) {
            <div class="reg-card">
              <div class="reg-card__header">
                <span class="reg-card__status" [attr.data-status]="reg.statusId">{{ reg.statusLabel }}</span>
              </div>
              <div class="reg-card__players">
                {{ reg.player1Name }} & {{ reg.player2Name }}
              </div>
              <div class="reg-card__meta">
                <span>{{ reg.categoryName }}</span>
                <span>{{ reg.genderLabel }}</span>
                <span>{{ reg.registeredAt }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .player-registrations h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xl); }
    .empty { text-align: center; padding: var(--zh-space-2xl); color: var(--zh-text-secondary); }
    .registrations-list { display: flex; flex-direction: column; gap: var(--zh-space-md); }
    .reg-card {
      padding: var(--zh-space-lg);
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
    }
    .reg-card__header { margin-bottom: var(--zh-space-sm); }
    .reg-card__status {
      font-size: var(--zh-font-size-xs); font-weight: 700;
      padding: 2px var(--zh-space-sm); border-radius: var(--zh-radius-sm);
      background: var(--zh-surface-muted);
    }
    .reg-card__players { font-weight: 600; margin-bottom: var(--zh-space-xs); }
    .reg-card__meta {
      display: flex; gap: var(--zh-space-sm); font-size: var(--zh-font-size-xs); color: var(--zh-text-secondary);
    }
    .reg-card__meta span {
      padding: 2px var(--zh-space-xs);
      background: var(--zh-surface-muted);
      border-radius: var(--zh-radius-sm);
    }
  `]
})
export class PlayerRegistrationsPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly registrationService = inject(RegistrationService);

  readonly registrations = signal<Registration[]>([]);

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      this.registrations.set(this.registrationService.getByPlayer(userId));
    }
  }
}
