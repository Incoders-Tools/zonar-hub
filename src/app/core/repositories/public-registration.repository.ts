import {
  PublicConfirmedPair,
  PublicRegistrationCodeSent,
  PublicRegistrationInfo,
  PublicRegistrationResult,
  PublicRegistrationSubmission
} from '../models/public-registration.model';

/**
 * Anonymous registration of a public tournament, addressed by its share slug (S2, D4):
 * `/api/public/tournaments/{slug}/registration` and `…/confirmed-pairs`. Failures reject with an `Error` whose message
 * is a translation key (`publicRegistrationErrorKey`).
 */
export interface PublicRegistrationRepository {
  /** Form data; null when the tournament is not public (404). */
  getInfo(slug: string): Promise<PublicRegistrationInfo | null>;
  /** Sends a 6-digit code to the contact email, valid for this tournament and address only. */
  requestCode(slug: string, contactEmail: string): Promise<PublicRegistrationCodeSent>;
  submit(slug: string, submission: PublicRegistrationSubmission): Promise<PublicRegistrationResult>;
  /** Confirmed pairs in registration order; null when the tournament is not public (404). */
  getConfirmedPairs(slug: string): Promise<PublicConfirmedPair[] | null>;
}
