import { Component, computed, effect, inject, input, untracked, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { PublicDrawLiveService } from '../../../../core/services/public-draw-live.service';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import {
  DrawViewMode,
  TournamentBracketComponent
} from '../../../../shared/components/tournament-bracket/tournament-bracket.component';

/**
 * Public draw area (D10): renders the live draw of the `PublicDrawLiveService` provided by the host page with the
 * shared, non-interactive bracket view. Loading and error states cover the first load only; refreshes keep the
 * last draw and show a discreet note with a retry. When there is no published draw, the host's projected content
 * (its empty or coming-soon state) is shown.
 */
@Component({
  selector: 'app-public-draw-panel',
  standalone: true,
  imports: [MatIcon, TranslatePipe, LoadingStateComponent, ErrorStateComponent, TournamentBracketComponent],
  templateUrl: './public-draw-panel.component.html',
  styleUrl: './public-draw-panel.component.scss'
})
export class PublicDrawPanelComponent {
  private readonly i18n = inject(I18nService);
  readonly live = inject(PublicDrawLiveService);

  /** View of the bracket (`list` lists the matches with their results); applied whenever it changes. */
  readonly mode = input<DrawViewMode>('bracket');

  private readonly bracket = viewChild(TournamentBracketComponent);

  readonly updatedAtLabel = computed(() => {
    const updatedAt = this.live.updatedAt();
    if (!updatedAt) return null;
    const time = `${String(updatedAt.getHours()).padStart(2, '0')}:${String(updatedAt.getMinutes()).padStart(2, '0')}`;
    // `translate` reads the locale signal, so the label follows language changes.
    return this.i18n.translate('publicTournaments.draw.updatedAt').replace('{time}', time);
  });

  constructor() {
    effect(() => {
      const bracket = this.bracket();
      const mode = this.mode();
      if (bracket) {
        untracked(() => bracket.setMode(mode));
      }
    });
  }

  retry(): void {
    this.live.retry();
  }
}
