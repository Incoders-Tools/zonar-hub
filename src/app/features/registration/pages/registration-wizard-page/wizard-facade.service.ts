import { Injectable, inject, signal, computed } from '@angular/core';
import { Tournament, Player, Registration, Category } from '../../../../core/models';
import { TournamentEligibilityProfile, TournamentEligibilitySlot } from '../../../../core/models/tournament-admin.model';
import { SportParticipantConfig } from '../../../../core/models/sport-config.model';
import { TournamentService } from '../../../../core/services/tournament.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { RegistrationStrategyService } from '../../../../core/services/registration-strategy.service';
import { EligibilityValidationService } from '../../../../core/services/eligibility-validation.service';
import { ApiEligibilityProfileRepository } from '../../../../core/repositories/api/api-eligibility-profile.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiPlayerRepository } from '../../../../core/repositories/api/api-player.repository';

export interface WizardSlot {
  slotNumber: number;
  label: string | null;
  genderId: string | null;
  categoryId: string | null;
  minAge: number | null;
  maxAge: number | null;
  required: boolean;
}

@Injectable()
export class WizardFacadeService {
  private readonly tournamentService = inject(TournamentService);
  private readonly registrationService = inject(RegistrationService);
  private readonly strategyService = inject(RegistrationStrategyService);
  private readonly eligibilityService = inject(EligibilityValidationService);
  private readonly eligibilityProfileRepo = inject(ApiEligibilityProfileRepository);
  private readonly categoryRepo = inject(ApiCategoryRepository);
  private readonly playerRepo = inject(ApiPlayerRepository);

