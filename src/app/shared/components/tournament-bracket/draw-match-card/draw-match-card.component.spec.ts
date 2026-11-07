import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawMatchCardComponent } from './draw-match-card.component';
import { DrawKnockoutPhaseView, DrawMatchView, DrawRoundRobinPhaseView, buildDrawView } from '../draw-view.model';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  buildEightPairKnockoutDraw,
  buildFivePairRoundRobinDraw
} from '../../../../core/models/tournament-draw.testing';

describe('DrawMatchCardComponent', () => {
  let fixture: ComponentFixture<DrawMatchCardComponent>;
  let element: HTMLElement;
  let t: (key: string) => string;

  const text = (node: Element | null) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

  function knockoutMatch(roundIndex: number, matchIndex: number): DrawMatchView {
    const phase = buildDrawView(buildEightPairKnockoutDraw(), t).phases[0] as DrawKnockoutPhaseView;
    return phase.rounds[roundIndex].matches[matchIndex];
  }

  function render(match: DrawMatchView, activatable = true): void {
    fixture = TestBed.createComponent(DrawMatchCardComponent);
    fixture.componentRef.setInput('match', match);
    fixture.componentRef.setInput('activatable', activatable);
    fixture.detectChanges();
    element = fixture.nativeElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DrawMatchCardComponent] }).compileComponents();
    const i18n = TestBed.inject(I18nService);
    t = key => i18n.translate(key);
  });

  it('renders an activatable card as a labelled button that emits its element', () => {
    render(knockoutMatch(0, 0));
    const emitted: HTMLElement[] = [];
    fixture.componentInstance.activated.subscribe(target => emitted.push(target));

    const button = element.querySelector('button.match-card') as HTMLButtonElement;
    button.click();

    expect(button.getAttribute('aria-label')).toContain('Gómez / Pérez contra Club Sur');
    expect(emitted).toEqual([button]);
  });

  it('renders a non-activatable card as an article without emitting', () => {
    render(knockoutMatch(0, 0), false);
    const emitted: HTMLElement[] = [];
    fixture.componentInstance.activated.subscribe(target => emitted.push(target));

    const article = element.querySelector('article.match-card') as HTMLElement;
    article.click();

    expect(element.querySelector('button')).toBeNull();
    expect(emitted).toEqual([]);
  });

  it('shows the seed rank and a spoken winner mark on the winning row', () => {
    render(knockoutMatch(0, 0));

    const [home, away] = Array.from(element.querySelectorAll('.match-card__row'));
    expect(text(home.querySelector('.match-card__seed'))).toBe('1');
    expect(text(home.querySelector('.match-card__sr-only'))).toBe('Ganador');
    expect(away.querySelector('.match-card__sr-only')).toBeNull();
    expect(home.querySelector('.match-card__winner-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks the games of the set winner and shows tie-break points on the tie-break loser', () => {
    const phase = buildDrawView(buildFivePairRoundRobinDraw(), t).phases[0] as DrawRoundRobinPhaseView;
    render(phase.matchdays[0].matches[1]);

    const [home, away] = Array.from(element.querySelectorAll('.match-card__row'));
    const homeSets = Array.from(home.querySelectorAll('.match-card__set'));
    expect(homeSets.map(text)).toEqual(['65', '6', '10']);
    expect(text(homeSets[0].querySelector('.match-card__tiebreak'))).toBe('5');
    expect(homeSets[0].classList).not.toContain('match-card__set--won');
    expect(away.querySelector('.match-card__set')?.classList).toContain('match-card__set--won');
  });

  it('shows the status and court only once the match has a result', () => {
    render(knockoutMatch(1, 0));
    expect(text(element.querySelector('.match-card__status'))).toBe('Programado');
    expect(text(element.querySelector('.match-card__court'))).toBe('Central');

    render(knockoutMatch(2, 0));
    expect(element.querySelector('.match-card__meta')).toBeNull();
  });
});
