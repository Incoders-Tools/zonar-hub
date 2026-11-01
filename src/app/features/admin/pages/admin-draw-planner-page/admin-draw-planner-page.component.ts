import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { ZhSelectComponent, ZhSelectOption } from '../../../../shared/components/zh-select/zh-select.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { ChildCollectionGridComponent, ChildGridColumn } from '../../../../shared/components/child-collection-grid/child-collection-grid.component';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TournamentBracketComponent } from '../../../../shared/components/tournament-bracket/tournament-bracket.component';
import { MatchResultDialogComponent } from './match-result-dialog/match-result-dialog.component';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { DrawPlannerService } from '../../../../core/services/draw-planner.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  DrawFormat,
  DrawMatch,
  DrawParticipationFormat,
  DrawRandomizationMode,
  Tournament,
  TournamentDraw,
  TournamentDrawMatchResultRequest,
  TournamentDrawRequest
} from '../../../../core/models';
import { matchResultAvailability } from '../../../../core/services/match-result-rules';
import {
  DRAW_MAX_PARTICIPANTS,
  DRAW_MIN_PARTICIPANTS,
  DrawFormatSettings,
  DrawParticipantEntry,
  DrawParticipantIssue,
  DrawParticipantPasteResult,
  drawFormatSettingsFromOptions,
  drawOptionsForRequest,
  isValidDrawSeed,
  parseDrawParticipantPaste,
  toDrawRequestParticipants,
  validateDrawParticipantEntries
} from '../../../../core/services/draw-participant-entries';

type DrawAction = 'preview' | 'regenerate' | 'save' | 'publish' | 'unpublish' | 'delete';

type ParticipantRow = FormGroup<{
  /** Draw-local id of a loaded participant; null for new rows. */
  id: FormControl<string | null>;
  /** Pair: optional override of "Member 1 / Member 2"; team: the team name. Unused for individual. */
  displayName: FormControl<string>;
  member1: FormControl<string>;
  member2: FormControl<string>;
  /** Team members separated by "/". */
  teamMembers: FormControl<string>;
  seedRank: FormControl<number | null>;
  separationKey: FormControl<string>;
}>;

const DEFAULT_SETTINGS: DrawFormatSettings = {
  thirdPlaceMatch: false,
  legs: 1,
  groupSizing: 'size',
  groupCount: 2,
  groupSize: 4,
  qualifiersPerGroup: 2,
  thirdSetSuperTiebreak: true
};

const FORMATS: DrawFormat[] = ['singleElimination', 'roundRobin', 'groupsThenKnockout'];
const PARTICIPATION_FORMATS: DrawParticipationFormat[] = ['pair', 'individual', 'team'];
const RANDOMIZATION_MODES: DrawRandomizationMode[] = ['seeded', 'random'];

