import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  Category,
  Gender,
  Player,
  PublicRegistrationInfo,
  PublicRegistrationParticipant,
  PublicRegistrationResult,
  PublicRegistrationSlot,
  PublicTournament,
  SportParticipantConfig
} from '../../../../core/models';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { EligibilityValidationService } from '../../../../core/services/eligibility-validation.service';
import {
  ApiPublicRegistrationRepository,
  PUBLIC_REGISTRATION_ERRORS
} from '../../../../core/repositories/api/api-public-registration.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';

export type WizardState = 'loading' | 'ready' | 'closed' | 'notFound' | 'error';

/** One slot of the form as typed; empty fields are `''`. */
export interface ParticipantDraft {
  slotNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentId: string;
  birthDate: string;
  genderId: string;
  categoryId: string;
  club: string;
}

/** Client pre-check of the typed participants; the server decides (D3). */
export interface PrecheckResult {
  valid: boolean;
  /** Translation keys per slot number. */
  slotErrors: Record<number, string[]>;
  /** Translation keys about the slots as a whole (a required slot left empty). */
  structureErrors: string[];
}

/**
 * Resend wait when the API refuses a code without telling how long to wait (429 `code_cooldown` or the rate limit):
 * the API cooldown per address and tournament (`docs/api/public-registrations.md`).
 */
export const CODE_RESEND_FALLBACK_SECONDS = 60;

/**
 * Orchestrates the anonymous public registration of one tournament by its share slug (S2, D4): form data, typed
 * participants checked against the slot rules as a pre-check only (D3, L8), the emailed code with its resend wait,
 * and the single submission. It reads only the public API and the anonymous catalogs.
 */
@Injectable()
export class WizardFacadeService {
  private readonly publicTournaments = inject(PublicTournamentService);
  private readonly repository = inject(ApiPublicRegistrationRepository);
  private readonly eligibility = inject(EligibilityValidationService);
  private readonly categoryRepo = inject(ApiCategoryRepository);
  private readonly genderRepo = inject(ApiGenderRepository);
  private slug = '';
  private countdown: ReturnType<typeof setInterval> | null = null;

  readonly state = signal<WizardState>('loading');
  readonly loadErrorKey = signal('common.unexpectedError');
  /** Why the registration is closed: the window state, or the API refusal that closed it meanwhile. */
  readonly closedMessageKey = signal('registration.public.closed.ended');
  readonly tournament = signal<PublicTournament | null>(null);
  readonly info = signal<PublicRegistrationInfo | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly genders = signal<Gender[]>([]);

  readonly codeSending = signal(false);
  /** Address the last code went to; a code only works for that address. */
  readonly codeSentTo = signal<string | null>(null);
  /** Seconds before another code can be requested. */
  readonly resendIn = signal(0);
  readonly codeErrorKey = signal<string | null>(null);

  readonly submitting = signal(false);
  readonly submitErrorKey = signal<string | null>(null);
  readonly result = signal<PublicRegistrationResult | null>(null);

  readonly slots = computed<PublicRegistrationSlot[]>(() =>
    [...(this.info()?.slots ?? [])].sort((a, b) => a.slotNumber - b.slotNumber));

  /** Participant shape the eligibility service expects, derived from the slots. */
  private readonly config = computed<SportParticipantConfig>(() => {
    const slots = this.slots();
    return {
      sportKey: '',
      participantType: slots.length === 1 ? 'individual' : slots.length === 2 ? 'pair' : 'team',
      minPlayers: slots.filter(s => s.required).length,
      maxPlayers: slots.length,
      requiresGender: slots.some(s => !!s.genderId),
      requiresCategory: slots.some(s => !!s.categoryId),
      categoryToleranceLevels: this.info()?.categoryTolerance ?? 0,
      allowsHabitualPartner: false
    };
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopCountdown());
  }

  async load(slug: string): Promise<void> {
    this.slug = slug;
    this.state.set('loading');
    try {
      const [tournament, info, categories, genders] = await Promise.all([
        this.publicTournaments.getBySlug(slug),
        this.repository.getInfo(slug),
        this.categoryRepo.getAll(),
        this.genderRepo.getAll()
      ]);
      this.tournament.set(tournament);
      this.info.set(info);
      this.categories.set(categories);
      this.genders.set(genders);
      if (!tournament || !info) {
        this.state.set('notFound');
      } else if (!info.isOpen) {
        this.closedMessageKey.set(info.state === 'notStarted' ? 'registration.public.closed.notStarted' : 'registration.public.closed.ended');
        this.state.set('closed');
      } else {
        this.state.set('ready');
      }
    } catch (error) {
      this.loadErrorKey.set(errorKey(error));
      this.state.set('error');
    }
  }

