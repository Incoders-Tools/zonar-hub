import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';

@Component({
  selector: 'app-admin-tournaments-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="admin-tournaments">
      <div class="page-header">
        <h1>{{ 'admin.tournaments' | t }}</h1>
        <a routerLink="/admin/tournaments/new" class="btn btn--primary">{{ 'admin.addTournament' | t }}</a>
      </div>

      @if (tournamentService.loading()) {
        <div class="loading">{{ 'states.loading' | t }}</div>
      } @else if (tournamentService.tournaments().length === 0) {
        <div class="empty">{{ 'states.emptyTournaments' | t }}</div>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'tournaments.name' | t }}</th>
                <th>{{ 'tournaments.category' | t }}</th>
                <th>{{ 'tournaments.status' | t }}</th>
                <th>{{ 'tournaments.dates' | t }}</th>
                <th>{{ 'common.actions' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (t of tournamentService.tournaments(); track t.id) {
                <tr>
                  <td>{{ t.name }}</td>
                  <td>{{ t.categoryName }}</td>
                  <td><span class="status-badge" [attr.data-status]="t.statusId">{{ t.statusLabel }}</span></td>
                  <td>{{ t.startDate }} — {{ t.endDate }}</td>
                  <td>
                    <a [routerLink]="['/admin/tournaments', t.id]" class="table-action">{{ 'common.edit' | t }}</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--zh-space-xl); }
    .page-header h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0; }
    .loading, .empty { text-align: center; padding: var(--zh-space-2xl); color: var(--zh-text-secondary); }
    .table-container { overflow-x: auto; }
    .data-table {
      width: 100%; border-collapse: collapse;
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
    }
    .data-table th, .data-table td {
      padding: var(--zh-space-sm) var(--zh-space-md);
      text-align: left; border-bottom: 1px solid var(--zh-border-subtle);
    }
    .data-table th { font-weight: 600; font-size: var(--zh-font-size-sm); color: var(--zh-text-secondary); background: var(--zh-surface-muted); }
    .data-table td { font-size: var(--zh-font-size-sm); }
    .status-badge {
      padding: 2px var(--zh-space-sm); border-radius: var(--zh-radius-sm);
      font-size: var(--zh-font-size-xs); font-weight: 700; background: var(--zh-surface-muted);
    }
    .table-action { color: var(--zh-primary); text-decoration: none; font-size: var(--zh-font-size-sm); }
    .table-action:hover { text-decoration: underline; }
    .btn {
      padding: var(--zh-space-sm) var(--zh-space-lg);
      border: none; border-radius: var(--zh-radius-md);
      font-weight: 600; font-size: var(--zh-font-size-sm); cursor: pointer; text-decoration: none;
    }
    .btn--primary { background: var(--zh-primary); color: var(--zh-on-primary); }
    .btn--primary:hover { background: var(--zh-primary-hover); }
  `]
})
export class AdminTournamentsPageComponent implements OnInit {
  protected readonly tournamentService = inject(TournamentService);

  ngOnInit(): void {
    this.tournamentService.loadTournaments();
  }
}
