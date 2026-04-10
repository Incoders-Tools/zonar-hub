import { Complex } from '../../models';
import { NewsArticle, HomeSection } from '../../models';

export const MOCK_COMPLEXES: Complex[] = [
  { id: 'cx1', name: 'Club Padel Norte', key: 'club-padel-norte', address: 'Av. Libertador 5000', cityId: 'city1', cityName: 'Buenos Aires', phone: '+5491140001111', courtsCount: 8, isActive: true, createdAt: '2025-01-01', sortOrder: 1, preponderance: 1, sportsSupported: ['padel'] },
  { id: 'cx2', name: 'Arena Padel Sur', key: 'arena-padel-sur', address: 'Calle Sur 1234', cityId: 'city1', cityName: 'Buenos Aires', courtsCount: 6, isActive: true, createdAt: '2025-02-01', sortOrder: 2, preponderance: 2, sportsSupported: ['padel'] },
  { id: 'cx3', name: 'Padel Center', key: 'padel-center', address: 'Av. Colón 800', cityId: 'city2', cityName: 'Córdoba', courtsCount: 10, isActive: true, createdAt: '2025-03-01', sortOrder: 3, preponderance: 3, sportsSupported: ['padel'] }
];

export const MOCK_NEWS: NewsArticle[] = [
  { id: 'n1', title: 'Arranca la Copa Primavera 2026', summary: 'El torneo más esperado del circuito abre inscripciones.', content: 'La Copa Primavera 2026 abre sus puertas para la 4ta categoría masculina...', publishedAt: '2026-03-01', isPublished: true, authorName: 'Admin' },
  { id: 'n2', title: 'Nuevas canchas en Arena Padel Sur', summary: 'El complejo suma 2 canchas cubiertas.', content: 'Arena Padel Sur inauguró 2 nuevas canchas cubiertas para la temporada...', publishedAt: '2026-02-20', isPublished: true, authorName: 'Admin' },
  { id: 'n3', title: 'Ranking actualizado', summary: 'Se actualizó el ranking general del circuito.', content: 'El ranking del circuito fue actualizado con los resultados de la Liga de Otoño...', publishedAt: '2026-02-15', isPublished: true, authorName: 'Admin' }
];

export const MOCK_HOME_SECTIONS: HomeSection[] = [
  { id: 'hs1', sectionType: 'next-tournaments', title: 'home.section.nextTournaments', sortOrder: 1, isActive: true },
  { id: 'hs2', sectionType: 'confirmed-pairs', title: 'home.section.confirmedPairs', sortOrder: 2, isActive: true },
  { id: 'hs3', sectionType: 'latest-news', title: 'home.section.latestNews', sortOrder: 3, isActive: true },
  { id: 'hs4', sectionType: 'featured-venues', title: 'home.section.featuredVenues', sortOrder: 4, isActive: true },
  { id: 'hs5', sectionType: 'ranking', title: 'home.section.ranking', sortOrder: 5, isActive: false }
];
