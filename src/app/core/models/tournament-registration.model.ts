/**
 * Tournament registrations of the admin API (S4; D2, D5 of `odd/tasks/registrations.md`), shaped like
 * `GET /api/admin/tournaments/{tournamentId}/registrations` (`docs/api/admin-registrations.md` in the API repository).
 * Enum values are the API camelCase spelling. The legacy `Registration` model stays only for the player registrations list.
 */

export type TournamentRegistrationStatus = 'pending' | 'confirmed' | 'rejected' | 'waitlisted' | 'cancelled';
export type TournamentRegistrationSource = 'public' | 'admin';
export type RegistrationPaymentStatus = 'notRequired' | 'pending' | 'paid' | 'refunded' | 'failed';

/** Status endpoints: `POST .../registrations/{registrationId}/{transition}`. */
export type RegistrationTransition = 'confirm' | 'reject' | 'waitlist' | 'cancel';

/** Payment values an organizer may set by hand (cash payments): `PUT .../registrations/{registrationId}/payment`. */
export type ManualPaymentStatus = 'paid' | 'refunded';

export interface TournamentRegistrationParticipant {
  slotNumber: number;
  playerId: string;
  firstName: string;
  lastName: string;
  /** First and last name separated by a space. */
  displayName: string;
  club: string | null;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  status: TournamentRegistrationStatus;
  source: TournamentRegistrationSource;
  paymentStatus: RegistrationPaymentStatus;
  contactEmail: string | null;
  notes: string | null;
  publicNameConsent: boolean;
  /** In slot order. */
  participants: TournamentRegistrationParticipant[];
  /** Sent back with status and payment changes so a stale change fails with 409 `concurrent_modification`. */
  revision: number;
  createdAt: string;
  updatedAt: string;
}

/** Places of the tournament, counted over every registration even when the list is filtered. */
export interface RegistrationCapacity {
  /** Limit of confirmed registrations; null means no limit. */
  maxPairs: number | null;
  confirmed: number;
  pending: number;
  waitlisted: number;
  /** Places still free for confirmation; null without a limit. */
  placesLeft: number | null;
}

export interface TournamentRegistrationList {
  items: TournamentRegistration[];
  capacity: RegistrationCapacity;
}

/** Body of the admin create: players of the tournament's organization, one per filled slot. */
export interface TournamentRegistrationCreate {
  participants: { slotNumber: number; playerId: string }[];
  /** `pending` becomes `waitlisted` on the server when the places are taken; `confirmed` needs a free place. */
  status: 'pending' | 'confirmed';
  contactEmail?: string | null;
  notes?: string | null;
  publicNameConsent: boolean;
}

/** D2: the status changes the API accepts from each status; final statuses accept none. */
const TRANSITIONS: Record<TournamentRegistrationStatus, RegistrationTransition[]> = {
  pending: ['confirm', 'reject', 'waitlist', 'cancel'],
  waitlisted: ['confirm', 'cancel'],
  confirmed: ['cancel'],
  rejected: [],
  cancelled: []
};

/** D5: `paid` from `pending` or `failed`, `refunded` from `paid`, in any registration status. */
const MANUAL_PAYMENTS: Record<RegistrationPaymentStatus, ManualPaymentStatus[]> = {
  notRequired: [],
  pending: ['paid'],
  failed: ['paid'],
  paid: ['refunded'],
  refunded: []
};

export function allowedRegistrationTransitions(status: TournamentRegistrationStatus): RegistrationTransition[] {
  return [...(TRANSITIONS[status] ?? [])];
}

export function allowedManualPayments(paymentStatus: RegistrationPaymentStatus): ManualPaymentStatus[] {
  return [...(MANUAL_PAYMENTS[paymentStatus] ?? [])];
}

/** True when confirmed registrations already reach `maxPairs`; a tournament without a limit is never full. */
export function isRegistrationCapacityFull(capacity: RegistrationCapacity | null | undefined): boolean {
  return capacity?.placesLeft != null && capacity.placesLeft <= 0;
}
