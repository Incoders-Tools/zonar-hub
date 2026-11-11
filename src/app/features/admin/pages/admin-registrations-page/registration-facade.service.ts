import { Injectable, inject, signal, computed } from '@angular/core';
import {
  ManualPaymentStatus,
  RegistrationCapacity,
  RegistrationPaymentStatus,
  RegistrationToken,
  RegistrationTransition,
  TournamentRegistration,
  TournamentRegistrationCreate,
  TournamentRegistrationStatus,
  allowedManualPayments,
  allowedRegistrationTransitions,
  isRegistrationCapacityFull
} from '../../../../core/models';
import { ApiRegistrationRepository } from '../../../../core/repositories/api/api-registration.repository';
import { RegistrationService } from '../../../../core/services/registration.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

export interface RegistrationFilters {
  /** Contains match on a participant's name, case-insensitive (client side). */
  search?: string;
  /** Sent to the API as `status`. */
  status?: TournamentRegistrationStatus;
  /** The API has no payment filter: applied client side. */
  paymentStatus?: RegistrationPaymentStatus;
}

/** D2: another user changed the registration since it was read; the list is read again. */
const CONCURRENT_MODIFICATION_KEY = 'registrations.errors.concurrent_modification';

/**
 * Registrations of one tournament (S4) on the admin API. The page picks the tournament; the API owns the D2
 * transitions, the capacity and the D3 eligibility, and this facade only offers what D2 allows for each status
 * (confirm also needs a free place). Every status and payment change sends the revision that was read; a stale one
 * (409 `concurrent_modification`) reloads the list with a translated warning, any other refusal reloads it too, so
 * the screen always shows the stored state.
 *
 * Registration tokens are still the in-memory mock of `RegistrationService` (tokens tab).
 */
@Injectable()
export class RegistrationFacadeService {
  private readonly repo = inject(ApiRegistrationRepository);
  private readonly service = inject(RegistrationService);
  private readonly notification = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  private readonly tournamentIdState = signal<string | null>(null);
  private readonly registrationsState = signal<TournamentRegistration[]>([]);
  private readonly capacityState = signal<RegistrationCapacity | null>(null);
  private readonly loadingState = signal(false);
  /** Translation key of the last load failure. */
  private readonly errorState = signal<string | null>(null);
  private readonly savingState = signal(false);
  /** Registration whose status or payment change is running. */
  private readonly busyIdState = signal<string | null>(null);
  private readonly filtersState = signal<RegistrationFilters>({});
  private readonly tokenFilterStatus = signal<string | undefined>(undefined);

  readonly tournamentId = this.tournamentIdState.asReadonly();
  readonly registrations = this.registrationsState.asReadonly();
  readonly capacity = this.capacityState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly busyId = this.busyIdState.asReadonly();
  readonly filters = this.filtersState.asReadonly();

  /** Confirmed registrations already reach `maxPairs`: confirm is refused until a place frees. */
  readonly capacityFull = computed(() => isRegistrationCapacityFull(this.capacityState()));

  readonly filteredRegistrations = computed(() => {
    const { search, paymentStatus } = this.filtersState();
    const term = search?.trim().toLocaleLowerCase();
    return this.registrationsState().filter(r =>
      (!paymentStatus || r.paymentStatus === paymentStatus)
      && (!term || r.participants.some(p => p.displayName.toLocaleLowerCase().includes(term))));
  });

  readonly filteredTokens = computed(() => {
    const tournamentId = this.tournamentIdState();
    const tokenStatus = this.tokenFilterStatus();
    return this.service.tokens().filter(t =>
      (!tournamentId || t.tournamentId === tournamentId)
      && (tokenStatus !== 'active' || t.isActive)
      && (tokenStatus !== 'inactive' || !t.isActive));
  });

  // Monotonic id of the latest load; older responses are ignored when superseded
  private loadRequestId = 0;

  /** Shows the registrations of a tournament, or nothing when the selection is cleared. */
  async selectTournament(tournamentId: string | null): Promise<void> {
    this.tournamentIdState.set(tournamentId || null);
    await this.load();
  }

