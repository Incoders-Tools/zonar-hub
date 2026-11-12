import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { PUBLIC_TOURNAMENTS_ROUTE, publicTournamentPath } from '../../../../core/services/public-tournament-link.service';
import { ApiPublicRegistrationRepository } from '../../../../core/repositories/api/api-public-registration.repository';
import { PublicConfirmedPair, PublicTournament } from '../../../../core/models';

export type ConfirmedPairsState = 'loading' | 'loaded' | 'notFound' | 'error';

/** Label of a confirmed pair without public name consent (D4). */
export const ANONYMOUS_PAIR_KEY = 'public_registrations.confirmed_pairs.anonymous';

/**
 * Public confirmed pairs of a tournament, resolved by its share slug (`/tournaments/:slug/confirmed-pairs`).
 * Names appear only for pairs that gave public name consent; the others show the translated anonymised label.
 */
@Component({
  selector: 'app-confirmed-pairs-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  templateUrl: './confirmed-pairs-page.component.html',
  styleUrl: './confirmed-pairs-page.component.scss'
})
export class ConfirmedPairsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);
  private readonly publicTournaments = inject(PublicTournamentService);
  private readonly registrations = inject(ApiPublicRegistrationRepository);
  private slug = '';

  readonly listPath = `/${PUBLIC_TOURNAMENTS_ROUTE}`;
  readonly state = signal<ConfirmedPairsState>('loading');
  readonly errorKey = signal('common.unexpectedError');
  readonly tournament = signal<PublicTournament | null>(null);
  readonly pairs = signal<PublicConfirmedPair[]>([]);
  readonly detailPath = computed(() => {
    const tournament = this.tournament();
    return tournament ? publicTournamentPath(tournament.slug) : null;
  });

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      const [tournament, pairs] = await Promise.all([
        this.publicTournaments.getBySlug(this.slug),
        this.registrations.getConfirmedPairs(this.slug)
      ]);
      this.tournament.set(tournament);
      this.pairs.set(pairs ?? []);
      this.state.set(tournament && pairs ? 'loaded' : 'notFound');
    } catch (error) {
      this.errorKey.set(error instanceof Error ? error.message : 'common.unexpectedError');
      this.state.set('error');
    }
  }

  /** Members of a consented pair; an anonymised pair shows its label, or the default one when the key is unknown. */
  pairNames(pair: PublicConfirmedPair): string[] {
    if (pair.members.length > 0) return pair.members;
    if (pair.displayName) return [pair.displayName];
    const key = pair.labelKey ?? ANONYMOUS_PAIR_KEY;
    const label = this.i18n.translate(key);
    return [label === key ? this.i18n.translate(ANONYMOUS_PAIR_KEY) : label];
  }
}
