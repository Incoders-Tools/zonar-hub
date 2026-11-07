import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { TournamentDraw } from '../models';
import { PublicTournamentService } from './public-tournament.service';

/** Refresh interval of an open public draw (S5); the API caches the draw for 15 s. */
export const PUBLIC_DRAW_REFRESH_MS = 30_000;

/**
 * - `idle`: not started (or stopped);
 * - `loading`: first request for the current slug, nothing to show yet;
 * - `loaded`: the last successful answer is in `draw` (`null` = no published draw);
 * - `error`: the first request failed and nothing was loaded yet (`errorKey`).
 */
export type PublicDrawLiveState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Live published draw of one public tournament (D10, S5). Provide it in the page component (`providers`), so
 * it is destroyed with the page. `start(slug)` loads the draw and refreshes it every 30 s while the document
 * is visible (Page Visibility API): hidden pages are not polled, and a page that becomes visible again
 * refreshes at once when the last request is 30 s old or more. Background refreshes never go back to
 * `loading`; a failed refresh keeps the last draw and sets `refreshErrorKey`. Answers for a previous slug
 * (after `start` with another slug, `stop` or destroy) are ignored.
 */
@Injectable()
export class PublicDrawLiveService implements OnDestroy {
  private readonly publicTournaments = inject(PublicTournamentService);
  private readonly document = inject(DOCUMENT);

  private slug: string | null = null;
  /** Bumped by `start`/`stop`: responses of an older generation are stale. */
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastRequestAt = 0;
  private listening = false;
  private readonly onVisibilityChange = () => this.handleVisibilityChange();

  private readonly stateValue = signal<PublicDrawLiveState>('idle');
  private readonly drawValue = signal<TournamentDraw | null>(null);
  private readonly errorKeyValue = signal<string | null>(null);
  private readonly refreshErrorKeyValue = signal<string | null>(null);
  private readonly updatedAtValue = signal<Date | null>(null);
  private readonly refreshingValue = signal(false);

  readonly state = this.stateValue.asReadonly();
  /** Last published draw received; null when there is none. */
  readonly draw = this.drawValue.asReadonly();
  /** Translation key of the failed first load (`state` = `error`). */
  readonly errorKey = this.errorKeyValue.asReadonly();
  /** Translation key of the last failed background refresh; cleared by the next success. */
  readonly refreshErrorKey = this.refreshErrorKeyValue.asReadonly();
  /** When the last successful answer arrived. */
  readonly updatedAt = this.updatedAtValue.asReadonly();
  /** A request is in flight. */
  readonly refreshing = this.refreshingValue.asReadonly();

  start(slug: string): void {
    this.stop();
    this.slug = slug;
    this.drawValue.set(null);
    this.errorKeyValue.set(null);
    this.refreshErrorKeyValue.set(null);
    this.updatedAtValue.set(null);
    this.stateValue.set('loading');
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.listening = true;
    void this.request();
  }

  /** Stops polling and ignores any request still in flight. */
  stop(): void {
    this.generation++;
    this.slug = null;
    this.clearTimer();
    this.refreshingValue.set(false);
    if (this.listening) {
      this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.listening = false;
    }
  }

  /** Requests the draw now (retry of a failed load or refresh); ignored while a request is in flight. */
  retry(): void {
    if (this.slug === null || this.refreshingValue()) {
      return;
    }
    if (this.stateValue() === 'error') {
      this.stateValue.set('loading');
    }
    this.clearTimer();
    void this.request();
  }

  ngOnDestroy(): void {
    this.stop();
    this.stateValue.set('idle');
  }

  private async request(): Promise<void> {
    const slug = this.slug;
    if (slug === null) {
      return;
    }
    const generation = this.generation;
    this.refreshingValue.set(true);
    try {
      const draw = await this.publicTournaments.getDraw(slug);
      if (generation !== this.generation) return;
      this.drawValue.set(draw);
      this.updatedAtValue.set(new Date());
      this.errorKeyValue.set(null);
      this.refreshErrorKeyValue.set(null);
      this.stateValue.set('loaded');
    } catch (error) {
      if (generation !== this.generation) return;
      const key = error instanceof Error ? error.message : 'common.unexpectedError';
      if (this.stateValue() === 'loaded') {
        this.refreshErrorKeyValue.set(key);
      } else {
        this.errorKeyValue.set(key);
        this.stateValue.set('error');
      }
    } finally {
      if (generation === this.generation) {
        this.refreshingValue.set(false);
        this.lastRequestAt = Date.now();
        this.schedule(PUBLIC_DRAW_REFRESH_MS);
      }
    }
  }

  private schedule(delay: number): void {
    this.clearTimer();
    if (this.slug === null || this.isHidden()) {
      return;
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.request();
    }, delay);
  }

  private handleVisibilityChange(): void {
    if (this.slug === null) {
      return;
    }
    if (this.isHidden()) {
      this.clearTimer();
      return;
    }
    if (this.refreshingValue() || this.timer !== null) {
      return;
    }
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed >= PUBLIC_DRAW_REFRESH_MS) {
      void this.request();
    } else {
      this.schedule(PUBLIC_DRAW_REFRESH_MS - elapsed);
    }
  }

  private isHidden(): boolean {
    return this.document.visibilityState === 'hidden';
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
