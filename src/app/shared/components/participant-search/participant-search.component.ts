import { Component, input, output, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Player } from '../../../core/models/player.model';
import { Registration, ParticipantAvailabilityState, ParticipantSearchResult } from '../../../core/models/registration.model';
import { TournamentEligibilitySlot } from '../../../core/models/tournament-admin.model';
import { Category } from '../../../core/models/catalog.model';
import { SportParticipantConfig } from '../../../core/models/sport-config.model';
import { MockPlayerRepository } from '../../../core/repositories/mock/mock-player.repository';
import { EligibilityValidationService } from '../../../core/services/eligibility-validation.service';

@Component({
  selector: 'app-participant-search',
  standalone: true,
  imports: [ReactiveFormsModule, MatIcon, TranslatePipe],
  templateUrl: './participant-search.component.html',
  styleUrl: './participant-search.component.scss'
})
export class ParticipantSearchComponent implements OnInit {
  private readonly playerRepo = inject(MockPlayerRepository);
  private readonly eligibilityService = inject(EligibilityValidationService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  readonly slotNumber = input.required<number>();
  readonly slotLabel = input<string>('');
  readonly tournamentId = input.required<string>();
  readonly sportId = input.required<string>();
  readonly eligibilitySlot = input<TournamentEligibilitySlot | null>(null);
  readonly config = input.required<SportParticipantConfig>();
  readonly existingRegistrations = input<Registration[]>([]);
  readonly selectedPlayerIds = input<Set<string>>(new Set());
  readonly disabled = input(false);
  readonly categories = input<Category[]>([]);
  readonly habitualPartnerSuggestion = input<Player | null>(null);
  readonly initialPlayer = input<Player | null>(null);

  // Outputs
  readonly playerSelected = output<{ slotNumber: number; player: Player }>();
  readonly playerCleared = output<number>();

  // State
  readonly searchControl = new FormControl('');
  readonly selectedPlayer = signal<Player | null>(null);
  readonly searchResults = signal<ParticipantSearchResult[]>([]);
  readonly searching = signal(false);
  readonly showResults = signal(false);
  readonly partnerDismissed = signal(false);

  ngOnInit(): void {
    const pre = this.initialPlayer();
    if (pre) {
      this.selectedPlayer.set(pre);
    }

    this.searchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => (v?.length ?? 0) >= 2)
    ).subscribe(query => {
      if (query) this.performSearch(query);
    });
  }

  private async performSearch(query: string): Promise<void> {
    this.searching.set(true);
    this.showResults.set(true);
    try {
      const results = await this.playerRepo.search(query);
      const enriched: ParticipantSearchResult[] = results.map(player => ({
        ...player,
        availabilityState: this.getAvailability(player),
        incompatibilityReasons: []
      }));
      this.searchResults.set(enriched);
    } finally {
      this.searching.set(false);
    }
  }

  private getAvailability(player: Player): ParticipantAvailabilityState {
    // Already selected in another slot
    if (this.selectedPlayerIds().has(player.id)) return 'alreadyRegistered';

    return this.eligibilityService.getPlayerAvailabilityState(
      player,
      this.tournamentId(),
      this.eligibilitySlot(),
      this.config(),
      this.existingRegistrations(),
      this.categories()
    );
  }

  selectPlayer(player: ParticipantSearchResult): void {
    if (player.availabilityState !== 'available' || this.disabled()) return;
    this.selectedPlayer.set(player);
    this.searchResults.set([]);
    this.showResults.set(false);
    this.searchControl.setValue('');
    this.playerSelected.emit({ slotNumber: this.slotNumber(), player });
  }

  clearSelection(): void {
    this.selectedPlayer.set(null);
    this.playerCleared.emit(this.slotNumber());
  }

  acceptPartnerSuggestion(): void {
    const partner = this.habitualPartnerSuggestion();
    if (partner) {
      this.selectedPlayer.set(partner);
      this.playerSelected.emit({ slotNumber: this.slotNumber(), player: partner });
    }
    this.partnerDismissed.set(true);
  }

  dismissPartner(): void {
    this.partnerDismissed.set(true);
  }

  isAvailable(state: ParticipantAvailabilityState): boolean {
    return state === 'available';
  }
}
