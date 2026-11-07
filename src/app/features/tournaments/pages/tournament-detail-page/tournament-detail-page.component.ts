import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { PublicTournament, localizedPublicName, publicTournamentStatusVariant } from '../../../../core/models';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { PUBLIC_TOURNAMENTS_ROUTE } from '../../../../core/services/public-tournament-link.service';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { SportIconComponent } from '../../../../shared/components/sport-icon/sport-icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PublicOrganizationCardComponent } from '../../../../shared/components/public-organization-card/public-organization-card.component';

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
 * The draw, live results and participants are not public yet (phase 2), so each tab shows a
 * translated coming-soon state instead of placeholder data.
 */
@Component({
  selector: 'app-tournament-detail-page',
  standalone: true,
  imports: [
    RouterLink, MatIcon, DecimalPipe, TranslatePipe, FormatDatePipe, LoadingStateComponent, ErrorStateComponent,
    SportIconComponent, StatusBadgeComponent, PublicOrganizationCardComponent
  ],
  templateUrl: './tournament-detail-page.component.html',
  styleUrl: './tournament-detail-page.component.scss'
})
export class TournamentDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly publicTournaments = inject(PublicTournamentService);
  private slug = '';
  private requestId = 0;

  readonly listPath = `/${PUBLIC_TOURNAMENTS_ROUTE}`;
  readonly tournament = signal<PublicTournament | null>(null);
  readonly state = signal<TournamentDetailState>('loading');
  readonly errorKey = signal('common.unexpectedError');
  readonly activeTab = signal<TournamentTab>('bracket');

  readonly tabs: TournamentTabDefinition[] = [
    { id: 'bracket', icon: 'account_tree', labelKey: 'tournaments.tab.bracket', comingSoonKey: 'publicTournaments.comingSoon.bracket' },
    { id: 'results', icon: 'scoreboard', labelKey: 'tournaments.tab.results', comingSoonKey: 'publicTournaments.comingSoon.results' },
    { id: 'participants', icon: 'groups', labelKey: 'tournaments.tab.participants', comingSoonKey: 'publicTournaments.comingSoon.participants' }
  ];

  readonly activeTabDefinition = computed(() => this.tabs.find(tab => tab.id === this.activeTab()) ?? this.tabs[0]);

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
      void this.load();
    });
  }

  async load(): Promise<void> {
    const requestId = ++this.requestId;
    this.state.set('loading');
    try {
      const tournament = await this.publicTournaments.getBySlug(this.slug);
      if (requestId !== this.requestId) return;
      this.tournament.set(tournament);
      this.state.set(tournament ? 'loaded' : 'notFound');
    } catch (error) {
      if (requestId !== this.requestId) return;
      this.tournament.set(null);
      this.errorKey.set(error instanceof Error ? error.message : 'common.unexpectedError');
      this.state.set('error');
    }
  }

  setTab(tab: TournamentTab): void {
    this.activeTab.set(tab);
  }
}
