import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

/** Route segment of the public tournament showcase; the detail route is `tournaments/:slug`. */
export const PUBLIC_TOURNAMENTS_ROUTE = 'tournaments';

/** App-relative path of a public tournament detail page. Single source for share links and router links. */
export function publicTournamentPath(slug: string): string {
  return `/${PUBLIC_TOURNAMENTS_ROUTE}/${encodeURIComponent(slug)}`;
}

/**
 * Builds and copies the share link of a public tournament. The slug comes from the API
 * (`publicSlug`) and never changes, so the link stays valid when visibility is toggled.
 */
@Injectable({ providedIn: 'root' })
export class PublicTournamentLinkService {
  private readonly document = inject(DOCUMENT);
  private readonly notification = inject(NotificationService);

  shareUrl(slug: string): string {
    return `${this.document.location.origin}${publicTournamentPath(slug)}`;
  }

  /** Copies the share link and reports the outcome through the shared toast. */
  async copyShareUrl(slug: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(this.shareUrl(slug));
      this.notification.success('admin.tournaments.share.copySuccess');
      return true;
    } catch {
      this.notification.error('admin.tournaments.share.copyError');
      return false;
    }
  }
}
