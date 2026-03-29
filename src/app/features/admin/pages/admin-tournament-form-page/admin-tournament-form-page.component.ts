import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Tournament } from '../../../../core/models';

@Component({
  selector: 'app-admin-tournament-form-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="tournament-form">
      <h1>{{ isNew ? ('admin.addTournament' | t) : ('admin.editTournament' | t) }}</h1>

      <div class="form-card">
        <div class="field">
          <label>{{ 'tournaments.name' | t }}</label>
          <input type="text" [ngModel]="name()" (ngModelChange)="name.set($event)" name="name" />
        </div>
        <div class="field">
          <label>{{ 'tournaments.complex' | t }}</label>
          <input type="text" [ngModel]="complexName()" (ngModelChange)="complexName.set($event)" name="complexName" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>{{ 'tournaments.startDate' | t }}</label>
            <input type="date" [ngModel]="startDate()" (ngModelChange)="startDate.set($event)" name="startDate" />
          </div>
          <div class="field">
            <label>{{ 'tournaments.endDate' | t }}</label>
            <input type="date" [ngModel]="endDate()" (ngModelChange)="endDate.set($event)" name="endDate" />
          </div>
        </div>
        <div class="field">
          <label>{{ 'tournaments.maxPairs' | t }}</label>
          <input type="number" [ngModel]="maxPairs()" (ngModelChange)="maxPairs.set($event)" name="maxPairs" />
        </div>
        <div class="field">
          <label>{{ 'tournaments.description' | t }}</label>
          <textarea [ngModel]="description()" (ngModelChange)="description.set($event)" name="description" rows="4"></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn--secondary" (click)="cancel()">{{ 'common.cancel' | t }}</button>
          <button class="btn btn--primary" [disabled]="submitting()" (click)="save()">
            {{ 'common.save' | t }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tournament-form h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-xl); }
    .form-card {
      max-width: 640px;
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
      padding: var(--zh-space-xl);
      display: flex; flex-direction: column; gap: var(--zh-space-md);
    }
    .field { display: flex; flex-direction: column; gap: var(--zh-space-xs); }
    .field label { font-weight: 600; font-size: var(--zh-font-size-sm); }
    .field input, .field textarea, .field select {
      padding: var(--zh-space-sm) var(--zh-space-md);
      border: 1px solid var(--zh-border-default);
      border-radius: var(--zh-radius-md);
      background: var(--zh-surface-bg);
      color: var(--zh-text-primary);
      font-size: var(--zh-font-size-sm);
    }
    .field-row { display: flex; gap: var(--zh-space-md); }
    .field-row .field { flex: 1; }
    .form-actions {
      display: flex; justify-content: flex-end; gap: var(--zh-space-md);
      margin-top: var(--zh-space-md); padding-top: var(--zh-space-lg);
      border-top: 1px solid var(--zh-border-subtle);
    }
    .btn {
      padding: var(--zh-space-sm) var(--zh-space-lg);
      border: none; border-radius: var(--zh-radius-md);
      font-weight: 600; font-size: var(--zh-font-size-sm); cursor: pointer;
    }
    .btn--primary { background: var(--zh-primary); color: var(--zh-on-primary); }
    .btn--primary:hover:not(:disabled) { background: var(--zh-primary-hover); }
    .btn--secondary { background: var(--zh-surface-muted); color: var(--zh-text-primary); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AdminTournamentFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);
  private readonly notifications = inject(NotificationService);

  isNew = true;
  private tournamentId = '';

  readonly name = signal('');
  readonly complexName = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly maxPairs = signal(16);
  readonly description = signal('');
  readonly submitting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isNew = false;
      this.tournamentId = id;
      const t = this.tournamentService.getTournamentById(id);
      if (t) {
        this.name.set(t.name);
        this.complexName.set(t.complexName);
        this.startDate.set(t.startDate);
        this.endDate.set(t.endDate);
        this.maxPairs.set(t.maxPairs);
        this.description.set(t.description);
      }
    }
  }

  async save(): Promise<void> {
    this.submitting.set(true);
    try {
      await this.tournamentService.saveTournament({
        id: this.isNew ? undefined : this.tournamentId,
        name: this.name(),
        complexName: this.complexName(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        maxPairs: this.maxPairs(),
        description: this.description()
      });
      this.notifications.success(this.isNew ? 'admin.tournamentCreated' : 'admin.tournamentUpdated');
      this.router.navigate(['/admin/tournaments']);
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/tournaments']);
  }
}
