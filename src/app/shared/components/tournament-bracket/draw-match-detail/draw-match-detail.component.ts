import { Component, computed, inject, input, output } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { FormatDatePipe } from '../../../pipes/format-date.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { StatusBadgeComponent } from '../../status-badge/status-badge.component';
import { DrawMatchView, formatDuration } from '../draw-view.model';

let nextId = 0;

/** Modal panel with the details of one draw match: status, round, court, schedule, sets and duration. */
@Component({
  selector: 'app-draw-match-detail',
  standalone: true,
  imports: [CdkTrapFocus, MatIcon, TranslatePipe, FormatDatePipe, StatusBadgeComponent],
  templateUrl: './draw-match-detail.component.html',
  styleUrl: './draw-match-detail.component.scss'
})
export class DrawMatchDetailComponent {
  private readonly i18n = inject(I18nService);

  readonly match = input.required<DrawMatchView>();
  readonly closed = output<void>();

  readonly titleId = `draw-match-detail-title-${nextId++}`;

  readonly setNumbers = computed(() => this.match().home.sets.map((_, index) => index + 1));

  readonly duration = computed(() => {
    const minutes = this.match().durationMinutes;
    // Reading the locale keeps the label reactive to language changes.
    this.i18n.locale();
    return minutes == null ? null : formatDuration(minutes, key => this.i18n.translate(key));
  });

  readonly scheduledTime = computed(() => {
    const value = this.match().scheduledAt;
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  });

  setLabel(number: number): string {
    return this.i18n.translate('bracket.detail.set').replace('{n}', String(number));
  }

  close(): void {
    this.closed.emit();
  }
}
