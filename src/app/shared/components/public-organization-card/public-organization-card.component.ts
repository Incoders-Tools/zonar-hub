import { Component, computed, inject, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PublicOrganization, PublicOrganizationLinks } from '../../../core/models';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type PublicOrganizationLinkKind = 'website' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'whatsapp' | 'email';

export interface PublicOrganizationLinkView {
  kind: PublicOrganizationLinkKind;
  href: string;
  icon: string;
  /** Accessible name, already translated and filled with the organization name. */
  label: string;
  /** External web links open in a new tab; `mailto:` stays in the current one. */
  newTab: boolean;
}

interface LinkDefinition {
  kind: PublicOrganizationLinkKind;
  field: keyof PublicOrganizationLinks;
  icon: string;
  toHref: (value: string) => string | null;
}

const WEB_URL = /^https?:\/\//i;
const webHref = (value: string) => (WEB_URL.test(value.trim()) ? value.trim() : null);

/** Display order of the links and how each stored value becomes an href. */
const LINK_DEFINITIONS: LinkDefinition[] = [
  { kind: 'website', field: 'websiteUrl', icon: 'language', toHref: webHref },
  { kind: 'instagram', field: 'instagramUrl', icon: 'photo_camera', toHref: webHref },
  { kind: 'facebook', field: 'facebookUrl', icon: 'thumb_up', toHref: webHref },
  { kind: 'tiktok', field: 'tiktokUrl', icon: 'music_note', toHref: webHref },
  { kind: 'youtube', field: 'youtubeUrl', icon: 'smart_display', toHref: webHref },
  {
    kind: 'whatsapp', field: 'whatsappPhone', icon: 'chat',
    toHref: value => {
      const digits = value.replace(/\D/g, '');
      return digits ? `https://wa.me/${digits}` : null;
    }
  },
  { kind: 'email', field: 'contactEmail', icon: 'mail', toHref: value => (value.trim() ? `mailto:${value.trim()}` : null) }
];

/**
 * Public profile of an organization (logo, name, type, description and links), shown next to its
 * public tournaments. Render it only when the API sends `organization`: that means the organization
 * consented to appear in ZonarHub public sections.
 */
@Component({
  selector: 'app-public-organization-card',
  standalone: true,
  imports: [MatIcon, TranslatePipe],
  templateUrl: './public-organization-card.component.html',
  styleUrl: './public-organization-card.component.scss'
})
export class PublicOrganizationCardComponent {
  private readonly i18n = inject(I18nService);

  readonly organization = input.required<PublicOrganization>();
  /** Compact variant for tournament cards: smaller logo and no description. */
  readonly compact = input(false);

  readonly typeKey = computed(() => `organization.type.${this.organization().type}`);

  readonly links = computed<PublicOrganizationLinkView[]>(() => {
    const organization = this.organization();
    // Reading the locale keeps the labels in sync when the user switches language.
    this.i18n.locale();
    const views: PublicOrganizationLinkView[] = [];
    for (const definition of LINK_DEFINITIONS) {
      const value = organization.links[definition.field];
      const href = value ? definition.toHref(value) : null;
      if (!href) continue;
      views.push({
        kind: definition.kind,
        href,
        icon: definition.icon,
        label: this.i18n.translate(`publicOrganization.links.${definition.kind}`).replace('{name}', organization.displayName),
        newTab: definition.kind !== 'email'
      });
    }
    return views;
  });
}
