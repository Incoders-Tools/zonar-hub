import { RegistrationPaymentStatus } from './tournament-registration.model';

/**
 * Anonymous registration of a pair on the public tournament page (S2, S4; D2, D3, D4 of `odd/tasks/registrations.md`),
 * shaped like `/api/public/tournaments/{slug}/registration` (`docs/api/public-registrations.md` in the API repository).
 * Public responses carry no player or organization ids, emails, phones, documents or birth dates.
 */

/** Registration window (D2): both days included, today in UTC; a missing date does not restrict its side. */
export type PublicRegistrationWindowState = 'open' | 'notStarted' | 'ended';

/** Rules of one participant slot (D3); ids are of the anonymous catalogs, null means no rule. */
export interface PublicRegistrationSlot {
  slotNumber: number;
  label: string | null;
  required: boolean;
  genderId: string | null;
  categoryId: string | null;
  minAge: number | null;
  maxAge: number | null;
}

export interface PublicRegistrationInfo {
  slug: string;
  state: PublicRegistrationWindowState;
  isOpen: boolean;
  opensOn: string | null;
  closesOn: string | null;
  /** `placesLeft` counts confirmed and pending registrations; both numbers are null without a limit. */
  capacity: { maxPairs: number | null; placesLeft: number | null; waitlistOnly: boolean };
  fee: { amountPerPair: number | null; required: boolean };
  /** In slot order. */
  slots: PublicRegistrationSlot[];
  categoryTolerance: number;
  /** Translation key of the public name consent text. */
  consentTextKey: string;
}

/** `202` of `POST …/registration/code`. */
export interface PublicRegistrationCodeSent {
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

/** A typed participant: the public form never searches stored players (L9). Optional fields are null when empty. */
export interface PublicRegistrationParticipant {
  slotNumber: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  birthDate: string | null;
  genderId: string | null;
  categoryId: string | null;
  club: string | null;
}

export interface PublicRegistrationSubmission {
  contactEmail: string;
  code: string;
  participants: PublicRegistrationParticipant[];
  publicNameConsent: boolean;
}

/** `201` of `POST …/registration`: public submissions arrive `pending`, or `waitlisted` when the places are taken (D2). */
export interface PublicRegistrationResult {
  /** The registration id, to quote to the organizer. */
  reference: string;
  status: 'pending' | 'waitlisted';
  /** `pending` with the fee as amount when a fee applies, else `notRequired` with a null amount. */
  payment: { status: RegistrationPaymentStatus; amount: number | null };
}

/** A confirmed pair: names only with public name consent, else only the translatable `labelKey` (D4). */
export interface PublicConfirmedPair {
  position: number;
  displayName: string | null;
  members: string[];
  labelKey: string | null;
}
