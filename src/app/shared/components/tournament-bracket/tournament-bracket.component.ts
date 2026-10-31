import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';
import { DrawMatch, TournamentDraw, normalizeTournamentDraw } from '../../../core/models/tournament-draw.model';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { DrawMatchCardComponent } from './draw-match-card/draw-match-card.component';
import { DrawStandingsTableComponent } from './draw-standings-table/draw-standings-table.component';
import { DrawMatchDetailComponent } from './draw-match-detail/draw-match-detail.component';
import { DrawKnockoutPhaseView, DrawMatchView, DrawRoundView, buildDrawView } from './draw-view.model';

/** Same breakpoint as the `desktop` SCSS mixin (`src/styles/_mixins.scss`). */
const WIDE_QUERY = '(min-width: 960px)';
const WIDE_COLUMNS = 3;
const NARROW_COLUMNS = 1;

export type DrawViewMode = 'bracket' | 'list';

export interface KnockoutColumn {
  round: DrawRoundView;
  /** CSS grid column of the bracket viewport (column 1 holds the previous arrow). */
  gridColumn: number;
  headingId: string;
  /** Its matches feed the next column, which is visible: draw outgoing connectors. */
  feeds: boolean;
  /** Fed by the previous column, which is visible: draw incoming connectors. */
  fed: boolean;
}

export interface KnockoutPage {
  columns: KnockoutColumn[];
  columnCount: number;
  canPrevious: boolean;
  canNext: boolean;
  /** Grid column of the final when it is visible, for the third-place match. */
  thirdPlaceColumn: number | null;
}

let nextId = 0;

/**
 * Shared, presentational draw view (D8): knockout bracket with paging and connectors, group stage tables and
 * matchdays, round robin, list / bracket toggle and the match detail panel. No HTTP.
 */
@Component({
  selector: 'app-tournament-bracket',
  standalone: true,
  imports: [NgTemplateOutlet, MatIcon, TranslatePipe, EmptyStateComponent, DrawMatchCardComponent, DrawStandingsTableComponent, DrawMatchDetailComponent],
  templateUrl: './tournament-bracket.component.html',
  styleUrl: './tournament-bracket.component.scss'
})
export class TournamentBracketComponent {
  private readonly i18n = inject(I18nService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly breakpoints = inject(BreakpointObserver);

  readonly draw = input<TournamentDraw | null>(null);
  /** Admin mode: activating a match emits `matchSelected` instead of opening the detail panel. */
  readonly interactive = input(false);
  /** Draw-local participant id to emphasise in cards and standings. */
  readonly highlightParticipantId = input<string | null>(null);

  readonly matchSelected = output<DrawMatch>();

  readonly idPrefix = `draw-view-${nextId++}`;
  readonly mode = signal<DrawViewMode>('bracket');
  readonly selectedMatch = signal<DrawMatchView | null>(null);
  readonly announcement = signal('');

  private readonly pageByPhase = signal<Record<string, number>>({});
  private returnFocusTo: HTMLElement | null = null;

  private readonly isWide = toSignal(this.breakpoints.observe(WIDE_QUERY).pipe(map(state => state.matches)), { initialValue: false });
  readonly visibleColumns = computed(() => (this.isWide() ? WIDE_COLUMNS : NARROW_COLUMNS));

  readonly view = computed(() => {
    const draw = this.draw();
    return buildDrawView(draw ? normalizeTournamentDraw(draw) : null, key => this.i18n.translate(key), this.highlightParticipantId());
  });

  readonly knockoutPages = computed(() => {
    const pages = new Map<string, KnockoutPage>();
    for (const phase of this.view().phases) {
      if (phase.kind === 'knockout') {
        pages.set(phase.id, this.buildPage(phase));
      }
    }
    return pages;
  });

  page(phase: DrawKnockoutPhaseView): KnockoutPage {
    return this.knockoutPages().get(phase.id) ?? this.buildPage(phase);
  }

  setMode(mode: DrawViewMode): void {
    this.mode.set(mode);
  }

  previous(phase: DrawKnockoutPhaseView): void {
    this.movePage(phase, -1);
  }

  next(phase: DrawKnockoutPhaseView): void {
    this.movePage(phase, 1);
  }

  onViewportKeydown(event: Event, phase: DrawKnockoutPhaseView, step: -1 | 1): void {
    if (this.movePage(phase, step)) {
      event.preventDefault();
      (event.currentTarget as HTMLElement | null)?.focus();
    }
  }

  onMatchActivated(match: DrawMatchView, trigger: HTMLElement): void {
    if (this.interactive()) {
      this.matchSelected.emit(match.source);
      return;
    }
    this.returnFocusTo = trigger;
    this.selectedMatch.set(match);
  }

  closeDetail(): void {
    this.selectedMatch.set(null);
    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target && this.host.nativeElement.contains(target)) {
      target.focus();
    }
  }

  restingText(names: string[]): string {
    return this.i18n.translate('bracket.matchday.resting').replace('{names}', names.join(', '));
  }

  standingsCaption(label: string): string {
    return this.i18n.translate('bracket.standings.caption').replace('{group}', label);
  }

  private movePage(phase: DrawKnockoutPhaseView, step: -1 | 1): boolean {
    const current = this.page(phase);
    if ((step < 0 && !current.canPrevious) || (step > 0 && !current.canNext)) {
      return false;
    }
    const pageIndex = this.pageIndex(phase) + step;
    this.pageByPhase.update(pages => ({ ...pages, [phase.id]: pageIndex }));
    const labels = this.page(phase).columns.map(column => column.round.spokenLabel ?? column.round.label).join(', ');
    this.announcement.set(this.i18n.translate('bracket.paging.status').replace('{rounds}', labels));
    return true;
  }

  private pageIndex(phase: DrawKnockoutPhaseView): number {
    const pageCount = Math.max(1, Math.ceil(phase.rounds.length / this.visibleColumns()));
    return Math.min(Math.max(this.pageByPhase()[phase.id] ?? 0, 0), pageCount - 1);
  }

  private buildPage(phase: DrawKnockoutPhaseView): KnockoutPage {
    const size = this.visibleColumns();
    const start = this.pageIndex(phase) * size;
    const visible = phase.rounds.slice(start, start + size);
    const lastIndex = phase.rounds.length - 1;

    const columns = visible.map((round, offset) => ({
      round,
      gridColumn: offset + 2,
      headingId: `${this.idPrefix}-${round.key}`,
      feeds: offset < visible.length - 1,
      fed: offset > 0
    }));

    const finalColumn = start + visible.length - 1 === lastIndex && visible.length > 0 ? columns[columns.length - 1].gridColumn : null;
    return {
      columns,
      columnCount: size,
      canPrevious: start > 0,
      canNext: start + size <= lastIndex,
      thirdPlaceColumn: phase.thirdPlace ? finalColumn : null
    };
  }
}