  validate(drafts: ParticipantDraft[]): PrecheckResult {
    const slots = this.slots();
    const filled = drafts.filter(isFilled);
    const slotErrors: Record<number, string[]> = {};
    const seen = new Set<string>();

    for (const draft of filled) {
      const slot = slots.find(s => s.slotNumber === draft.slotNumber) ?? null;
      const errors = [...this.eligibility.validateParticipantForSlot(
        toPlayer(draft), slot, this.config(), this.categories(), this.genders()).errors];
      // Mirror of `registrations.duplicate_player`: an email or document repeated across the participants.
      const keys = [draft.email, draft.documentId].map(v => v.trim().toLowerCase()).filter(v => v !== '');
      if (keys.some(k => seen.has(k))) errors.push('registrations.errors.duplicate_player');
      keys.forEach(k => seen.add(k));
      if (errors.length > 0) slotErrors[draft.slotNumber] = errors;
    }

    const structureErrors = this.eligibility.validateSlotStructure(filled.map(d => d.slotNumber), slots);
    return { valid: Object.keys(slotErrors).length === 0 && structureErrors.length === 0, slotErrors, structureErrors };
  }

  /** Sends a code unless one is on its way or the resend wait still runs. */
  async requestCode(contactEmail: string): Promise<void> {
    if (this.codeSending() || this.resendIn() > 0) return;
    this.codeSending.set(true);
    this.codeErrorKey.set(null);
    try {
      const sent = await this.repository.requestCode(this.slug, contactEmail);
      this.codeSentTo.set(contactEmail);
      this.startCountdown(sent.resendAfterSeconds);
    } catch (error) {
      const key = errorKey(error);
      if (!this.handleClosing(key)) {
        this.codeErrorKey.set(key);
        if (key === PUBLIC_REGISTRATION_ERRORS.codeCooldown || key === PUBLIC_REGISTRATION_ERRORS.tooManyRequests) {
          this.startCountdown(CODE_RESEND_FALLBACK_SECONDS);
        }
      }
    } finally {
      this.codeSending.set(false);
    }
  }

  /** Submits once: a second call while one is in flight, or with a failing pre-check, sends nothing. */
  async submit(contactEmail: string, code: string, drafts: ParticipantDraft[], publicNameConsent: boolean): Promise<void> {
    if (this.submitting() || !this.validate(drafts).valid) return;
    this.submitting.set(true);
    this.submitErrorKey.set(null);
    try {
      const result = await this.repository.submit(this.slug, {
        contactEmail,
        code,
        participants: drafts.filter(isFilled).map(toParticipant),
        publicNameConsent
      });
      this.stopCountdown();
      this.result.set(result);
    } catch (error) {
      const key = errorKey(error);
      if (!this.handleClosing(key)) this.submitErrorKey.set(key);
    } finally {
      this.submitting.set(false);
    }
  }

  /** The window closed or the tournament stopped being public meanwhile: leave the form for that state. */
  private handleClosing(key: string): boolean {
    if (key === PUBLIC_REGISTRATION_ERRORS.closed) {
      this.closedMessageKey.set(key);
      this.state.set('closed');
      return true;
    }
    if (key === PUBLIC_REGISTRATION_ERRORS.notFound) {
      this.state.set('notFound');
      return true;
    }
    return false;
  }

  private startCountdown(seconds: number): void {
    this.stopCountdown();
    this.resendIn.set(Math.max(0, Math.ceil(seconds)));
    if (this.resendIn() === 0) return;
    this.countdown = setInterval(() => {
      this.resendIn.update(s => s - 1);
      if (this.resendIn() <= 0) this.stopCountdown();
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdown !== null) {
      clearInterval(this.countdown);
      this.countdown = null;
    }
    this.resendIn.set(0);
  }
}

function errorKey(error: unknown): string {
  return error instanceof Error ? error.message : 'common.unexpectedError';
}

/** A slot counts as filled once a name is typed; required names are enforced by the form. */
function isFilled(draft: ParticipantDraft): boolean {
  return draft.firstName.trim() !== '' || draft.lastName.trim() !== '';
}

function toParticipant(draft: ParticipantDraft): PublicRegistrationParticipant {
  const optional = (value: string) => value.trim() === '' ? null : value.trim();
  return {
    slotNumber: draft.slotNumber,
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    email: optional(draft.email),
    phone: optional(draft.phone),
    documentId: optional(draft.documentId),
    birthDate: optional(draft.birthDate),
    genderId: optional(draft.genderId),
    categoryId: optional(draft.categoryId),
    club: optional(draft.club)
  };
}

/** The typed data in the shape of the eligibility rules; empty values are missing data (L8). */
function toPlayer(draft: ParticipantDraft): Player {
  return {
    id: `slot-${draft.slotNumber}`,
    firstName: draft.firstName,
    lastName: draft.lastName,
    email: draft.email,
    birthDate: draft.birthDate,
    genderId: draft.genderId,
    genderLabel: '',
    categoryId: draft.categoryId,
    categoryName: '',
    isActive: true,
    createdAt: ''
  };
}