  async load(): Promise<void> {
    const requestId = ++this.loadRequestId;
    const tournamentId = this.tournamentIdState();
    this.errorState.set(null);
    if (!tournamentId) {
      this.registrationsState.set([]);
      this.capacityState.set(null);
      this.loadingState.set(false);
      return;
    }
    this.loadingState.set(true);
    try {
      const list = await this.repo.list(tournamentId, this.filtersState().status);
      if (requestId !== this.loadRequestId) return;
      this.registrationsState.set(list.items);
      this.capacityState.set(list.capacity);
    } catch (error) {
      if (requestId !== this.loadRequestId) return;
      this.registrationsState.set([]);
      this.capacityState.set(null);
      this.errorState.set(errorKey(error));
    } finally {
      if (requestId === this.loadRequestId) this.loadingState.set(false);
    }
  }

  /** A new status is read from the API; search and payment filter the loaded list. */
  async applyFilters(filters: RegistrationFilters): Promise<void> {
    const statusChanged = filters.status !== this.filtersState().status;
    this.filtersState.set(filters);
    if (statusChanged) await this.load();
  }

  clearFilters(): Promise<void> {
    return this.applyFilters({});
  }

  /** True when D2 allows the change for the registration's status and, for confirm, a place is free. */
  canTransition(registration: TournamentRegistration, transition: RegistrationTransition): boolean {
    return allowedRegistrationTransitions(registration.status).includes(transition)
      && (transition !== 'confirm' || !this.capacityFull());
  }

  canSetPayment(registration: TournamentRegistration, paymentStatus: ManualPaymentStatus): boolean {
    return allowedManualPayments(registration.paymentStatus).includes(paymentStatus);
  }

  transition(registration: TournamentRegistration, transition: RegistrationTransition): Promise<boolean> {
    if (!this.canTransition(registration, transition)) return Promise.resolve(false);
    return this.change(registration, `registrations.feedback.${transition}`, tournamentId =>
      this.repo.transition(tournamentId, registration.id, transition, registration.revision));
  }

  setPayment(registration: TournamentRegistration, paymentStatus: ManualPaymentStatus): Promise<boolean> {
    if (!this.canSetPayment(registration, paymentStatus)) return Promise.resolve(false);
    return this.change(registration, `registrations.feedback.${paymentStatus}`, tournamentId =>
      this.repo.setPayment(tournamentId, registration.id, paymentStatus, registration.revision));
  }

  /** Admin create from organization players; the API applies D3 and decides pending or waitlisted. */
  async create(registration: TournamentRegistrationCreate): Promise<boolean> {
    const tournamentId = this.tournamentIdState();
    if (!tournamentId || this.savingState()) return false;
    this.savingState.set(true);
    try {
      await this.repo.create(tournamentId, registration);
      this.notification.success(this.i18n.translate('registrations.feedback.created'));
    } catch (error) {
      this.notification.error(this.i18n.translate(errorKey(error)));
      return false;
    } finally {
      this.savingState.set(false);
    }
    await this.load();
    return true;
  }

  private async change(
    registration: TournamentRegistration,
    successKey: string,
    write: (tournamentId: string) => Promise<TournamentRegistration>
  ): Promise<boolean> {
    const tournamentId = this.tournamentIdState();
    if (!tournamentId || this.busyIdState()) return false;
    this.busyIdState.set(registration.id);
    let changed = false;
    try {
      await write(tournamentId);
      this.notification.success(this.i18n.translate(successKey));
      changed = true;
    } catch (error) {
      const key = errorKey(error);
      if (key === CONCURRENT_MODIFICATION_KEY) {
        this.notification.warning(this.i18n.translate(key));
      } else {
        this.notification.error(this.i18n.translate(key));
      }
    } finally {
      this.busyIdState.set(null);
    }
    await this.load();
    return changed;
  }

  // ---- Registration tokens (in-memory mock) ----

  applyTokenFilters(status?: string): void {
    this.tokenFilterStatus.set(status);
  }

  clearTokenFilters(): void {
    this.tokenFilterStatus.set(undefined);
  }

  async generateToken(tournamentId: string): Promise<RegistrationToken | null> {
    try {
      const token = await this.service.generateToken(tournamentId);
      this.notification.success(this.i18n.translate('toast.saveSuccess'));
      return token;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return null;
    }
  }

  async deactivateToken(id: string): Promise<boolean> {
    try {
      await this.service.deactivateToken(id);
      this.notification.success(this.i18n.translate('toast.saveSuccess'));
      return true;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return false;
    }
  }

  async copyTokenToClipboard(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.notification.success(this.i18n.translate('registrations.tokens.copied'));
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
    }
  }
}

function errorKey(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'common.unexpectedError';
}
