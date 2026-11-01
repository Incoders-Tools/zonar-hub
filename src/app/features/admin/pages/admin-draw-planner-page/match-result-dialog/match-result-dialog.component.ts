import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { ZhSelectComponent, ZhSelectOption } from '../../../../../shared/components/zh-select/zh-select.component';
import { matchResultValidator } from '../../../../../shared/validators/match-result.validator';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { DrawCourtsStatus } from '../../../../../core/services/draw-planner.service';
import {
  DrawCourt,
  DrawMatch,
  DrawMatchStatus,
  DrawSide,
  DrawSlot,
  TournamentDraw,
  TournamentDrawMatchResultRequest
} from '../../../../../core/models';
import {
  DEFAULT_SCORING_RULES,
  DrawScoringRules,
  MatchResultFormValue,
  MatchResultIssue,
  MatchResultLock,
  OTHER_COURT,
  clearMatchResultRequest,
  isMatchResultLocked,
  isSuperTiebreakSet,
  matchResultFormValue,
  matchResultIssueKey,
  scoringRulesFromOptions,
  setShowsTiebreak,
  statusAllowsSets,
  statusRequiresWinner,
  toMatchResultRequest
} from '../../../../../core/services/match-result-rules';

type SetRow = FormGroup<{
  home: FormControl<number | null>;
  away: FormControl<number | null>;
  tiebreakHome: FormControl<number | null>;
  tiebreakAway: FormControl<number | null>;
}>;

const STATUSES: DrawMatchStatus[] = ['scheduled', 'inProgress', 'completed', 'walkover', 'retired'];

let nextId = 0;

/**
 * Result dialog of one draw match (F3, D3/D4): status, winner, sets (third set as super tie-break when the draw
 * options say so), court (a listed court of the tournament or free text, D13) and times. Validates with the shared match result rules before emitting the D5 body;
 * the page saves it and passes back `saving` and the translated API `errorKey`.
 */
