import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatchResultDialogComponent } from './match-result-dialog.component';
import { DrawCourt, DrawMatch, TournamentDraw, TournamentDrawMatchResultRequest } from '../../../../../core/models';
import { DrawCourtsStatus } from '../../../../../core/services/draw-planner.service';
import { OTHER_COURT } from '../../../../../core/services/match-result-rules';
import {
  buildEightPairKnockoutDraw,
  buildKnockoutDraw,
  buildMatchResult,
  sets,
  withResults
} from '../../../../../core/models/tournament-draw.testing';

const COURTS: DrawCourt[] = [{ id: 'court-1', name: 'Central' }, { id: 'court-2', name: 'Lateral' }];

function matchOf(draw: TournamentDraw, id: string): DrawMatch {
  return draw.phases.flatMap(phase => phase.rounds.flatMap(round => round.matches)).find(match => match.id === id)!;
}

describe('MatchResultDialogComponent', () => {
  let fixture: ComponentFixture<MatchResultDialogComponent>;
  let element: HTMLElement;
  let submitted: TournamentDrawMatchResultRequest[];
  let cleared: TournamentDrawMatchResultRequest[];
  let cancelled: number;
  let courtRetries: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MatchResultDialogComponent, NoopAnimationsModule] }).compileComponents();
  });

  function render(
    draw: TournamentDraw,
    matchId: string,
    inputs: { saving?: boolean; errorKey?: string | null; courts?: DrawCourt[]; courtsStatus?: DrawCourtsStatus } = {}
  ): void {
    fixture = TestBed.createComponent(MatchResultDialogComponent);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('draw', draw);
    fixture.componentRef.setInput('match', matchOf(draw, matchId));
    fixture.componentRef.setInput('saving', inputs.saving ?? false);
    fixture.componentRef.setInput('errorKey', inputs.errorKey ?? null);
    fixture.componentRef.setInput('courts', inputs.courts ?? COURTS);
    fixture.componentRef.setInput('courtsStatus', inputs.courtsStatus ?? 'ready');
    submitted = [];
    courtRetries = 0;
    cleared = [];
    cancelled = 0;
    fixture.componentInstance.submitted.subscribe(body => submitted.push(body));
    fixture.componentInstance.cleared.subscribe(body => cleared.push(body));
    fixture.componentInstance.cancelled.subscribe(() => cancelled++);
    fixture.componentInstance.courtsRetried.subscribe(() => courtRetries++);
    fixture.detectChanges();
  }

  function courtSelect(): HTMLSelectElement {
    const select = element.querySelector<HTMLSelectElement>('#match-result-court-choice');
    if (!select) throw new Error('court select not rendered');
    return select;
  }

  function chooseCourt(value: string): void {
    const select = courtSelect();
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function courtOptions(): string[] {
    return Array.from(courtSelect().options).map(option => option.textContent?.trim() ?? '');
  }

  function text(selector: string): string {
    return element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function setStatus(status: string): void {
    const radio = element.querySelector<HTMLInputElement>(`[data-field="status"] input[value="${status}"]`);
    if (!radio) throw new Error(`status ${status} not rendered`);
    radio.click();
    fixture.detectChanges();
  }

  function setWinner(side: 'home' | 'away'): void {
    element.querySelector<HTMLInputElement>(`[data-field="winner"] input[value="${side}"]`)!.click();
    fixture.detectChanges();
  }

  function type(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error(`${selector} not rendered`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setGames(index: number, home: number | '', away: number | ''): void {
    type(`[data-set="${index}"] input[data-side="home"]`, String(home));
    type(`[data-set="${index}"] input[data-side="away"]`, String(away));
  }

  function saveButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>('[data-action="save-result"] button')!;
  }

  it('renders both pairs and fills the form from the stored result', () => {
    render(buildEightPairKnockoutDraw(), 'KO-R1-M1');

    const draw = buildEightPairKnockoutDraw();
    expect(text('.match-result__versus')).toContain(draw.participants[0].displayName);
    expect(element.querySelector<HTMLInputElement>('[data-field="status"] input[value="completed"]')!.checked).toBeTrue();
    expect(element.querySelector<HTMLInputElement>('[data-field="winner"] input[value="home"]')!.checked).toBeTrue();
    expect(element.querySelector<HTMLInputElement>('[data-set="0"] input[data-side="home"]')!.value).toBe('6');
    expect(element.querySelector<HTMLInputElement>('[data-set="1"] input[data-side="away"]')!.value).toBe('3');
    expect(courtSelect().value).toBe(OTHER_COURT);
    expect(element.querySelector<HTMLInputElement>('#match-result-court')!.value).toBe('Cancha 1');
    expect(element.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeNull();
  });

  it('toggles the winner and the sets with the status', () => {
    render(buildKnockoutDraw(4), 'KO-R1-M1');

    // New match: scheduled, no winner and no sets.
    expect(element.querySelector('[data-field="winner"]')).toBeNull();
    expect(element.querySelector('[data-field="sets"]')).toBeNull();
    expect(text('[data-hint="status"]')).toContain('cancha');

    setStatus('inProgress');
    expect(element.querySelector('[data-field="winner"]')).toBeNull();
    expect(element.querySelector('[data-field="sets"]')).not.toBeNull();

    setStatus('walkover');
    expect(element.querySelector('[data-field="winner"]')).not.toBeNull();
    expect(element.querySelector('[data-field="sets"]')).toBeNull();
    expect(saveButton().disabled).toBeTrue();
    expect(text('.match-result__issue')).toBe('Indicá el ganador del partido.');
    setWinner('away');
    expect(saveButton().disabled).toBeFalse();

    setStatus('completed');
    expect(element.querySelector('[data-field="sets"]')).not.toBeNull();
    expect(saveButton().disabled).toBeTrue();

    setStatus('retired');
    expect(element.querySelector('[data-field="winner"]')).not.toBeNull();
    expect(element.querySelector('[data-field="sets"]')).not.toBeNull();
  });

  it('labels the third set as a super tie-break only when the draw options say so', () => {
    const draw = buildKnockoutDraw(4);
    draw.options = { scoring: { bestOf: 3, thirdSetSuperTiebreak: true } };
    render(draw, 'KO-R1-M1');
    setStatus('completed');
    expect(text('[data-set="2"] .match-result__set-label')).toBe('Super tie-break');
    expect(text('[data-set="0"] .match-result__set-label')).toBe('Set 1');

    const regular = buildKnockoutDraw(4);
    regular.options = { scoring: { bestOf: 3, thirdSetSuperTiebreak: false } };
    render(regular, 'KO-R1-M1');
    setStatus('completed');
    expect(text('[data-set="2"] .match-result__set-label')).toBe('Set 3');
  });

  it('shows tie-break inputs for a 7-6 set only', () => {
    render(buildKnockoutDraw(4), 'KO-R1-M1');
    setStatus('completed');
    setGames(0, 6, 4);
    expect(element.querySelector('[data-set="0"] input[data-tiebreak="home"]')).toBeNull();
    setGames(0, 7, 6);
    expect(element.querySelector('[data-set="0"] input[data-tiebreak="home"]')).not.toBeNull();
  });

  it('keeps save disabled until the score is valid and explains the score rule', () => {
    render(buildKnockoutDraw(4), 'KO-R1-M1');
    setStatus('completed');
    setWinner('home');
    setGames(0, 6, 5);
    expect(saveButton().disabled).toBeTrue();
    expect(text('.match-result__issue')).toBe('Set 1: Un set tiene un resultado inválido.');

    setGames(0, 6, 4);
    expect(text('.match-result__issue')).toBe('El resultado está incompleto para un partido finalizado.');
    setGames(1, 4, 6);
    setGames(2, 12, 9);
    expect(text('.match-result__issue')).toBe('Super tie-break: El super tie-break se gana a 10 puntos con 2 de diferencia.');
    setGames(2, 11, 9);
    expect(text('.match-result__issue')).toBe('');
    expect(saveButton().disabled).toBeFalse();
  });

  it('flags a finish before the start', () => {
    render(buildKnockoutDraw(4), 'KO-R1-M1');
    setStatus('walkover');
    setWinner('home');
    type('#match-result-started', '2026-11-20T11:00');
    type('#match-result-finished', '2026-11-20T10:00');
    expect(saveButton().disabled).toBeTrue();
    expect(text('.match-result__issue')).toBe('Los horarios del partido no son coherentes.');
    expect(element.querySelector<HTMLInputElement>('#match-result-finished')!.min).toBe('2026-11-20T11:00');
  });

  it('submits the exact request body', () => {
    render(buildKnockoutDraw(4), 'KO-R1-M1');
    setStatus('completed');
    setWinner('away');
    setGames(0, 6, 7);
    type('[data-set="0"] input[data-tiebreak="home"]', '5');
    type('[data-set="0"] input[data-tiebreak="away"]', '7');
    setGames(1, 3, 6);
    chooseCourt(OTHER_COURT);
    type('#match-result-court', ' Central ');
    type('#match-result-started', '2026-11-20T10:00');
    type('#match-result-finished', '2026-11-20T11:30');

    saveButton().click();
    fixture.detectChanges();

    expect(submitted).toEqual([{
      status: 'completed',
      sets: [{ home: 6, away: 7, tiebreak: { home: 5, away: 7 } }, { home: 3, away: 6, tiebreak: null }],
      winnerSide: 'away',
      courtName: 'Central',
      scheduledAt: null,
      startedAt: new Date('2026-11-20T10:00').toISOString(),
      finishedAt: new Date('2026-11-20T11:30').toISOString()
    }]);
  });

  describe('court picker (D13)', () => {
    function walkoverFor(side: 'home' | 'away'): void {
      setStatus('walkover');
      setWinner(side);
    }

    it('lists the eligible courts between "no court" and "other court", with the free text hidden', () => {
      render(buildKnockoutDraw(4), 'KO-R1-M1');

      expect(courtOptions()).toEqual(['Sin cancha asignada', 'Central', 'Lateral', 'Otra cancha']);
      expect(courtSelect().value).toBe('');
      expect(element.querySelector('#match-result-court')).toBeNull();
      expect(element.querySelector('label[for="match-result-court-choice"]')?.textContent).toContain('Cancha');
    });

    it('submits the chosen court id without a court name', () => {
      render(buildKnockoutDraw(4), 'KO-R1-M1');
      walkoverFor('home');
      chooseCourt('court-2');

      saveButton().click();

      expect(submitted).toEqual([{
        status: 'walkover', sets: [], winnerSide: 'home', courtId: 'court-2', scheduledAt: null, startedAt: null, finishedAt: null
      }]);
    });

    it('reveals the free-text input for another court and submits its name', () => {
      render(buildKnockoutDraw(4), 'KO-R1-M1');
      walkoverFor('away');
      chooseCourt(OTHER_COURT);
      type('#match-result-court', ' Club vecino ');

      saveButton().click();

      expect(submitted).toEqual([{
        status: 'walkover', sets: [], winnerSide: 'away', courtName: 'Club vecino', scheduledAt: null, startedAt: null, finishedAt: null
      }]);
      chooseCourt('court-1');
      expect(element.querySelector('#match-result-court')).toBeNull();
    });

    it('preselects the stored court id', () => {
      const draw = withResults(buildKnockoutDraw(4), {
        'KO-R1-M1': buildMatchResult({ status: 'walkover', winnerSide: 'home', courtId: 'court-2', courtName: 'Lateral' })
      });
      render(draw, 'KO-R1-M1');

      expect(courtSelect().value).toBe('court-2');
      expect(element.querySelector('#match-result-court')).toBeNull();
    });

    it('keeps a stored court that is no longer listed as an option with its stored name', () => {
      const draw = withResults(buildKnockoutDraw(4), {
        'KO-R1-M1': buildMatchResult({ status: 'walkover', winnerSide: 'home', courtId: 'court-9', courtName: 'Vieja' })
      });
      render(draw, 'KO-R1-M1');

      expect(courtOptions()).toEqual(['Sin cancha asignada', 'Central', 'Lateral', 'Vieja', 'Otra cancha']);
      expect(courtSelect().value).toBe('court-9');
    });

    it('explains the loading, empty and error states of the court list and retries on demand', () => {
      render(buildKnockoutDraw(4), 'KO-R1-M1', { courts: [], courtsStatus: 'loading' });
      expect(text('[data-hint="courts-loading"]')).toBe('Cargando las canchas del torneo…');
      expect(courtOptions()).toEqual(['Sin cancha asignada', 'Otra cancha']);

      render(buildKnockoutDraw(4), 'KO-R1-M1', { courts: [], courtsStatus: 'ready' });
      expect(text('[data-hint="courts-empty"]')).toBe('El torneo no tiene canchas habilitadas: usá "Otra cancha" para escribir el nombre.');

      render(buildKnockoutDraw(4), 'KO-R1-M1', { courts: [], courtsStatus: 'error' });
      expect(text('[data-hint="courts-error"]')).toContain('No se pudieron cargar las canchas.');
      element.querySelector<HTMLButtonElement>('[data-action="retry-courts"]')!.click();
      expect(courtRetries).toBe(1);
      chooseCourt(OTHER_COURT);
      expect(element.querySelector('#match-result-court')).not.toBeNull();
    });

    it('shows the translated message when the API refuses the court', () => {
      render(buildEightPairKnockoutDraw(), 'KO-R1-M1', { errorKey: 'draws.errors.results.invalid_court' });
      expect(text('.match-result__api-error')).toBe('La cancha elegida no pertenece al complejo del torneo.');
    });
  });

  it('prevents a duplicate submission while saving', () => {
    render(buildEightPairKnockoutDraw(), 'KO-R1-M1', { saving: true });

    expect(saveButton().disabled).toBeTrue();
    fixture.componentInstance.submit();
    expect(submitted).toEqual([]);
  });

  it('shows the translated API error', () => {
    render(buildEightPairKnockoutDraw(), 'KO-R1-M1', { errorKey: 'draws.errors.results.locked_by_next_match' });

    expect(text('.match-result__api-error')).toBe('No se puede cambiar: el ganador ya jugó el partido siguiente.');
    expect(element.querySelector('.match-result__api-error')!.getAttribute('role')).toBe('alert');
  });

  it('clears the result only after confirmation, keeping court and planned time', () => {
    const draw = withResults(buildKnockoutDraw(4), {
      'KO-R1-M1': buildMatchResult({
        status: 'completed', sets: sets([6, 4], [6, 3]), winnerSide: 'home', courtName: 'Central',
        scheduledAt: '2026-11-20T09:30:00Z', startedAt: '2026-11-20T10:00:00Z', finishedAt: '2026-11-20T11:00:00Z'
      })
    });
    render(draw, 'KO-R1-M1');

    element.querySelector<HTMLButtonElement>('[data-action="clear-result"] button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('app-confirm-dialog')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('app-confirm-dialog .confirm-dialog__cancel')!.click();
    fixture.detectChanges();
    expect(element.querySelector('app-confirm-dialog')).toBeNull();
    expect(cleared).toEqual([]);

    element.querySelector<HTMLButtonElement>('[data-action="clear-result"] button')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('app-confirm-dialog app-async-button button')!.click();
    fixture.detectChanges();
    expect(cleared).toEqual([{
      status: 'scheduled', sets: [], winnerSide: null, courtName: 'Central',
      scheduledAt: '2026-11-20T09:30:00Z', startedAt: null, finishedAt: null
    }]);
  });

  it('offers no clear action for a match without a score', () => {
    render(buildKnockoutDraw(4), 'KO-R1-M1');
    expect(element.querySelector('[data-action="clear-result"]')).toBeNull();
  });

  it('explains the lock and only allows court and time changes once the winner played the next match', () => {
    const draw = withResults(buildEightPairKnockoutDraw(), {
      'KO-R2-M1': buildMatchResult({ status: 'inProgress', sets: sets([2, 1]) })
    });
    render(draw, 'KO-R1-M1');

    expect(element.querySelector('[data-hint="result-locked"]')).not.toBeNull();
    expect(element.querySelector<HTMLButtonElement>('[data-action="clear-result"] button')!.disabled).toBeTrue();
    type('#match-result-court', 'Central');
    expect(saveButton().disabled).toBeFalse();

    setGames(1, 6, 2);
    expect(saveButton().disabled).toBeTrue();
    expect(text('.match-result__issue')).toBe('No se puede cambiar: el ganador ya jugó el partido siguiente.');
  });

  it('emits cancelled from the cancel button and the Escape key', () => {
    render(buildEightPairKnockoutDraw(), 'KO-R1-M1');
    element.querySelector<HTMLButtonElement>('[data-action="cancel-result"]')!.click();
    element.querySelector('.match-result__panel')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cancelled).toBe(2);
  });
});
