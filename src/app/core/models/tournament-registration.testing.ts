import { RegistrationCapacity, TournamentRegistration } from './tournament-registration.model';

/** Test-only builders of the admin registrations contract (`docs/api/admin-registrations.md`). */

export function buildRegistration(overrides: Partial<TournamentRegistration> = {}): TournamentRegistration {
  return {
    id: 'r-1', tournamentId: 't-1', status: 'pending', source: 'admin', paymentStatus: 'pending',
    contactEmail: null, notes: null, publicNameConsent: false,
    participants: [
      { slotNumber: 1, playerId: 'p-1', firstName: 'Ana', lastName: 'Gil', displayName: 'Ana Gil', club: 'Norte' },
      { slotNumber: 2, playerId: 'p-2', firstName: 'Bea', lastName: 'Paz', displayName: 'Bea Paz', club: null }
    ],
    revision: 2, createdAt: '2026-11-10T10:00:00Z', updatedAt: '2026-11-10T10:00:00Z',
    ...overrides
  };
}

export function buildCapacity(overrides: Partial<RegistrationCapacity> = {}): RegistrationCapacity {
  return { maxPairs: 8, confirmed: 3, pending: 1, waitlisted: 1, placesLeft: 5, ...overrides };
}