@Component({
  selector: 'app-match-result-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatIcon, TranslatePipe, AsyncButtonComponent, ConfirmDialogComponent, FormShellComponent, ZhSelectComponent],
  templateUrl: './match-result-dialog.component.html',
  styleUrl: './match-result-dialog.component.scss'
})
export class MatchResultDialogComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  /** The saved draw the match belongs to (scoring options, participants and lock rule). */
  readonly draw = input.required<TournamentDraw>();
  readonly match = input.required<DrawMatch>();
  /** The page is saving: buttons are disabled and the submit spinner shows. */
  readonly saving = input(false);
  /** Translation key of the last API failure, shown inside the dialog. */
  readonly errorKey = input<string | null>(null);
  /** Courts of the tournament (D13), loaded and cached by the page. */
  readonly courts = input<DrawCourt[]>([]);
  readonly courtsStatus = input<DrawCourtsStatus>('ready');

  readonly submitted = output<TournamentDrawMatchResultRequest>();
  readonly cleared = output<TournamentDrawMatchResultRequest>();
  readonly cancelled = output<void>();
  /** The court list failed to load and the user asked to try again. */
  readonly courtsRetried = output<void>();

  readonly idPrefix = `match-result-${nextId++}`;
  readonly statuses = STATUSES;
  readonly otherCourt = OTHER_COURT;

  /** Read by the form validator: plain fields, set in `ngOnInit` once the inputs are known. */
  private rulesValue: DrawScoringRules = DEFAULT_SCORING_RULES;
  private lockValue: MatchResultLock | undefined;

  readonly form = new FormGroup({
    status: new FormControl<DrawMatchStatus>('scheduled', { nonNullable: true }),
    winnerSide: new FormControl<DrawSide | null>(null),
    sets: new FormArray<SetRow>([]),
    courtId: new FormControl('', { nonNullable: true }),
    courtName: new FormControl('', { nonNullable: true }),
    scheduledAt: new FormControl('', { nonNullable: true }),
    startedAt: new FormControl('', { nonNullable: true }),
    finishedAt: new FormControl('', { nonNullable: true })
  }, { validators: matchResultValidator(() => this.rulesValue, () => this.lockValue) });

  private readonly value = signal<MatchResultFormValue>(this.form.getRawValue());
  readonly issue = signal<MatchResultIssue | null>(null);
  readonly showClearConfirm = signal(false);

  readonly rules = computed(() => scoringRulesFromOptions(this.draw().options));
  readonly locked = computed(() => isMatchResultLocked(this.draw(), this.match().id));
  readonly status = computed(() => this.value().status);
  readonly needsWinner = computed(() => statusRequiresWinner(this.status()));
  readonly allowsSets = computed(() => statusAllowsSets(this.status()));
  readonly startedAt = computed(() => this.value().startedAt || null);
  /** "Other court" is chosen: the free-text court input shows. */
  readonly showsCourtName = computed(() => this.value().courtId === OTHER_COURT);
  readonly courtsLoading = computed(() => this.courtsStatus() === 'loading' || this.courtsStatus() === 'idle');

  /**
   * Listed courts, then the stored court when it is no longer listed (kept with its stored name so editing the
   * result does not drop it), then "other court". The "no court" choice is the select placeholder.
   */
  readonly courtOptions = computed<ZhSelectOption[]>(() => {
    const options: ZhSelectOption[] = this.courts().map(court => ({ value: court.id, label: court.name }));
    const stored = this.match().result;
    if (stored?.courtId && !options.some(option => option.value === stored.courtId)) {
      options.push({ value: stored.courtId, label: stored.courtName || stored.courtId });
    }
    options.push({ value: OTHER_COURT, label: this.i18n.translate('adminDraw.resultDialog.courts.other') });
    return options;
  });

  readonly homeName = computed(() => this.participantName(this.match().home));
  readonly awayName = computed(() => this.participantName(this.match().away));

  /** A stored score (or a decided result) can be cleared; a scheduled row with court or time only cannot. */
  readonly canClear = computed(() => {
    const result = this.match().result;
    return result != null && (result.status !== 'scheduled' || result.sets.length > 0);
  });

  readonly canSubmit = computed(() => this.issue() == null && !this.saving());

  readonly issueText = computed(() => {
    const issue = this.issue();
    if (!issue) return '';
    const message = this.i18n.translate(matchResultIssueKey(issue));
    return issue.setIndex == null ? message : `${this.setLabel(issue.setIndex)}: ${message}`;
  });

  ngOnInit(): void {
    const rules = this.rules();
    const current = this.match().result;
    this.rulesValue = rules;
    this.lockValue = { locked: this.locked(), current };

    const initial = matchResultFormValue(current, rules);
    initial.sets.forEach(() => this.form.controls.sets.push(this.buildSetRow(), { emitEvent: false }));
    this.form.setValue(initial, { emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
    this.sync();

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sync());
  }

  get setRows(): SetRow[] {
    return this.form.controls.sets.controls;
  }

  setLabel(index: number): string {
    return isSuperTiebreakSet(index, this.rules())
      ? this.i18n.translate('adminDraw.resultDialog.superTiebreak')
      : this.i18n.translate('adminDraw.resultDialog.setLabel').replace('{n}', String(index + 1));
  }

  showsTiebreak(index: number): boolean {
    const row = this.value().sets[index];
    return !!row && setShowsTiebreak(row, index, this.rules());
  }

  inputLabel(index: number, side: DrawSide, tiebreak = false): string {
    const name = side === 'home' ? this.homeName() : this.awayName();
    const key = tiebreak ? 'adminDraw.resultDialog.aria.tiebreak' : 'adminDraw.resultDialog.aria.games';
    return this.i18n.translate(key).replace('{set}', this.setLabel(index)).replace('{name}', name);
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitted.emit(toMatchResultRequest(this.form.getRawValue(), this.rules()));
  }

  requestClear(): void {
    if (this.canClear() && !this.locked() && !this.saving()) {
      this.showClearConfirm.set(true);
    }
  }

  confirmClear(): void {
    this.showClearConfirm.set(false);
    this.cleared.emit(clearMatchResultRequest(this.match().result));
  }

  cancelClear(): void {
    this.showClearConfirm.set(false);
  }

  retryCourts(): void {
    this.courtsRetried.emit();
  }

  cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  private sync(): void {
    this.value.set(this.form.getRawValue());
    this.issue.set((this.form.errors?.['matchResult'] as MatchResultIssue | undefined) ?? null);
  }

  private buildSetRow(): SetRow {
    return new FormGroup({
      home: new FormControl<number | null>(null),
      away: new FormControl<number | null>(null),
      tiebreakHome: new FormControl<number | null>(null),
      tiebreakAway: new FormControl<number | null>(null)
    });
  }

  private participantName(slot: DrawSlot): string {
    const id = slot.kind === 'participant' ? slot.participantId : slot.resolvedParticipantId;
    return this.draw().participants.find(participant => participant.id === id)?.displayName ?? '';
  }
}
