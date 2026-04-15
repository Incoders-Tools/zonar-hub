import { Component, inject, input, output, signal, computed, OnInit, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { merge } from 'rxjs';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { ParticipantSearchComponent } from '../../../../../shared/components/participant-search/participant-search.component';
import { AvailabilitySelectorComponent, AvailabilitySelection } from '../../../../../shared/components/availability-selector/availability-selector.component';
import { FormatDatePipe } from '../../../../../shared/pipes/format-date.pipe';
import { RegistrationStrategyService } from '../../../../../core/services/registration-strategy.service';
import { EligibilityValidationService } from '../../../../../core/services/eligibility-validation.service';
import { MockEligibilityProfileRepository } from '../../../../../core/repositories/mock/mock-eligibility-profile.repository';
import { TournamentService } from '../../../../../core/services/tournament.service';
import { MockCategoryRepository } from '../../../../../core/repositories/mock/mock-category.repository';
import { RegistrationService } from '../../../../../core/services/registration.service';
import { RegistrationFacadeService } from '../registration-facade.service';
import { Registration, RegistrationParticipant, RegistrationSource } from '../../../../../core/models/registration.model';
import { Tournament } from '../../../../../core/models/tournament.model';
import { TournamentEligibilityProfile, TournamentEligibilitySlot } from '../../../../../core/models/tournament-admin.model';
import { Category } from '../../../../../core/models/catalog.model';
import { Player } from '../../../../../core/models/player.model';
import { SportParticipantConfig, ParticipantValidationResult } from '../../../../../core/models/sport-config.model';

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
    AvailabilitySelectorComponent,
    FormatDatePipe
  ],
  templateUrl: './registration-form-panel.component.html',
  styleUrl: './registration-form-panel.component.scss'
})
export class RegistrationFormPanelComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly strategyService = inject(RegistrationStrategyService);
  private readonly eligibilityService = inject(EligibilityValidationService);
  private readonly eligibilityRepo = inject(MockEligibilityProfileRepository);
  private readonly tournamentService = inject(TournamentService);
  private readonly categoryRepo = inject(MockCategoryRepository);
  private readonly registrationService = inject(RegistrationService);
  private readonly facade = inject(RegistrationFacadeService);

  // Inputs
  readonly registration = input<Registration | null>(null);
  readonly saving = input(false);

  // Outputs
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  // Form
  readonly form = new FormGroup({
    tournamentId: new FormControl('', Validators.required),
    source: new FormControl('admin'),
    observations: new FormControl('')
  });

  // State
  readonly tournaments = signal<Tournament[]>([]);
  readonly selectedTournament = signal<Tournament | null>(null);
  readonly config = signal<SportParticipantConfig | null>(null);
  readonly eligibilityProfile = signal<TournamentEligibilityProfile | null>(null);
  readonly slots = signal<TournamentEligibilitySlot[]>([]);
  readonly participants = signal<Map<number, Player>>(new Map());
  readonly categories = signal<Category[]>([]);
  readonly existingRegistrations = signal<Registration[]>([]);
  readonly validationErrors = signal<ParticipantValidationResult[]>([]);
  readonly submitted = signal(false);
  readonly loadingTournament = signal(false);
  readonly formValid = signal(false);
  readonly availabilitySelection = signal<AvailabilitySelection | null>(null);

  private static readonly DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  readonly tournamentDays = computed<string[]>(() => {
    const tournament = this.selectedTournament();
    if (!tournament?.startDate || !tournament?.endDate) return ['friday', 'saturday', 'sunday'];

    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return ['friday', 'saturday', 'sunday'];

    const days: string[] = [];
    const current = new Date(start);
    // Cap at 14 days to prevent runaway loops
    const maxDays = 14;
    let count = 0;
    while (current <= end && count < maxDays) {
      days.push(RegistrationFormPanelComponent.DAY_NAMES[current.getDay()]);
      current.setDate(current.getDate() + 1);
      count++;
    }

    return days.length > 0 ? days : ['friday', 'saturday', 'sunday'];
  });

  readonly isEditing = computed(() => !!this.registration());

  readonly selectedPlayerIds = computed(() => {
    const map = this.participants();
    return new Set(Array.from(map.values()).map(p => p.id));
  });

  readonly allSlotsFilledAndValid = computed(() => {
    const currentSlots = this.slots();
    const currentParticipants = this.participants();
    if (currentSlots.length === 0) return false;

    const requiredSlots = currentSlots.filter(s => s.required);
    for (const slot of requiredSlots) {
      if (!currentParticipants.has(slot.slotNumber)) return false;
    }

    return this.validationErrors().length === 0 || this.validationErrors().every(e => e.valid);
  });

  readonly canSave = computed(() => {
    return this.formValid() && this.allSlotsFilledAndValid() && !this.saving();
  });

  constructor() {
    effect(() => {
      const reg = this.registration();
      if (reg) {
        this.populateFromRegistration(reg);
      }
    });
  }

  ngOnInit(): void {
    this.loadTournaments();
    this.loadCategories();

    merge(this.form.statusChanges, this.form.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValid.set(this.form.valid);
      });

    this.form.get('tournamentId')!.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (value) {
        this.onTournamentChanged(value);
      } else {
        this.resetTournamentState();
      }
    });
  }

  private async loadTournaments(): Promise<void> {
    const allTournaments = this.tournamentService.tournaments();
    this.tournaments.set(allTournaments);
  }

  private async loadCategories(): Promise<void> {
    const cats = await this.categoryRepo.getAll();
    this.categories.set(cats);
  }

  private populateFromRegistration(reg: Registration): void {
    this.form.patchValue({
      tournamentId: reg.tournamentId,
      source: reg.source,
      observations: ''
    });

    // Disable tournament selection when editing
    this.form.get('tournamentId')!.disable();
  }

  async onTournamentChanged(tournamentId: string): Promise<void> {
    this.loadingTournament.set(true);
    this.resetTournamentState();

    const tournament = this.tournamentService.getTournamentById(tournamentId);
    if (!tournament) {
      this.loadingTournament.set(false);
      return;
    }

    this.selectedTournament.set(tournament);

    // Get strategy config based on sport + tournament type
    const strategyConfig = this.strategyService.getConfig(tournament.sportId, tournament.tournamentTypeId);
    this.config.set(strategyConfig);

    // Load eligibility profile if configured
    if (tournament.eligibilityProfileId) {
      const profile = await this.eligibilityRepo.getById(tournament.eligibilityProfileId);
      if (profile) {
        this.eligibilityProfile.set(profile);
        this.slots.set(profile.slots ?? []);
      } else {
        this.buildDefaultSlots(strategyConfig);
      }
    } else {
      this.buildDefaultSlots(strategyConfig);
    }

    // Load existing registrations for this tournament
    const existing = this.registrationService.getByTournament(tournamentId);
    this.existingRegistrations.set(existing);

    this.loadingTournament.set(false);
  }

  private buildDefaultSlots(config: SportParticipantConfig): void {
    const strategy = this.strategyService.getStrategy(config.sportKey, '');
    const slotCount = config.maxPlayers;
    const defaultSlots: TournamentEligibilitySlot[] = [];

    for (let i = 1; i <= slotCount; i++) {
      defaultSlots.push({
        slotNumber: i,
        genderId: null,
        categoryId: null,
        minAge: null,
        maxAge: null,
        label: null,
        required: i <= config.minPlayers
      });
    }

    this.slots.set(defaultSlots);
  }

  private resetTournamentState(): void {
    this.selectedTournament.set(null);
    this.config.set(null);
    this.eligibilityProfile.set(null);
    this.slots.set([]);
    this.participants.set(new Map());
    this.existingRegistrations.set([]);
    this.validationErrors.set([]);
  }

  onParticipantSelected(event: { slotNumber: number; player: Player }): void {
    this.participants.update(map => {
      const next = new Map(map);
      next.set(event.slotNumber, event.player);
      return next;
    });
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
    const currentConfig = this.config();
    const currentProfile = this.eligibilityProfile();
    const currentParticipants = this.participants();
    const cats = this.categories();

    if (!currentConfig || currentParticipants.size === 0) {
      this.validationErrors.set([]);
      return;
    }

    const participantList = Array.from(currentParticipants.entries()).map(([slotNumber, player]) => ({
      slotNumber,
      player
    }));

    const results = this.eligibilityService.validateAllParticipants(
      participantList,
      currentProfile,
      currentConfig,
      cats
    );

    this.validationErrors.set(results);
  }

  async onSave(): Promise<void> {
    this.submitted.set(true);

    if (!this.canSave()) return;

    const formValue = this.form.getRawValue();
    const currentParticipants = this.participants();
    const tournament = this.selectedTournament();

    if (!tournament) return;

    const participantsArray: RegistrationParticipant[] = Array.from(currentParticipants.entries()).map(
      ([slotNumber, player]) => ({
        slotNumber,
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        categoryId: player.categoryId,
        categoryName: player.categoryName,
        genderId: player.genderId,
        genderLabel: player.genderLabel
      })
    );

    // Build backward-compat fields from first two participants
    const p1 = participantsArray[0];
    const p2 = participantsArray[1] ?? p1;

    const payload: Omit<Registration, 'id' | 'registeredAt'> = {
      tournamentId: formValue.tournamentId!,
      tournamentName: tournament.name,
      eligibilityProfileId: tournament.eligibilityProfileId,
      participants: participantsArray,
      player1Id: p1?.playerId ?? '',
      player1Name: p1?.playerName ?? '',
      player2Id: p2?.playerId ?? '',
      player2Name: p2?.playerName ?? '',
      categoryId: p1?.categoryId ?? '',
      categoryName: p1?.categoryName ?? '',
      genderId: p1?.genderId ?? '',
      genderLabel: p1?.genderLabel ?? '',
      statusId: 'rs2',
      statusLabel: 'Pendiente',
      source: (formValue.source ?? 'admin') as RegistrationSource
    };

    const editReg = this.registration();
    const success = await this.facade.save(payload, editReg?.id);

    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onAvailabilityChanged(selection: AvailabilitySelection): void {
    this.availabilitySelection.set(selection);
  }

  hasValidationError(slotNumber: number): boolean {
    return this.validationErrors().some(e => e.slotNumber === slotNumber && !e.valid);
  }

  getValidationErrors(slotNumber: number): string[] {
    const result = this.validationErrors().find(e => e.slotNumber === slotNumber);
    return result?.errors ?? [];
  }
}
