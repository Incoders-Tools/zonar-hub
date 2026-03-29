import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RegistrationService } from '../../../../core/services/registration.service';
import { PlayerService } from '../../../../core/services/player.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Tournament, Player } from '../../../../core/models';

export interface PlayerSearchResult extends Player {
  isRegistered: boolean;
}

interface WizardStep {
  labelKey: string;
  completed: boolean;
}

interface AvailabilityForm {
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  preferredTime: string;
  notes: string;
}

@Component({
  selector: 'app-registration-wizard-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './registration-wizard-page.component.html',
  styleUrl: './registration-wizard-page.component.scss'
})
export class RegistrationWizardPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);
  private readonly playerService = inject(PlayerService);
  private readonly registrationService = inject(RegistrationService);
  private readonly notifications = inject(NotificationService);

  readonly tournament = signal<Tournament | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly currentStep = signal(0);
  readonly steps = signal<WizardStep[]>([
    { labelKey: 'registration.step.players', completed: false },
    { labelKey: 'registration.step.availability', completed: false },
    { labelKey: 'registration.step.verification', completed: false },
    { labelKey: 'registration.step.confirmation', completed: false }
  ]);

  // Step 1 - Players (independent per slot)
  readonly player1Search = signal('');
  readonly player2Search = signal('');
  readonly search1Results = signal<PlayerSearchResult[]>([]);
  readonly search2Results = signal<PlayerSearchResult[]>([]);
  readonly searching1 = signal(false);
  readonly searching2 = signal(false);
  readonly selectedPlayer1 = signal<Player | null>(null);
  readonly selectedPlayer2 = signal<Player | null>(null);
  readonly playersValid = computed(() => this.selectedPlayer1() !== null && this.selectedPlayer2() !== null);

  // Step 2 - Availability
  readonly availability = signal<AvailabilityForm>({
    friday: false,
    saturday: true,
    sunday: true,
    preferredTime: 'morning',
    notes: ''
  });

  // Step 3 - Verification
  readonly verificationCode = signal('');
  readonly codeSent = signal(false);
  readonly codeVerified = signal(false);
  private registrationId = '';

  private registeredPlayerIds = new Set<string>();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.tournamentService.loadTournaments().then(() => {
      const found = this.tournamentService.getTournamentById(id);
      this.tournament.set(found ?? null);
      this.loading.set(false);

      if (found) {
        const regs = this.registrationService.getByTournament(found.id);
        this.registeredPlayerIds = new Set(
          regs.flatMap(r => [r.player1Id, r.player2Id])
        );
      }
    });
  }

  async searchPlayersForSlot(slot: 1 | 2): Promise<void> {
    const query = slot === 1 ? this.player1Search() : this.player2Search();
    if (query.length < 2) {
      if (slot === 1) this.search1Results.set([]);
      else this.search2Results.set([]);
      return;
    }

    if (slot === 1) this.searching1.set(true);
    else this.searching2.set(true);

    try {
      const results = await this.playerService.searchPlayers(query);
      const enriched: PlayerSearchResult[] = results.map(p => ({
        ...p,
        isRegistered: this.registeredPlayerIds.has(p.id)
      }));

      if (slot === 1) this.search1Results.set(enriched);
      else this.search2Results.set(enriched);
    } finally {
      if (slot === 1) this.searching1.set(false);
      else this.searching2.set(false);
    }
  }

  selectPlayer(player: PlayerSearchResult, slot: 1 | 2): void {
    if (player.isRegistered) return;

    if (slot === 1) {
      this.selectedPlayer1.set(player);
      this.search1Results.set([]);
      this.player1Search.set('');
    } else {
      this.selectedPlayer2.set(player);
      this.search2Results.set([]);
      this.player2Search.set('');
    }
  }

  updateAvailability(field: keyof AvailabilityForm, value: unknown): void {
    this.availability.update(a => ({ ...a, [field]: value }));
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current < 3) {
      this.steps.update(steps => {
        const updated = [...steps];
        updated[current] = { ...updated[current], completed: true };
        return updated;
      });
      this.currentStep.set(current + 1);
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 0) {
      this.currentStep.set(current - 1);
    }
  }

  async sendCode(): Promise<void> {
    await this.registrationService.sendVerificationCode('mock-registration');
    this.codeSent.set(true);
    this.notifications.success('registration.codeSent');
  }

  async verifyCode(): Promise<void> {
    const valid = await this.registrationService.verifyCode('mock-registration', this.verificationCode());
    if (valid) {
      this.codeVerified.set(true);
      this.notifications.success('registration.codeVerified');
    } else {
      this.notifications.error('registration.codeInvalid');
    }
  }

  async submitRegistration(): Promise<void> {
    const t = this.tournament();
    const p1 = this.selectedPlayer1();
    const p2 = this.selectedPlayer2();
    if (!t || !p1 || !p2) return;

    this.submitting.set(true);
    try {
      const reg = await this.registrationService.submitRegistration({
        tournamentId: t.id,
        player1Id: p1.id,
        player1Name: `${p1.firstName} ${p1.lastName}`,
        player2Id: p2.id,
        player2Name: `${p2.firstName} ${p2.lastName}`,
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        genderId: t.genderId,
        genderLabel: t.genderLabel,
        statusId: 'rs2',
        statusLabel: 'Pendiente'
      });
      this.registrationId = reg.id;
      this.notifications.success('registration.success');
      this.router.navigate(['/tournaments', t.id, 'confirmed-pairs']);
    } catch {
      this.notifications.error('registration.errorSubmit');
    } finally {
      this.submitting.set(false);
    }
  }
}