function seedValidator(control: AbstractControl<string>): ValidationErrors | null {
  return isValidDrawSeed(control.value) ? null : { seed: true };
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

/** Tournament modality → participation format: singles are individual, team modalities team, the rest pairs. */
function participationFormatFor(tournament: Tournament | null): DrawParticipationFormat {
  const modality = (tournament?.modalityKey ?? tournament?.modalityName ?? '').toLowerCase();
  if (modality.includes('single') || modality.includes('individual')) return 'individual';
  if (modality.includes('team') || modality.includes('equip')) return 'team';
  return 'pair';
}

/**
 * Admin draw page (D9) at `/admin/tournaments/:tournamentId/draw`: participants (rows or paste), format and
 * options, randomization, preview, save draft, publish/unpublish and delete for the tournament's single draw (D1).
 * Without a tournament id (`/admin/draw-planner`) it is a tournament picker that opens the draw page.
 */
@Component({
  selector: 'app-admin-draw-planner-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIcon,
    TranslatePipe,
    AsyncButtonComponent,
    ConfirmDialogComponent,
    HelpButtonComponent,
    ZhSelectComponent,
    FormShellComponent,
    ChildCollectionGridComponent,
    ProgressBarComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    TournamentBracketComponent,
    MatchResultDialogComponent
  ],
  providers: [DrawPlannerService],
  templateUrl: './admin-draw-planner-page.component.html',
  styleUrl: './admin-draw-planner-page.component.scss'
})
export class AdminDrawPlannerPageComponent {
  protected readonly planner = inject(DrawPlannerService);
  protected readonly tournamentService = inject(TournamentService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly minParticipants = DRAW_MIN_PARTICIPANTS;
  readonly maxParticipants = DRAW_MAX_PARTICIPANTS;

  readonly form = new FormGroup({
    format: new FormControl<DrawFormat>('singleElimination', { nonNullable: true }),
    participationFormat: new FormControl<DrawParticipationFormat>('pair', { nonNullable: true }),
    randomizationMode: new FormControl<DrawRandomizationMode>('seeded', { nonNullable: true }),
    seed: new FormControl('', { nonNullable: true, validators: [seedValidator] }),
    thirdPlaceMatch: new FormControl(DEFAULT_SETTINGS.thirdPlaceMatch, { nonNullable: true }),
    legs: new FormControl(DEFAULT_SETTINGS.legs, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(2)] }),
    groupSizing: new FormControl<'count' | 'size'>(DEFAULT_SETTINGS.groupSizing, { nonNullable: true }),
    groupCount: new FormControl(DEFAULT_SETTINGS.groupCount, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    groupSize: new FormControl(DEFAULT_SETTINGS.groupSize, { nonNullable: true, validators: [Validators.required, Validators.min(2)] }),
    qualifiersPerGroup: new FormControl(DEFAULT_SETTINGS.qualifiersPerGroup, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    thirdSetSuperTiebreak: new FormControl(DEFAULT_SETTINGS.thirdSetSuperTiebreak, { nonNullable: true }),
    participants: new FormArray<ParticipantRow>([])
  });

  /** Paste box: one participant per line (syntax in `parseDrawParticipantPaste` and the page help). */
  readonly pasteControl = new FormControl('', { nonNullable: true });
  /** Tournament picker of `/admin/draw-planner`. */
  readonly pickerControl = new FormControl('', { nonNullable: true });

  readonly tournamentId = signal<string | null>(null);
  readonly busyAction = signal<DrawAction | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly pasteResult = signal<DrawParticipantPasteResult | null>(null);
  readonly progress = signal(0);
  /** Match whose result dialog is open (F3). */
  readonly resultMatch = signal<DrawMatch | null>(null);
  readonly resultSaving = signal(false);
  /** Translation key of the last result save failure, shown inside the dialog. */
  readonly resultErrorKey = signal<string | null>(null);
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  /** Raw form value as a signal, so the computed state below follows every edit. */
  private readonly formValue = signal(this.form.getRawValue());
  private readonly formValid = signal(this.form.valid);

  readonly participationFormat = computed(() => this.formValue().participationFormat);
  readonly format = computed(() => this.formValue().format);

  readonly entries = computed<DrawParticipantEntry[]>(() => {
    const format = this.participationFormat();
    return this.formValue().participants.map(row => this.rowToEntry(row, format));
  });

  readonly issues = computed(() => validateDrawParticipantEntries(this.entries(), this.participationFormat()));

  readonly draw = this.planner.draw;
  readonly shownDraw = this.planner.shownDraw;
  readonly hasResults = this.planner.hasResults;
  readonly isPreview = computed(() => this.planner.preview() != null);
  readonly drawStatus = computed(() => this.draw()?.status ?? 'none');
  readonly isBusy = computed(() => this.busyAction() != null);
  readonly isGenerating = computed(() => this.busyAction() === 'preview' || this.busyAction() === 'regenerate');

  /** Preview, regenerate and save need a valid form and participant list, no results (D1) and no running action. */
  readonly canSubmit = computed(() =>
    this.formValid() && this.issues().length === 0 && !this.hasResults() && !this.isBusy());
  readonly canPublish = computed(() =>
    this.drawStatus() === 'draft' && !this.isPreview() && !this.isBusy());
  readonly canDelete = computed(() =>
    this.drawStatus() === 'draft' && !this.hasResults() && !this.isBusy());
  /** Results are entered on the saved draw only, never on an unsaved preview. */
  readonly canEnterResults = computed(() => this.draw() != null && !this.isPreview());

  readonly participantColumns = computed<ChildGridColumn[]>(() => {
    const seed: ChildGridColumn = { key: 'seedRank', labelKey: 'adminDraw.participants.columns.seed', type: 'number', width: '8rem' };
    const club: ChildGridColumn = { key: 'separationKey', labelKey: 'adminDraw.participants.columns.club', type: 'text' };
    switch (this.participationFormat()) {
      case 'individual':
        return [{ key: 'member1', labelKey: 'adminDraw.participants.columns.player', type: 'text', required: true }, seed, club];
      case 'team':
        return [
          { key: 'displayName', labelKey: 'adminDraw.participants.columns.team', type: 'text', required: true },
          { key: 'teamMembers', labelKey: 'adminDraw.participants.columns.teamMembers', type: 'text', required: true },
          seed,
          club
        ];
      default:
        return [
          { key: 'member1', labelKey: 'adminDraw.participants.columns.player1', type: 'text', required: true },
          { key: 'member2', labelKey: 'adminDraw.participants.columns.player2', type: 'text', required: true },
          { key: 'displayName', labelKey: 'adminDraw.participants.columns.displayNameOptional', type: 'text' },
          seed,
          club
        ];
    }
  });

  readonly formatOptions = computed<ZhSelectOption[]>(() =>
    FORMATS.map(value => ({ value, label: this.t(`adminDraw.options.format.${value}`) })));
  readonly participationOptions = computed<ZhSelectOption[]>(() =>
    PARTICIPATION_FORMATS.map(value => ({ value, label: this.t(`adminDraw.options.participation.${value}`) })));
  readonly randomizationOptions = computed<ZhSelectOption[]>(() =>
    RANDOMIZATION_MODES.map(value => ({
      value, label: this.t(`adminDraw.randomization.mode.${value}`), description: this.t(`adminDraw.randomization.mode.${value}Hint`)
    })));
  readonly legsOptions = computed<ZhSelectOption[]>(() =>
    [1, 2].map(legs => ({ value: String(legs), label: this.t(`adminDraw.options.legs.${legs}`) })));
  readonly tournamentOptions = computed<ZhSelectOption[]>(() =>
    this.tournamentService.tournaments().map(tournament => ({ value: tournament.id, label: tournament.name })));

  /** Separation conflicts of the shown draw with participant names resolved. */
  readonly conflicts = computed(() => {
    const draw = this.shownDraw();
    if (!draw) return [];
    const names = new Map(draw.participants.map(participant => [participant.id, participant.displayName]));
    return draw.separationConflicts.map(conflict => ({
      key: conflict.key,
      kindKey: `adminDraw.conflicts.kind.${conflict.kind}`,
      names: conflict.participantIds.map(id => names.get(id) ?? id).join(', ')
    }));
  });

  readonly progressStageKey = computed(() => {
    const value = this.progress();
    if (value < 35) return 'adminDraw.progress.validating';
    if (value < 75) return 'adminDraw.progress.generating';
    return 'adminDraw.progress.rendering';
  });

  readonly helpSections: HelpSection[] = [
    { titleKey: 'adminDraw.help.overview.title', contentKey: 'adminDraw.help.overview.content' },
    {
      titleKey: 'adminDraw.help.steps.title',
      items: ['adminDraw.help.steps.step1', 'adminDraw.help.steps.step2', 'adminDraw.help.steps.step3', 'adminDraw.help.steps.step4']
    },
    {
      titleKey: 'adminDraw.help.paste.title',
      items: ['adminDraw.help.paste.pair', 'adminDraw.help.paste.individual', 'adminDraw.help.paste.team', 'adminDraw.help.paste.markers']
    },
    { titleKey: 'adminDraw.help.states.title', contentKey: 'adminDraw.help.states.content' },
    { titleKey: 'adminDraw.help.results.title', contentKey: 'adminDraw.help.results.content' },
    {
      titleKey: 'adminDraw.help.resultEntry.title',
      items: [
        'adminDraw.help.resultEntry.open',
        'adminDraw.help.resultEntry.sets',
        'adminDraw.help.resultEntry.superTiebreak',
        'adminDraw.help.resultEntry.statuses',
        'adminDraw.help.resultEntry.lock',
        'adminDraw.help.resultEntry.clear'
      ]
    },
    { titleKey: 'adminDraw.help.visibility.title', contentKey: 'adminDraw.help.visibility.content' }
  ];

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncFormState());
    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => this.formValid.set(this.form.valid));
    this.pasteControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.pasteResult.set(null));
    this.pickerControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(id => {
      if (id) void this.router.navigate(['/admin/tournaments', id, 'draw']);
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const id = params.get('tournamentId');
      this.tournamentId.set(id);
      if (id) {
        void this.loadTournament(id);
      } else {
        void this.tournamentService.loadTournaments();
      }
    });
    this.destroyRef.onDestroy(() => this.stopProgress());
  }

  get participants(): FormArray<ParticipantRow> {
    return this.form.controls.participants;
  }

  readonly createRow = (): ParticipantRow => this.buildRow();

  issueText(issue: DrawParticipantIssue, prefixKey: string): string {
    const message = interpolate(this.t(`adminDraw.participants.issues.${issue.key}`), {
      min: DRAW_MIN_PARTICIPANTS, max: DRAW_MAX_PARTICIPANTS
    });
    return issue.position == null ? message : `${interpolate(this.t(prefixKey), { n: issue.position })}: ${message}`;
  }

  countText(): string {
    return interpolate(this.t('adminDraw.participants.count'), {
      count: this.entries().length, min: DRAW_MIN_PARTICIPANTS, max: DRAW_MAX_PARTICIPANTS
    });
  }

  async reload(): Promise<void> {
    const id = this.tournamentId();
    if (id) await this.loadTournament(id);
  }

  /** Replaces the participant rows (paste import, loaded draw). */
  replaceParticipants(entries: DrawParticipantEntry[]): void {
    this.participants.clear({ emitEvent: false });
    entries.forEach(entry => this.participants.push(this.buildRow(entry), { emitEvent: false }));
    this.participants.updateValueAndValidity();
  }

  checkPaste(): void {
    this.pasteResult.set(parseDrawParticipantPaste(this.pasteControl.value, this.participationFormat()));
  }

  canImportPaste(): boolean {
    const result = this.pasteResult();
    return !!result && result.issues.length === 0 && result.entries.length > 0;
  }

  importPaste(mode: 'replace' | 'append'): void {
    const result = this.pasteResult();
    if (!result || !this.canImportPaste()) return;
    this.replaceParticipants(mode === 'replace' ? result.entries : [...this.entries(), ...result.entries]);
    this.pasteControl.setValue('');
    this.notifications.success('adminDraw.messages.pasteImported');
  }

  async preview(): Promise<void> {
    if (!this.canSubmit()) return;
    await this.run('preview', async () => {
      const preview = await this.planner.generatePreview(this.buildRequest());
      // Keep the seed the API used, so saving reproduces exactly the previewed draw.
      this.form.controls.seed.setValue(preview.seed ?? this.form.controls.seed.value);
    });
  }

  /** New random seed: clears the seed so the API picks one, then previews. */
  async regenerate(): Promise<void> {
    if (!this.canSubmit()) return;
    this.form.controls.seed.setValue('');
    await this.run('regenerate', async () => {
      const preview = await this.planner.generatePreview(this.buildRequest());
      this.form.controls.seed.setValue(preview.seed ?? '');
    });
  }

  async save(): Promise<void> {
    if (!this.canSubmit()) return;
    await this.run('save', async () => {
      const draw = await this.planner.saveDraft(this.buildRequest());
      this.form.controls.seed.setValue(draw.seed ?? this.form.controls.seed.value);
      this.notifications.success('adminDraw.messages.saved');
    });
  }

  async publish(): Promise<void> {
    if (!this.canPublish()) return;
    await this.run('publish', async () => {
      await this.planner.publish();
      this.notifications.success('adminDraw.messages.published');
    });
  }

  async unpublish(): Promise<void> {
    if (this.drawStatus() !== 'published' || this.isBusy()) return;
    await this.run('unpublish', async () => {
      await this.planner.unpublish();
      this.notifications.success('adminDraw.messages.unpublished');
    });
  }

  requestDelete(): void {
    if (this.canDelete()) this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  async confirmDelete(): Promise<void> {
    await this.run('delete', async () => {
      await this.planner.delete();
      this.showDeleteConfirm.set(false);
      this.notifications.success('adminDraw.messages.deleted');
    });
  }

  discardPreview(): void {
    this.planner.discardPreview();
  }

  /** Opens the result dialog for a match with both participants known; otherwise explains why it cannot. */
  openResult(match: DrawMatch): void {
    if (!this.canEnterResults() || this.resultSaving()) return;
    const availability = matchResultAvailability(match);
    if (availability !== 'available') {
      this.notifications.warning(`draws.errors.results.${availability}`);
      return;
    }
    this.resultErrorKey.set(null);
    this.resultMatch.set(match);
  }

  closeResult(): void {
    if (this.resultSaving()) return;
    this.resultMatch.set(null);
    this.resultErrorKey.set(null);
  }

  saveResult(body: TournamentDrawMatchResultRequest): Promise<void> {
    return this.recordResult(body, 'adminDraw.resultDialog.messages.saved');
  }

  clearResult(body: TournamentDrawMatchResultRequest): Promise<void> {
    return this.recordResult(body, 'adminDraw.resultDialog.messages.cleared');
  }

  /** Saves through the planner, which replaces the stored draw with the re-resolved response (bracket refresh). */
  private async recordResult(body: TournamentDrawMatchResultRequest, successKey: string): Promise<void> {
    const match = this.resultMatch();
    if (!match || this.resultSaving()) return;
    this.resultSaving.set(true);
    this.resultErrorKey.set(null);
    try {
      await this.planner.saveMatchResult(match.id, body);
      this.resultMatch.set(null);
      this.notifications.success(successKey);
    } catch (error) {
      this.resultErrorKey.set(error instanceof Error ? error.message : 'common.unexpectedError');
    } finally {
      this.resultSaving.set(false);
    }
  }

  isFieldInvalid(name: 'seed' | 'legs' | 'groupCount' | 'groupSize' | 'qualifiersPerGroup'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  private async loadTournament(id: string): Promise<void> {
    await this.planner.load(id);
    this.applyDraw(this.planner.draw(), this.planner.tournament());
  }

  /** Fills the form from the stored draw, or resets it to the defaults of the tournament. */
  private applyDraw(draw: TournamentDraw | null, tournament: Tournament | null): void {
    if (!draw) {
      this.form.patchValue({
        ...DEFAULT_SETTINGS,
        format: 'singleElimination',
        participationFormat: participationFormatFor(tournament),
        randomizationMode: 'seeded',
        seed: ''
      }, { emitEvent: false });
      this.replaceParticipants([]);
      return;
    }

    const settings = drawFormatSettingsFromOptions(draw.options, DEFAULT_SETTINGS);
    const hasSeeds = draw.participants.some(participant => participant.seedRank != null);
    this.form.patchValue({
      ...settings,
      format: draw.format,
      participationFormat: draw.participationFormat,
      randomizationMode: draw.randomizationMode ?? (hasSeeds ? 'seeded' : 'random'),
      seed: draw.seed ?? ''
    }, { emitEvent: false });
    this.replaceParticipants(draw.participants.map(participant => ({
      id: participant.id,
      displayName: participant.displayName,
      members: participant.members,
      seedRank: participant.seedRank,
      separationKey: participant.separationKey ?? null
    })));
  }

  private buildRow(entry?: DrawParticipantEntry): ParticipantRow {
    const format = this.form?.controls.participationFormat.value ?? 'pair';
    const members = entry?.members ?? [];
    const defaultName = members.join(' / ');
    const displayName = entry && (format === 'team' || entry.displayName !== defaultName) ? entry.displayName : '';
    return new FormGroup({
      id: new FormControl<string | null>(entry?.id ?? null),
      displayName: new FormControl(format === 'individual' ? '' : displayName, { nonNullable: true }),
      member1: new FormControl(format === 'team' ? '' : members[0] ?? '', { nonNullable: true }),
      member2: new FormControl(format === 'team' ? '' : members[1] ?? '', { nonNullable: true }),
      teamMembers: new FormControl(format === 'team' ? members.join(' / ') : '', { nonNullable: true }),
      seedRank: new FormControl<number | null>(entry?.seedRank ?? null),
      separationKey: new FormControl(entry?.separationKey ?? '', { nonNullable: true })
    });
  }

  private rowToEntry(row: ReturnType<ParticipantRow['getRawValue']>, format: DrawParticipationFormat): DrawParticipantEntry {
    const seedRank = row.seedRank == null || (row.seedRank as unknown) === '' ? null : Number(row.seedRank);
    const separationKey = row.separationKey.trim() || null;
    if (format === 'individual') {
      const name = row.member1.trim();
      return { id: row.id, displayName: name, members: [name], seedRank, separationKey };
    }
    if (format === 'team') {
      const members = row.teamMembers.split('/').map(member => member.trim()).filter(Boolean);
      return { id: row.id, displayName: row.displayName.trim(), members, seedRank, separationKey };
    }
    const members = [row.member1.trim(), row.member2.trim()];
    return { id: row.id, displayName: row.displayName.trim() || members.join(' / '), members, seedRank, separationKey };
  }

  private buildRequest(): TournamentDrawRequest {
    const value = this.form.getRawValue();
    const seed = value.seed.trim();
    return {
      format: value.format,
      participationFormat: value.participationFormat,
      randomization: seed ? { mode: value.randomizationMode, seed } : { mode: value.randomizationMode },
      options: drawOptionsForRequest(value.format, {
        thirdPlaceMatch: value.thirdPlaceMatch,
        legs: Number(value.legs),
        groupSizing: value.groupSizing,
        groupCount: Number(value.groupCount),
        groupSize: Number(value.groupSize),
        qualifiersPerGroup: Number(value.qualifiersPerGroup),
        thirdSetSuperTiebreak: value.thirdSetSuperTiebreak
      }),
      participants: toDrawRequestParticipants(this.entries())
    };
  }

  private async run(action: DrawAction, work: () => Promise<void>): Promise<void> {
    this.busyAction.set(action);
    if (action === 'preview' || action === 'regenerate') this.startProgress();
    try {
      await work();
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'common.unexpectedError');
    } finally {
      this.stopProgress();
      this.busyAction.set(null);
    }
  }

  /** Simulated staged progress (planner rule): fast at first, slowing down near the end until the API answers. */
  private startProgress(): void {
    this.stopProgress();
    this.progress.set(8);
    this.progressTimer = setInterval(() => this.progress.update(value => value + (95 - value) * 0.12), 150);
  }

  private stopProgress(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    this.progress.set(0);
  }

  private syncFormState(): void {
    this.formValue.set(this.form.getRawValue());
    this.formValid.set(this.form.valid);
  }

  private t(key: string): string {
    return this.i18n.translate(key);
  }
}
