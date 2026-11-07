import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject } from 'rxjs';
import { TournamentBracketComponent } from './tournament-bracket.component';
import { DrawMatch, TournamentDraw } from '../../../core/models/tournament-draw.model';
import {
  buildDraw,
  buildEightPairKnockoutDraw,
  buildFivePairRoundRobinDraw,
  buildGroupsThenKnockoutDraw,
  buildKnockoutDraw,
  buildSixPairByeKnockoutDraw
} from '../../../core/models/tournament-draw.testing';

describe('TournamentBracketComponent (draw view)', () => {
  let fixture: ComponentFixture<TournamentBracketComponent>;
  let element: HTMLElement;
  let wide$: BehaviorSubject<BreakpointState>;

  function render(draw: TournamentDraw | null, options: { wide?: boolean; interactive?: boolean; highlight?: string } = {}): void {
    wide$.next({ matches: options.wide ?? true, breakpoints: {} });
    fixture = TestBed.createComponent(TournamentBracketComponent);
    fixture.componentRef.setInput('draw', draw);
    fixture.componentRef.setInput('interactive', options.interactive ?? false);
    fixture.componentRef.setInput('highlightParticipantId', options.highlight ?? null);
    fixture.detectChanges();
    element = fixture.nativeElement;
  }

  const text = (node: Element | null | undefined) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const texts = (selector: string, root: ParentNode = element) => Array.from(root.querySelectorAll(selector)).map(text);
  const card = (matchId: string) => element.querySelector(`[data-match-id="${matchId}"]`) as HTMLElement;
  const rows = (matchId: string) => Array.from(card(matchId).querySelectorAll('.match-card__row'));
  const nextButton = () => element.querySelector('.draw-ko__next') as HTMLButtonElement;
  const previousButton = () => element.querySelector('.draw-ko__prev') as HTMLButtonElement;
  const visibleRoundLabels = () => texts('.draw-ko__round-label');

  beforeEach(async () => {
    wide$ = new BehaviorSubject<BreakpointState>({ matches: true, breakpoints: {} });
    await TestBed.configureTestingModule({
      imports: [TournamentBracketComponent],
      providers: [{ provide: BreakpointObserver, useValue: { observe: () => wide$.asObservable() } }]
    }).compileComponents();
  });

  describe('knockout rendering', () => {
    it('renders the round headers as headings with translated labels', () => {
      render(buildEightPairKnockoutDraw());

      const headings = Array.from(element.querySelectorAll('.draw-ko__round-title'));
      expect(headings.map(heading => heading.tagName)).toEqual(['H3', 'H3', 'H3']);
      expect(visibleRoundLabels()).toEqual(['Cuartos de final', 'Semifinales', 'Final']);
    });

    it('labels round_of_N rounds R16 style with a spoken long name', () => {
      render(buildKnockoutDraw(16));

      expect(visibleRoundLabels()).toEqual(['R16', 'Cuartos de final', 'Semifinales']);
      expect(text(element.querySelector('.draw-ko__round-title .draw-view__sr-only'))).toBe('Ronda de 16');
    });

    it('renders one column per visible round with its matches', () => {
      render(buildEightPairKnockoutDraw());

      const columns = Array.from(element.querySelectorAll('.draw-ko__column'));
      expect(columns.map(column => column.querySelectorAll('app-draw-match-card').length)).toEqual([4, 2, 1]);
    });

    it('shows each pair as member surnames in uppercase, or the display name without members', () => {
      render(buildEightPairKnockoutDraw());

      const [home, away] = rows('KO-R1-M1');
      expect(texts('.match-card__name', home)).toEqual(['GÓMEZ', 'PÉREZ']);
      expect(texts('.match-card__name', away)).toEqual(['Club Sur']);
    });

    it('shows the games of each set right-aligned per side', () => {
      render(buildEightPairKnockoutDraw());

      const [home, away] = rows('KO-R1-M2');
      expect(texts('.match-card__set', home)).toEqual(['4', '6', '8']);
      expect(texts('.match-card__set', away)).toEqual(['6', '3', '10']);
    });

    it('shows the winner check only on the winning side', () => {
      render(buildEightPairKnockoutDraw());

      const [m1Home, m1Away] = rows('KO-R1-M1');
      expect(m1Home.querySelector('.match-card__winner-icon')).not.toBeNull();
      expect(m1Away.querySelector('.match-card__winner-icon')).toBeNull();

      const [m2Home, m2Away] = rows('KO-R1-M2');
      expect(m2Home.querySelector('.match-card__winner-icon')).toBeNull();
      expect(m2Away.querySelector('.match-card__winner-icon')).not.toBeNull();

      expect(card('KO-R1-M3').querySelector('.match-card__winner-icon')).toBeNull();
    });

    it('states the match status in text, not by colour alone', () => {
      render(buildEightPairKnockoutDraw());

      expect(text(card('KO-R1-M3').querySelector('.match-card__status'))).toBe('En juego');
      expect(text(card('KO-R1-M4').querySelector('.match-card__status'))).toBe('W.O.');
    });

    it('renders BYE rows and keeps bye matches out of activation', () => {
      render(buildSixPairByeKnockoutDraw());

      const [, away] = rows('KO-R1-M1');
      expect(away.classList).toContain('match-card__row--bye');
      expect(text(away)).toBe('BYE');
      expect(card('KO-R1-M1').tagName).toBe('ARTICLE');
      expect(card('KO-R1-M2').tagName).toBe('BUTTON');
    });

    it('shows translated placeholders for pending slots', () => {
      render(buildEightPairKnockoutDraw());

      expect(texts('.match-card__placeholder', card('KO-R2-M2'))).toEqual(['Ganador R1 P3']);
      expect(texts('.match-card__placeholder', card('KO-R3-M1'))).toEqual(['Ganador R2 P1', 'Ganador R2 P2']);
    });

    it('shows the third-place match separately under the final column', () => {
      render(buildEightPairKnockoutDraw());

      const finalColumn = element.querySelectorAll('.draw-ko__column')[2] as HTMLElement;
      expect(finalColumn.querySelectorAll('app-draw-match-card').length).toBe(1);

      const thirdPlace = element.querySelector('.draw-ko__third-place') as HTMLElement;
      expect(text(thirdPlace.querySelector('h4'))).toBe('Tercer puesto');
      expect(texts('.match-card__placeholder', thirdPlace)).toEqual(['Perdedor R2 P1', 'Perdedor R2 P2']);
      expect(thirdPlace.style.gridColumn).toBe(finalColumn.style.gridColumn);
    });

    it('draws connectors only from matches that feed a visible next column', () => {
      render(buildEightPairKnockoutDraw());

      const columns = element.querySelectorAll('.draw-ko__column');
      expect(columns[0].querySelectorAll('.draw-ko__slot--feeds').length).toBe(4);
      expect(columns[1].querySelectorAll('.draw-ko__slot--feeds').length).toBe(2);
      expect(columns[2].querySelectorAll('.draw-ko__slot--feeds').length).toBe(0);
      expect(columns[1].querySelectorAll('.draw-ko__slot--fed').length).toBe(2);
    });

    it('marks the highlighted participant', () => {
      render(buildEightPairKnockoutDraw(), { highlight: 'p1' });

      const [home, away] = rows('KO-R1-M1');
      expect(home.classList).toContain('match-card__row--highlighted');
      expect(away.classList).not.toContain('match-card__row--highlighted');
    });
  });

  describe('paging', () => {
    it('disables both arrows when every round fits', () => {
      render(buildEightPairKnockoutDraw());

      expect(previousButton().disabled).toBeTrue();
      expect(nextButton().disabled).toBeTrue();
    });

    it('moves by three columns on wide screens and disables at the ends', () => {
      render(buildKnockoutDraw(32));

      expect(visibleRoundLabels()).toEqual(['R32', 'R16', 'Cuartos de final']);
      expect(previousButton().disabled).toBeTrue();

      nextButton().click();
      fixture.detectChanges();
      expect(visibleRoundLabels()).toEqual(['Semifinales', 'Final']);
      expect(nextButton().disabled).toBeTrue();
      expect(previousButton().disabled).toBeFalse();

      previousButton().click();
      fixture.detectChanges();
      expect(visibleRoundLabels()).toEqual(['R32', 'R16', 'Cuartos de final']);
    });

    it('moves by one column on narrow screens', () => {
      render(buildEightPairKnockoutDraw(), { wide: false });

      expect(visibleRoundLabels()).toEqual(['Cuartos de final']);
      nextButton().click();
      fixture.detectChanges();
      expect(visibleRoundLabels()).toEqual(['Semifinales']);
      nextButton().click();
      fixture.detectChanges();
      expect(visibleRoundLabels()).toEqual(['Final']);
      expect(nextButton().disabled).toBeTrue();
    });

    it('pages with the arrow keys and announces the visible rounds', () => {
      render(buildEightPairKnockoutDraw(), { wide: false });
      const region = element.querySelector('.draw-ko__viewport') as HTMLElement;

      region.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(visibleRoundLabels()).toEqual(['Semifinales']);
      expect(text(element.querySelector('.draw-ko__live'))).toBe('Mostrando: Semifinales');

      region.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(visibleRoundLabels()).toEqual(['Cuartos de final']);
    });

    it('labels the arrows', () => {
      render(buildKnockoutDraw(32));

      expect(previousButton().getAttribute('aria-label')).toBe('Rondas anteriores');
      expect(nextButton().getAttribute('aria-label')).toBe('Rondas siguientes');
    });
  });

  describe('list / bracket toggle', () => {
    it('starts in bracket mode and switches to stacked round lists', () => {
      render(buildEightPairKnockoutDraw());
      const toggle = element.querySelector('.draw-view__mode-toggle') as HTMLElement;
      const [bracketButton, listButton] = Array.from(toggle.querySelectorAll('button'));

      expect(toggle.getAttribute('role')).toBe('group');
      expect(toggle.getAttribute('aria-label')).toBe('Modo de vista del cuadro');
      expect(bracketButton.getAttribute('aria-pressed')).toBe('true');

      listButton.click();
      fixture.detectChanges();

      expect(listButton.getAttribute('aria-pressed')).toBe('true');
      expect(element.querySelector('.draw-ko__column')).toBeNull();
      expect(texts('.draw-list__round > h3')).toEqual(['Cuartos de final', 'Semifinales', 'Final', 'Tercer puesto']);
      expect(element.querySelectorAll('.draw-list app-draw-match-card').length).toBe(8);
    });

    it('is not shown when the draw has no knockout phase', () => {
      render(buildFivePairRoundRobinDraw());

      expect(element.querySelector('.draw-view__mode-toggle')).toBeNull();
    });
  });

  describe('group stage', () => {
    it('renders one card per group with standings in the given order', () => {
      render(buildGroupsThenKnockoutDraw());

      expect(texts('.draw-group > h3')).toEqual(['Grupo A', 'Grupo B']);
      const groupA = element.querySelectorAll('.draw-group')[0];
      const standingRows = Array.from(groupA.querySelectorAll('tbody tr'));
      expect(standingRows.map(row => text(row.querySelector('.standings__pair')))).toEqual([
        'Castro / Rojas', 'Gómez / Pérez', 'Medina / Silva', 'Torres / Molina'
      ]);
      expect(Array.from(standingRows[0].querySelectorAll('td, th')).map(text)).toEqual(['1', 'Castro / Rojas', '3', '3', '0', '+5', '+18']);
    });

    it('lists each group matches by matchday', () => {
      render(buildGroupsThenKnockoutDraw());

      const groupA = element.querySelectorAll('.draw-group')[0];
      const matchdays = Array.from(groupA.querySelectorAll('.draw-matchday'));
      expect(matchdays.map(day => text(day.querySelector('h4')))).toEqual(['Fecha 1', 'Fecha 2', 'Fecha 3']);
      expect(matchdays.map(day => day.querySelectorAll('app-draw-match-card').length)).toEqual([2, 2, 2]);
    });

    it('renders the knockout after the groups with group-position placeholders', () => {
      render(buildGroupsThenKnockoutDraw());

      const sections = Array.from(element.querySelectorAll('.draw-view__phase'));
      expect(sections.map(section => text(section.querySelector('h2')))).toEqual(['Fase de grupos', 'Eliminatorias']);
      expect(texts('.match-card__name', card('KO-R1-M1'))).toEqual(['CASTRO', 'ROJAS']);
      expect(texts('.match-card__placeholder', card('KO-R1-M1'))).toEqual(['2º del Grupo B']);
      expect(texts('.match-card__placeholder', card('KO-R1-M2'))).toEqual(['1º del Grupo B']);
    });
  });

  describe('round robin', () => {
    it('renders the standings table and the matchday list with resting pairs', () => {
      render(buildFivePairRoundRobinDraw());

      expect(texts('.draw-rr tbody .standings__pair')).toEqual([
        'Fernández / Ruiz', 'Sosa / Díaz', 'Gómez / Pérez', 'Torres / Molina', 'Castro / Rojas'
      ]);
      const matchdays = Array.from(element.querySelectorAll('.draw-rr .draw-matchday'));
      expect(matchdays.map(day => text(day.querySelector('h4')))).toEqual(['Fecha 1', 'Fecha 2', 'Fecha 3', 'Fecha 4', 'Fecha 5']);
      expect(matchdays.map(day => day.querySelectorAll('app-draw-match-card').length)).toEqual([2, 2, 2, 2, 2]);
      expect(text(matchdays[0].querySelector('.draw-matchday__resting'))).toBe('Descansa: Gómez / Pérez');
    });
  });

  describe('match activation', () => {
    it('opens the detail panel with status, round, court, score and duration when not interactive', () => {
      render(buildEightPairKnockoutDraw());
      const selected: DrawMatch[] = [];
      fixture.componentInstance.matchSelected.subscribe(match => selected.push(match));

      card('KO-R1-M1').click();
      fixture.detectChanges();

      const dialog = element.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog).not.toBeNull();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(text(dialog.querySelector('.match-detail__status'))).toBe('Finalizado');
      expect(text(dialog.querySelector('.match-detail__round'))).toBe('Cuartos de final');
      expect(text(dialog.querySelector('.match-detail__court'))).toBe('Cancha 1');
      expect(text(dialog.querySelector('.match-detail__duration'))).toBe('1 h 25 min');
      expect(texts('.match-detail__set', dialog)).toEqual(['6', '6', '4', '3']);
      expect(selected).toEqual([]);
    });

    it('closes the detail panel and returns focus to the card', () => {
      render(buildEightPairKnockoutDraw());
      const trigger = card('KO-R1-M1');
      trigger.focus();
      trigger.click();
      fixture.detectChanges();

      (element.querySelector('.match-detail__close') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(element.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('emits matchSelected instead of opening the panel when interactive', () => {
      render(buildEightPairKnockoutDraw(), { interactive: true });
      const selected: DrawMatch[] = [];
      fixture.componentInstance.matchSelected.subscribe(match => selected.push(match));

      card('KO-R1-M3').click();
      fixture.detectChanges();

      expect(selected.map(match => match.id)).toEqual(['KO-R1-M3']);
      expect(element.querySelector('[role="dialog"]')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('labels match cards with the round, both pairs, status, score and winner', () => {
      render(buildEightPairKnockoutDraw());

      expect(card('KO-R1-M1').getAttribute('aria-label')).toBe(
        'Cuartos de final, partido 1: Gómez / Pérez contra Club Sur. Finalizado. Resultado 6-4, 6-3. Ganador: Gómez / Pérez');
      expect(card('KO-R2-M2').getAttribute('aria-label')).toBe(
        'Semifinales, partido 2: Ganador R1 P3 contra Sosa / Díaz. Programado');
    });

    it('links each round column to its heading', () => {
      render(buildEightPairKnockoutDraw());

      const column = element.querySelector('.draw-ko__column') as HTMLElement;
      const heading = element.querySelector(`#${column.getAttribute('aria-labelledby')}`);
      expect(heading?.classList).toContain('draw-ko__round-title');
    });
  });

  describe('empty and partial data', () => {
    it('shows the empty state without a draw', () => {
      render(null);

      expect(text(element.querySelector('.draw-view__empty'))).toContain('El cuadro todavía no tiene partidos.');
    });

    it('shows the empty state for a draw without phases', () => {
      render(buildDraw());

      expect(element.querySelector('.draw-view__empty')).not.toBeNull();
      expect(element.querySelector('.draw-ko')).toBeNull();
    });

    it('renders a draw with missing optional collections and non-camelCase enums', () => {
      const raw = buildEightPairKnockoutDraw() as unknown as Record<string, unknown>;
      const phases = raw['phases'] as Array<Record<string, unknown>>;
      phases[0]['kind'] = 'Knockout';
      const firstRound = (phases[0]['rounds'] as Array<Record<string, unknown>>)[0];
      const firstMatch = (firstRound['matches'] as Array<Record<string, unknown>>)[2];
      (firstMatch['result'] as Record<string, unknown>)['status'] = 'in_progress';
      delete firstRound['restingParticipantIds'];

      render(raw as unknown as TournamentDraw);

      expect(text(card('KO-R1-M3').querySelector('.match-card__status'))).toBe('En juego');
    });
  });
});
