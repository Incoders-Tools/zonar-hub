import { Component, inject, input, output, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { merge } from 'rxjs';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { ParticipantSearchComponent } from '../../../../../shared/components/participant-search/participant-search.component';
import { FormatDatePipe } from '../../../../../shared/pipes/format-date.pipe';
import { RegistrationStrategyService } from '../../../../../core/services/registration-strategy.service';
import { EligibilityValidationService, TournamentEligibilityRules } from '../../../../../core/services/eligibility-validation.service';
import { ApiEligibilityProfileRepository } from '../../../../../core/repositories/api/api-eligibility-profile.repository';
import { ApiTournamentAdminRepository } from '../../../../../core/repositories/api/api-tournament-admin.repository';
import { ApiCategoryRepository } from '../../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../../core/repositories/api/api-gender.repository';
import { RegistrationFacadeService } from '../registration-facade.service';
import {
  RegistrationCapacity,
  TournamentRegistration,
  TournamentRegistrationCreate,
  isRegistrationCapacityFull
} from '../../../../../core/models/tournament-registration.model';
import { Tournament } from '../../../../../core/models/tournament.model';
import { TournamentEligibilityProfile, TournamentEligibilitySlot } from '../../../../../core/models/tournament-admin.model';
import { Category, Gender } from '../../../../../core/models/catalog.model';
import { Player } from '../../../../../core/models/player.model';
import { SportParticipantConfig, ParticipantValidationResult } from '../../../../../core/models/sport-config.model';

/** Registrations that still hold their players: a player may be in one of them per tournament (D1). */
const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'waitlisted']);

const NOTES_MAX_LENGTH = 2000;

/**
 * Admin create of a tournament registration from organization players (S3, S4). The slots and their rules are the
 * client mirror of D3: the tournament's active eligibility profile, else its own modality, gender and category (L8),
 * with the `mixed` gender admitting anyone. The API checks the same rules again and decides `pending` or `waitlisted`.
 */
