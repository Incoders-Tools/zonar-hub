import { PublicRegistrationInfo, PublicRegistrationSubmission } from './public-registration.model';

/** Test-only builders for the public registration contract (imported by specs only). */
export function buildPublicRegistrationInfo(overrides: Partial<PublicRegistrationInfo> = {}): PublicRegistrationInfo {
  return {
    slug: 'open-norte-abc123',
    state: 'open',
    isOpen: true,
    opensOn: '2099-11-01',
    closesOn: '2099-11-15',
    capacity: { maxPairs: 16, placesLeft: 3, waitlistOnly: false },
    fee: { amountPerPair: 20000, required: true },
    slots: [
      { slotNumber: 1, label: null, required: true, genderId: 'g-female', categoryId: 'c-cuarta', minAge: null, maxAge: null },
      { slotNumber: 2, label: null, required: true, genderId: 'g-female', categoryId: 'c-cuarta', minAge: null, maxAge: null }
    ],
    categoryTolerance: 1,
    consentTextKey: 'public_registrations.consent.public_name',
    ...overrides
  };
}

export function buildPublicRegistrationSubmission(
  overrides: Partial<PublicRegistrationSubmission> = {}
): PublicRegistrationSubmission {
  return {
    contactEmail: 'contact@club.test',
    code: '123456',
    participants: [
      {
        slotNumber: 1, firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test', phone: null, documentId: '30111222',
        birthDate: '1990-05-01', genderId: 'g-female', categoryId: 'c-cuarta', club: 'Norte'
      },
      {
        slotNumber: 2, firstName: 'Bea', lastName: 'Paz', email: null, phone: null, documentId: null,
        birthDate: null, genderId: 'g-female', categoryId: 'c-cuarta', club: null
      }
    ],
    publicNameConsent: true,
    ...overrides
  };
}