  readonly tournament = signal<Tournament | null>(null);
  readonly config = signal<SportParticipantConfig | null>(null);
  readonly eligibilityProfile = signal<TournamentEligibilityProfile | null>(null);
  readonly participants = signal<Map<number, Player>>(new Map());
  readonly existingRegistrations = signal<Registration[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly habitualPartnerSuggestion = signal<Player | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  readonly slotCount = computed(() => {
    const cfg = this.config();
    return cfg ? cfg.maxPlayers : 0;
  });

  readonly allSlotsValid = computed(() => {
    const slotsArr = this.slots();
    const participantsMap = this.participants();
    const requiredSlots = slotsArr.filter(s => s.required);
    if (requiredSlots.length === 0) return false;
    return requiredSlots.every(s => participantsMap.has(s.slotNumber));
  });

  readonly slots = computed<WizardSlot[]>(() => {
    const profile = this.eligibilityProfile();
    const cfg = this.config();

    if (profile?.slots && profile.slots.length > 0) {
      return profile.slots
        .slice()
        .sort((a, b) => a.slotNumber - b.slotNumber)
        .map(s => ({
          slotNumber: s.slotNumber,
          label: s.label,
          genderId: s.genderId,
          categoryId: s.categoryId,
          minAge: s.minAge,
          maxAge: s.maxAge,
          required: s.required
        }));
    }

    if (cfg) {
      const count = cfg.maxPlayers;
      return Array.from({ length: count }, (_, i) => ({
        slotNumber: i + 1,
        label: null,
        genderId: null,
        categoryId: null,
        minAge: null,
        maxAge: null,
        required: true
      }));
    }

    return [];
  });

  async loadTournament(id: string): Promise<void> {
    this.loading.set(true);
    try {
      await this.tournamentService.loadTournaments();
      const found = this.tournamentService.getTournamentById(id);
      this.tournament.set(found ?? null);

      if (found) {
        const regs = this.registrationService.getByTournament(found.id);
        this.existingRegistrations.set(regs);

        const cfg = this.strategyService.getConfig(found.sportId, found.tournamentTypeId);
        this.config.set(cfg);

        if (found.eligibilityProfileId) {
          const profile = await this.eligibilityProfileRepo.getById(found.eligibilityProfileId);
          this.eligibilityProfile.set(profile ?? null);
        }

        const cats = await this.categoryRepo.getAll();
        this.categories.set(cats);
      }
    } finally {
      this.loading.set(false);
    }
  }

  selectParticipant(slotNumber: number, player: Player): void {
    this.participants.update(map => {
      const updated = new Map(map);
      updated.set(slotNumber, player);
      return updated;
    });

    if (slotNumber === 1 && this.config()?.allowsHabitualPartner) {
      this.loadHabitualPartnerSuggestion(player.id);
    }
  }

  clearParticipant(slotNumber: number): void {
    this.participants.update(map => {
      const updated = new Map(map);
      updated.delete(slotNumber);
      return updated;
    });

    if (slotNumber === 1) {
      this.habitualPartnerSuggestion.set(null);
    }
  }

  getOtherSelectedPlayerIds(slotNumber: number): Set<string> {
    const result = new Set<string>();
    const map = this.participants();
    for (const [slot, player] of map.entries()) {
      if (slot !== slotNumber) {
        result.add(player.id);
      }
    }
    return result;
  }

  getEligibilitySlotForSlotNumber(slotNumber: number): TournamentEligibilitySlot | null {
    const profile = this.eligibilityProfile();
    if (!profile?.slots) return null;
    return profile.slots.find(s => s.slotNumber === slotNumber) ?? null;
  }

  async submitRegistration(availability: {
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    preferredTime: string;
    notes: string;
  }): Promise<Registration> {
    const t = this.tournament();
    if (!t) throw new Error('No tournament loaded');

    const participantsMap = this.participants();
    if (participantsMap.size < 1) throw new Error('No participants selected');

    const participantsArray = Array.from(participantsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([slotNumber, player]) => ({
        slotNumber,
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        categoryId: player.categoryId,
        genderId: player.genderId
      }));

    // Check for duplicate pair
    if (participantsArray.length >= 2) {
      const isDuplicate = this.registrationService.isDuplicatePair(
        t.id,
        participantsArray[0].playerId,
        participantsArray[1].playerId
      );
      if (isDuplicate) {
        throw new Error('registration.duplicatePair');
      }
    }

    // Validate eligibility for all participants
    const validationInputs = participantsArray.map(p => ({
      slotNumber: p.slotNumber,
      player: participantsMap.get(p.slotNumber)!
    }));

    const validationResults = this.eligibilityService.validateAllParticipants(
      validationInputs,
      this.eligibilityProfile(),
      this.config()!,
      this.categories()
    );

    const invalidResults = validationResults.filter(r => !r.valid);
    if (invalidResults.length > 0) {
      const allErrors = invalidResults.flatMap(r => r.errors);
      throw new Error(allErrors.join(', '));
    }

    this.submitting.set(true);
    try {
      // Build backward-compat fields
      const p1 = participantsArray[0];
      const p2 = participantsArray.length >= 2 ? participantsArray[1] : null;

      const reg = await this.registrationService.submitRegistration({
        tournamentId: t.id,
        participants: participantsArray,
        player1Id: p1.playerId,
        player1Name: p1.playerName,
        player2Id: p2?.playerId ?? '',
        player2Name: p2?.playerName ?? '',
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        genderId: t.genderId,
        genderLabel: t.genderLabel,
        statusId: 'rs2',
        statusLabel: 'Pendiente',
        source: 'wizard'
      });

      return reg;
    } finally {
      this.submitting.set(false);
    }
  }

  async sendVerificationCode(registrationId: string): Promise<void> {
    await this.registrationService.sendVerificationCode(registrationId);
  }

  async verifyCode(registrationId: string, code: string): Promise<boolean> {
    return this.registrationService.verifyCode(registrationId, code);
  }

  private async loadHabitualPartnerSuggestion(playerId: string): Promise<void> {
    try {
      const partner = await this.playerRepo.getByHabitualPartner(playerId);
      this.habitualPartnerSuggestion.set(partner ?? null);
    } catch {
      this.habitualPartnerSuggestion.set(null);
    }
  }
}
