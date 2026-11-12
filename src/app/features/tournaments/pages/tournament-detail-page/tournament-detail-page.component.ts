import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { PublicRegistrationInfo, PublicTournament, localizedPublicName, publicTournamentStatusVariant } from '../../../../core/models';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { PUBLIC_TOURNAMENTS_ROUTE, publicTournamentPath } from '../../../../core/services/public-tournament-link.service';
import { ApiPublicRegistrationRepository } from '../../../../core/repositories/api/api-public-registration.repository';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { SportIconComponent } from '../../../../shared/components/sport-icon/sport-icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PublicOrganizationCardComponent } from '../../../../shared/components/public-organization-card/public-organization-card.component';
import { PublicDrawLiveService } from '../../../../core/services/public-draw-live.service';
import { PublicDrawPanelComponent } from '../../components/public-draw-panel/public-draw-panel.component';

export type TournamentTab = 'bracket' | 'results' | 'participants';

export type TournamentDetailState = 'loading' | 'loaded' | 'notFound' | 'error';

interface TournamentTabDefinition {
  id: TournamentTab;
  icon: string;
  labelKey: string;
  comingSoonKey: string;
}

/**
 * Public tournament detail resolved by its share slug (`/tournaments/:slug`).
 * Once the tournament is loaded, its published draw is kept live by the page-scoped `PublicDrawLiveService`
 * (D10, S5): the draw tab shows the bracket and the results tab its list view. Without a published draw, and on
 * the participants tab (not public yet), a translated coming-soon state is shown instead of placeholder data.
 * The register call to action follows the public registration info (S2): a link to the wizard with the places left or
 * the waitlist hint while the window is open, the reason while it is closed, nothing when the info cannot be read.
 */
@Component({
  selector: 'app-tournament-detail-page',
  standalone: true,
  imports: [
    RouterLink, MatIcon, DecimalPipe, NgTemplateOutlet, TranslatePipe, FormatDatePipe, LoadingStateComponent, ErrorStateComponent,
    SportIconComponent, StatusBadgeComponent, PublicOrganizationCardComponent, PublicDrawPanelComponent
  ],
  providers: [PublicDrawLiveService],
  templateUrl: './tournament-detail-page.component.html',
  styleUrl: './tournament-detail-page.component.scss'
})
export class TournamentDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly publicTournaments = inject(PublicTournamentService);
  private readonly liveDraw = inject(PublicDrawLiveService);
  private readonly registrations = inject(ApiPublicRegistrationRepository);
  private slug = '';
  private requestId = 0;

  readonly listPath = `/${PUBLIC_TOURNAMENTS_ROUTE}`;
  readonly tournament = signal<PublicTournament | null>(null);
  readonly state = signal<TournamentDetailState>('loading');
  readonly errorKey = signal('common.unexpectedError');
  readonly activeTab = signal<TournamentTab>('bracket');
  /** Registration info of the loaded tournament; null hides the register block. */
  readonly registration = signal<PublicRegistrationInfo | null>(null);
  readonly registerPath = computed(() => {
    const tournament = this.tournament();
    return tournament ? `${publicTournamentPath(tournament.slug)}/register` : null;
  });
  readonly placesLeftText = computed(() => {
    const placesLeft = this.registration()?.capacity.placesLeft;
    return placesLeft == null ? null : this.i18n.translate('registration.public.placesLeft').replace('{count}', String(placesLeft));
  });
  readonly registrationClosedKey = computed(() =>
    this.registration()?.state === 'notStarted' ? 'registration.public.closed.notStarted' : 'registration.public.closed.ended');

  readonly tabs: TournamentTabDefinition[] = [
    { id: 'bracket', icon: 'account_tree', labelKey: 'tournaments.tab.bracket', comingSoonKey: 'publicTournaments.comingSoon.bracket' },
    { id: 'results', icon: 'scoreboard', labelKey: 'tournaments.tab.results', comingSoonKey: 'publicTournaments.comingSoon.results' },
    { id: 'participants', icon: 'groups', labelKey: 'tournaments.tab.participants', comingSoonKey: 'publicTournaments.comingSoon.participants' }
  ];

  readonly activeTabDefinition = computed(() => this.tabs.find(tab => tab.id === this.activeTab()) ?? this.tabs[0]);
  /** The draw and results tabs show the published draw; participants are not public yet. */
  readonly showsDraw = computed(() => this.activeTab() !== 'participants');

  readonly statusName = computed(() => {
    const status = this.tournament()?.status;
    return status ? (localizedPublicName(status, this.i18n.locale()) ?? status.key) : null;
  });
  readonly statusVariant = computed(() => publicTournamentStatusVariant(this.tournament()?.status?.key));
  readonly modalityName = computed(() => {
    const modality = this.tournament()?.modality;
    return modality ? (localizedPublicName(modality, this.i18n.locale()) ?? modality.key) : null;
  });
  readonly heroImage = computed(() => this.tournament()?.coverImageUrl || this.tournament()?.imageUrl || null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.slug = params.get('slug') ?? '';
      this.liveDraw.stop();
      void this.load();
    });
  }

  async load(): Promise<void> {
    const requestId = ++this.requestId;
    this.state.set('loading');
    this.registration.set(null);
    try {
      const tournament = await this.publicTournaments.getBySlug(this.slug);
      if (requestId !== this.requestId) return;
      this.tournament.set(tournament);
      this.state.set(tournament ? 'loaded' : 'notFound');
      if (tournament) {
        this.liveDraw.start(this.slug);
        void this.loadRegistration(requestId);
      }
    } catch (error) {
      if (requestId !== this.requestId) return;
      this.tournament.set(null);
      this.errorKey.set(error instanceof Error ? error.message : 'common.unexpectedError');
      this.state.set('error');
    }
  }

  /** The register block is optional: a failure only hides it. */
  private async loadRegistration(requestId: number): Promise<void> {
    try {
      const info = await this.registrations.getInfo(this.slug);
      if (requestId === this.requestId) this.registration.set(info);
    } catch {
      if (requestId === this.requestId) this.registration.set(null);
    }
  }

  setTab(tab: TournamentTab): void {
    this.activeTab.set(tab);
  }
}
