import { PublicOrganization, PublicTournament } from './public-tournament.model';

/** Test-only builders for the public tournament contract (imported by specs only). */
export function buildPublicOrganization(overrides: Partial<PublicOrganization> = {}): PublicOrganization {
  return {
    displayName: 'Club Norte',
    logoUrl: 'https://cdn.example.com/club-norte.png',
    description: 'Club de pádel de la zona norte',
    type: 'circuito',
    links: {
      websiteUrl: 'https://clubnorte.example.com',
      instagramUrl: 'https://www.instagram.com/clubnorte',
      facebookUrl: 'https://www.facebook.com/clubnorte',
      tiktokUrl: 'https://www.tiktok.com/@clubnorte',
      youtubeUrl: 'https://www.youtube.com/@clubnorte',
      whatsappPhone: '+54 9 11 2233-4455',
      contactEmail: 'hola@clubnorte.example.com'
    },
    ...overrides
  };
}

export function buildPublicTournament(overrides: Partial<PublicTournament> = {}): PublicTournament {
  return {
    slug: 'open-norte-abc123',
    name: 'Open Norte',
    description: 'Torneo abierto de la zona norte',
    rules: 'Reglamento oficial',
    startDate: '2099-11-20',
    endDate: '2099-11-22',
    registrationStartDate: '2099-11-01',
    registrationEndDate: '2099-11-15',
    status: { key: 'registration_open', nameEs: 'Inscripción abierta', nameEn: 'Registration open', namePt: 'Inscrição aberta' },
    sport: { key: 'padel', name: 'Pádel', icon: 'padel', iconSource: 'svg' },
    category: { key: 'cuarta', name: 'Cuarta categoría', shortName: '4ta' },
    gender: { key: 'mixed', name: 'Mixto' },
    modality: { key: 'pairs', nameEs: 'Parejas', nameEn: 'Pairs', namePt: 'Duplas' },
    complex: { name: 'Complejo Norte', address: 'Av. Siempre Viva 742' },
    imageUrl: 'https://cdn.example.com/open-norte.jpg',
    coverImageUrl: null,
    maxPairs: 32,
    registrationFeePerPair: 25000,
    prizeMoney: 500000,
    organization: buildPublicOrganization(),
    ...overrides
  };
}
