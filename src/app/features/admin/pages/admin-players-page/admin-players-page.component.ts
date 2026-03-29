import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PlayerService } from '../../../../core/services/player.service';

@Component({
  selector: 'app-admin-players-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="admin-players">
      <h1>{{ 'admin.players' | t }}</h1>

      @if (playerService.players().length === 0) {
        <div class="empty">{{ 'states.empty' | t }}</div>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'auth.name' | t }}</th>
                <th>{{ 'player.dni' | t }}</th>
                <th>{{ 'auth.email' | t }}</th>
                <th>{{ 'player.phone' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of playerService.players(); track p.id) {
                <tr>
                  <td>{{ p.firstName }} {{ p.lastName }}</td>
                  <td>{{ p.email }}</td>
                  <td>{{ p.email }}</td>
                  <td>{{ p.phone }}</td>
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
  `]
})
export class AdminPlayersPageComponent {
  protected readonly playerService = inject(PlayerService);
}