@Component({
  selector: 'app-registration-form-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    ParticipantSearchComponent,
    FormatDatePipe
  ],
  templateUrl: './registration-form-panel.component.html',
  styleUrl: './registration-form-panel.component.scss'
})
export class RegistrationFormPanelComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly strategyService = inject(RegistrationStrategyService);
  private readonly eligibilityService = inject(EligibilityValidationService);
  private readonly eligibilityRepo = inject(ApiEligibilityProfileRepository);
  private readonly tournamentRepo = inject(ApiTournamentAdminRepository);
  private readonly categoryRepo = inject(ApiCategoryRepository);
  private readonly genderRepo = inject(ApiGenderRepository);
  private readonly facade = inject(RegistrationFacadeService);

  // Inputs
  readonly tournament = input.required<Tournament>();
  readonly capacity = input<RegistrationCapacity | null>(null);
  /** Registrations of the tournament, to mark players that already hold a place. */
  readonly registrations = input<TournamentRegistration[]>([]);
  readonly saving = input(false);

  // Outputs
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly notesMaxLength = NOTES_MAX_LENGTH;

  readonly form = new FormGroup({
    status: new FormControl<'pending' | 'confirmed'>('pending', { nonNullable: true }),
    contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(NOTES_MAX_LENGTH)] }),
    publicNameConsent: new FormControl(false, { nonNullable: true })
  });

  // State
  readonly config = signal<SportParticipantConfig | null>(null);
  readonly eligibilityProfile = signal<TournamentEligibilityProfile | null>(null);
  readonly slots = signal<TournamentEligibilitySlot[]>([]);
  readonly participants = signal<Map<number, Player>>(new Map());
  readonly categories = signal<Category[]>([]);
  readonly genders = signal<Gender[]>([]);
  readonly validationErrors = signal<ParticipantValidationResult[]>([]);
  readonly submitted = signal(false);
  readonly loadingTournament = signal(true);
  /** Translation key when the rules of the tournament could not be read. */
  readonly loadError = signal<string | null>(null);
  readonly formValid = signal(true);
  readonly status = signal<'pending' | 'confirmed'>('pending');

  /** The tournament's own rules, used without an active eligibility profile (D3, L8). */
  readonly tournamentRules = computed<TournamentEligibilityRules>(() => {
    const t = this.tournament();
    return { modalityKey: t.modalityKey, genderId: t.genderId, categoryId: t.categoryId };
  });

  readonly capacityFull = computed(() => isRegistrationCapacityFull(this.capacity()));

  /**
   * Translation key for the "max participants" line on the tournament detail card: single sports show
   * "Max players", doubles "Max pairs" and team sports "Max teams".
   */
  readonly tournamentMaxLabelKey = computed<string>(() => {
    const tournament = this.tournament();
    const modality = (tournament.modalityKey ?? tournament.modalityName ?? '').toLowerCase();
    if (modality.includes('single') || modality.includes('individual')) {
      return 'registrations.form.tournamentMaxPlayers';
    }
    if (modality.includes('team') || modality.includes('equip')) {
      return 'registrations.form.tournamentMaxTeams';
    }
    return 'registrations.form.tournamentMaxPairs';
  });

  /** Players already holding a place in this tournament. */
  readonly registeredPlayerIds = computed(() => new Set(
    this.registrations()
      .filter(r => ACTIVE_STATUSES.has(r.status))
      .flatMap(r => r.participants.map(p => p.playerId))));

  readonly structureErrors = computed(() =>
    this.eligibilityService.validateSlotStructure([...this.participants().keys()], this.slots()));

  readonly allSlotsFilledAndValid = computed(() =>
    this.slots().length > 0
    && this.structureErrors().length === 0
    && this.validationErrors().every(e => e.valid));

  /** Submit needs valid fields, every required slot with an eligible player, and a free place to confirm. */
  readonly canSave = computed(() =>
    this.formValid()
    && this.allSlotsFilledAndValid()
    && !(this.status() === 'confirmed' && this.capacityFull())
    && !this.loadingTournament()
    && !this.saving());

  ngOnInit(): void {
    merge(this.form.statusChanges, this.form.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValid.set(this.form.valid);
        this.status.set(this.form.controls.status.value);
      });

    void this.loadTournamentRules();
  }

  /** Players of other slots and players already registered appear as unavailable in a slot's search. */
  unavailablePlayerIds(slotNumber: number): Set<string> {
    const ids = new Set(this.registeredPlayerIds());
    for (const [slot, player] of this.participants()) {
      if (slot !== slotNumber) ids.add(player.id);
    }
    return ids;
  }

  private async loadTournamentRules(): Promise<void> {
    const tournament = this.tournament();
    this.loadingTournament.set(true);
    this.loadError.set(null);
    this.config.set(this.strategyService.getConfig(tournament.sportId, tournament.tournamentTypeId));
    try {
      const [profileId, categories, genders] = await Promise.all([
        this.tournamentRepo.getEligibilityProfileId(tournament.id),
        this.categoryRepo.getAll(),
        this.genderRepo.getAll()
      ]);
      const profile = profileId ? await this.eligibilityRepo.getById(profileId) ?? null : null;
      this.categories.set(categories);
      this.genders.set(genders);
      this.eligibilityProfile.set(profile);
      this.slots.set(this.eligibilityService.resolveSlots(profile, this.tournamentRules()));
    } catch (error) {
      this.loadError.set(error instanceof Error && error.message ? error.message : 'common.unexpectedError');
      this.slots.set([]);
    } finally {
      this.loadingTournament.set(false);
    }
  }

  onParticipantSelected(event: { slotNumber: number; player: Player }): void {
    this.participants.update(map => new Map(map).set(event.slotNumber, event.player));
    this.validateAllParticipants();
  }

  onParticipantCleared(slotNumber: number): void {
    this.participants.update(map => {
      const next = new Map(map);
      next.delete(slotNumber);
      return next;
    });
    this.validateAllParticipants();
  }

  private validateAllParticipants(): void {
    const config = this.config();
    const participants = this.participants();
    if (!config || participants.size === 0) {
      this.validationErrors.set([]);
      return;
    }
    this.validationErrors.set(this.eligibilityService.validateAllParticipants(
      [...participants.entries()].map(([slotNumber, player]) => ({ slotNumber, player })),
      this.eligibilityProfile(),
      config,
      this.categories(),
      { tournament: this.tournamentRules(), genders: this.genders() }
    ));
  }

  async onSave(): Promise<void> {
    this.submitted.set(true);
    if (!this.canSave()) return;

    const value = this.form.getRawValue();
    const registration: TournamentRegistrationCreate = {
      participants: [...this.participants().entries()]
        .sort(([a], [b]) => a - b)
        .map(([slotNumber, player]) => ({ slotNumber, playerId: player.id })),
      status: value.status,
      contactEmail: value.contactEmail,
      notes: value.notes,
      publicNameConsent: value.publicNameConsent
    };

    if (await this.facade.create(registration)) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  hasValidationError(slotNumber: number): boolean {
    return this.validationErrors().some(e => e.slotNumber === slotNumber && !e.valid);
  }

  getValidationErrors(slotNumber: number): string[] {
    return this.validationErrors().find(e => e.slotNumber === slotNumber)?.errors ?? [];
  }
}
