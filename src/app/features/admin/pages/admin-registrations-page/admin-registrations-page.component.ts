import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RegistrationService } from '../../../../core/services/registration.service';

@Component({
  selector: 'app-admin-registrations-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="admin-registrations">
      <h1>{{ 'admin.registrations' | t }}</h1>

      @if (registrationService.registrations().length === 0) {
        <div class="empty">{{ 'states.empty' | t }}</div>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'registration.player1' | t }}</th>
                <th>{{ 'registration.player2' | t }}</th>
                <th>{{ 'tournaments.category' | t }}</th>
                <th>{{ 'tournaments.status' | t }}</th>
                <th>{{ 'common.date' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (r of registrationService.registrations(); track r.id) {
                <tr>
                  <td>{{ r.player1Name }}</td>
                  <td>{{ r.player2Name }}</td>
                  <td>{{ r.categoryName }}</td>
                  <td><span class="status-badge">{{ r.statusLabel }}</span></td>
                  <td>{{ r.registeredAt }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xl); }
    .empty { text-align: center; padding: var(--zh-space-2xl); color: var(--zh-text-secondary); }
    .table-container { overflow-x: auto; }
    .data-table {
      width: 100%; border-collapse: collapse;
      background: var(--zh-surface-card); border: 1px solid var(--zh-border-subtle); border-radius: var(--zh-radius-lg);
    }
    .data-table th, .data-table td {
      padding: var(--zh-space-sm) var(--zh-space-md); text-align: left; border-bottom: 1px solid var(--zh-border-subtle);
    }
    .data-table th { font-weight: 600; font-size: var(--zh-font-size-sm); color: var(--zh-text-secondary); background: var(--zh-surface-muted); }
    .data-table td { font-size: var(--zh-font-size-sm); }
    .status-badge {
      padding: 2px var(--zh-space-sm); border-radius: var(--zh-radius-sm);
      font-size: var(--zh-font-size-xs); font-weight: 700; background: var(--zh-surface-muted);
    }
  `]
})
export class AdminRegistrationsPageComponent {
  protected readonly registrationService = inject(RegistrationService);
}
