import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  PublicTournament,
  localizedPublicName,
  publicTournamentStatusVariant
} from '../../../../core/models';
import { publicTournamentPath } from '../../../../core/services/public-tournament-link.service';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { SportIconComponent } from '../../../../shared/components/sport-icon/sport-icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PublicOrganizationCardComponent } from '../../../../shared/components/public-organization-card/public-organization-card.component';

/**
 * Card of one public tournament, shared by the `/tournaments` showcase and the home section.
 * The name links to the public detail (`publicTournamentPath`); the organization block lives
 * outside that link so its own links stay valid, separately focusable anchors.
 */
@Component({
  selector: 'app-public-tournament-card',
  standalone: true,
  imports: [RouterLink, MatIcon, FormatDatePipe, TranslatePipe, SportIconComponent, StatusBadgeComponent, PublicOrganizationCardComponent],
  templateUrl: './public-tournament-card.component.html',
  styleUrl: './public-tournament-card.component.scss'
})
export class PublicTournamentCardComponent {
  private readonly i18n = inject(I18nService);

  readonly tournament = input.required<PublicTournament>();

  readonly detailPath = computed(() => publicTournamentPath(this.tournament().slug));
  readonly imageUrl = computed(() => this.tournament().imageUrl || this.tournament().coverImageUrl || null);
  readonly statusName = computed(() => {
    const status = this.tournament().status;
    return status ? (localizedPublicName(status, this.i18n.locale()) ?? status.key) : null;
  });
  readonly statusVariant = computed(() => publicTournamentStatusVariant(this.tournament().status?.key));

  /** Category, gender and modality names, in that order, skipping the ones the API leaves null. */
  readonly tags = computed(() => {
    const t = this.tournament();
    const modality = t.modality ? (localizedPublicName(t.modality, this.i18n.locale()) ?? t.modality.key) : null;
    return [t.category?.name, t.gender?.name, modality].filter((tag): tag is string => !!tag);
  });
}
