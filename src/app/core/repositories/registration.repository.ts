import { DrawParticipant } from '../models/tournament-draw.model';
import {
  ManualPaymentStatus,
  RegistrationTransition,
  TournamentRegistration,
  TournamentRegistrationCreate,
  TournamentRegistrationList,
  TournamentRegistrationStatus
} from '../models/tournament-registration.model';

/**
 * Registrations of one tournament (S4): `/api/admin/tournaments/{tournamentId}/registrations`. Failures reject with an
 * `Error` whose message is a translation key.
 */
export interface RegistrationRepository {
  /** Registrations in creation order, optionally of one status, and the places counted over all of them. */
  list(tournamentId: string, status?: TournamentRegistrationStatus): Promise<TournamentRegistrationList>;
  getById(tournamentId: string, registrationId: string): Promise<TournamentRegistration | undefined>;
  create(tournamentId: string, registration: TournamentRegistrationCreate): Promise<TournamentRegistration>;
  /** D2 status change; with `revision`, a registration changed since it was read fails with `concurrent_modification`. */
  transition(
    tournamentId: string,
    registrationId: string,
    transition: RegistrationTransition,
    revision?: number
  ): Promise<TournamentRegistration>;
  setPayment(
    tournamentId: string,
    registrationId: string,
    paymentStatus: ManualPaymentStatus,
    revision?: number
  ): Promise<TournamentRegistration>;
  /** Confirmed registrations as draw participants (D5): id = registration id, members in slot order. */
  getDrawParticipants(tournamentId: string): Promise<DrawParticipant[]>;
}
