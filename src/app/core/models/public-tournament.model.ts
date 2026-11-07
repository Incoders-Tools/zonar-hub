import { AppLocale } from '../i18n/i18n.types';
import { SportIconSource } from './sport.model';

// ============================================================
// Public tournament showcase — anonymous read-only contract of
// GET /api/public/tournaments and GET /api/public/tournaments/{slug}.
// It carries no internal ids: the public slug is the only identifier.
// ============================================================

/** Catalog name stored once per supported locale; any of them may be missing. */
export interface PublicLocalizedName {
  nameEs: string | null;
  nameEn: string | null;
  namePt: string | null;
}

export interface PublicTournamentStatus extends PublicLocalizedName {
  key: string;
}

export interface PublicTournamentSport {
  key: string;
  name: string;
  icon: string;
  iconSource: SportIconSource;
}

export interface PublicTournamentCategory {
  key: string;
  name: string;
  shortName: string | null;
}

export interface PublicTournamentGender {
  key: string;
  name: string;
}

export interface PublicTournamentModality extends PublicLocalizedName {
  key: string;
}

export interface PublicTournamentComplex {
  name: string;
  address: string | null;
}

/** Only the links the organization filled in are present. */
export interface PublicOrganizationLinks {
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  whatsappPhone?: string;
  contactEmail?: string;
}

/** Sent only when the organization turned on its public profile. */
export interface PublicOrganization {
  displayName: string;
  logoUrl: string | null;
  description: string | null;
  /** Organization type key (`estandar`, `circuito`, `academia`, `operadora`, `marca`). */
  type: string;
  links: PublicOrganizationLinks;
}

export interface PublicTournament {
  slug: string;
  name: string;
  description: string | null;
  rules: string | null;
  /** Dates use the `yyyy-MM-dd` format. */
  startDate: string;
  endDate: string;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  status: PublicTournamentStatus | null;
  sport: PublicTournamentSport | null;
  category: PublicTournamentCategory | null;
  gender: PublicTournamentGender | null;
  modality: PublicTournamentModality | null;
  complex: PublicTournamentComplex | null;
  imageUrl: string | null;
  coverImageUrl: string | null;
  maxPairs: number | null;
  registrationFeePerPair: number | null;
  prizeMoney: number | null;
  organization: PublicOrganization | null;
}

const LOCALE_NAME_FIELD: Record<AppLocale, keyof PublicLocalizedName> = {
  es: 'nameEs',
  en: 'nameEn',
  pt: 'namePt'
};

/**
 * Picks the name for the active locale and falls back to the other locales
 * (es, en, pt) when that translation is missing. Returns null when no name exists.
 */
export function localizedPublicName(value: PublicLocalizedName | null | undefined, locale: AppLocale): string | null {
  if (!value) return null;
  const order: (keyof PublicLocalizedName)[] = [LOCALE_NAME_FIELD[locale], 'nameEs', 'nameEn', 'namePt'];
  for (const field of order) {
    const name = value[field];
    if (typeof name === 'string' && name.trim().length > 0) return name;
  }
  return null;
}

/** Variants understood by the shared `app-status-badge` (`data-status`). */
export type PublicTournamentStatusVariant = 'open' | 'closed' | 'upcoming' | 'in-progress' | 'finished' | 'cancelled' | 'draft' | 'info';

/** Maps a status catalog key (e.g. `registration_open`, `in_progress`) to a badge variant. */
export function publicTournamentStatusVariant(key: string | null | undefined): PublicTournamentStatusVariant {
  const normalized = (key ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('progress') || normalized.includes('ongoing') || normalized.includes('live')) return 'in-progress';
  if (normalized.includes('finish') || normalized.includes('complete')) return 'finished';
  if (normalized.includes('closed')) return 'closed';
  if (normalized.includes('open')) return 'open';
  if (normalized.includes('draft')) return 'draft';
  if (normalized.includes('upcoming') || normalized.includes('scheduled')) return 'upcoming';
  return 'info';
}
