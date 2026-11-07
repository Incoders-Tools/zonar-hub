import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawMatchDetailComponent } from './draw-match-detail.component';
import { DrawKnockoutPhaseView, DrawMatchView, buildDrawView } from '../draw-view.model';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { buildEightPairKnockoutDraw } from '../../../../core/models/tournament-draw.testing';

describe('DrawMatchDetailComponent', () => {
  let fixture: ComponentFixture<DrawMatchDetailComponent>;
  let element: HTMLElement;
  let i18n: I18nService;
  let closedCount: number;

  const text = (node: Element | null) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

  function match(roundIndex: number, matchIndex: number): DrawMatchView {
    const phase = buildDrawView(buildEightPairKnockoutDraw(), key => i18n.translate(key)).phases[0] as DrawKnockoutPhaseView;
    return phase.rounds[roundIndex].matches[matchIndex];
  }

  function render(view: DrawMatchView): void {
    fixture = TestBed.createComponent(DrawMatchDetailComponent);
    fixture.componentRef.setInput('match', view);
    closedCount = 0;
    fixture.componentInstance.closed.subscribe(() => closedCount++);
    fixture.detectChanges();
    element = fixture.nativeElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DrawMatchDetailComponent] }).compileComponents();
    i18n = TestBed.inject(I18nService);
  });

  it('is a modal dialog labelled by its title', () => {
    render(match(0, 0));

    const dialog = element.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(text(element.querySelector(`#${dialog.getAttribute('aria-labelledby')}`))).toBe('Detalle del partido');
  });

  it('shows the score table with the winner marked in text', () => {
    render(match(0, 1));

    const rows = Array.from(element.querySelectorAll('.match-detail__score tbody tr'));
    expect(Array.from(element.querySelectorAll('.match-detail__score thead th')).map(text)).toEqual(['Pareja', 'Set 1', 'Set 2', 'Set 3']);
    expect(rows[1].classList).toContain('match-detail__row--winner');
    expect(text(rows[1].querySelector('.match-detail__sr-only'))).toBe('Ganador');
    expect(text(element.querySelector('.match-detail__duration'))).toBe('1 h 50 min');
  });

  it('shows pending data as translated placeholders and no duration without both timestamps', () => {
    render(match(2, 0));

    expect(text(element.querySelector('.match-detail__status'))).toBe('Programado');
    expect(text(element.querySelector('.match-detail__court'))).toBe('A confirmar');
    expect(text(element.querySelector('.match-detail__schedule'))).toBe('A confirmar');
    expect(element.querySelector('.match-detail__duration')).toBeNull();
    expect(text(element.querySelector('.match-detail__pairs'))).toBe('Ganador R2 P1 — Ganador R2 P2');
    expect(text(element.querySelector('.match-detail__empty'))).toBe('Todavía no hay resultado.');
  });

  it('shows the scheduled date and local time', () => {
    const view = match(1, 0);
    render(view);

    const scheduled = new Date(view.scheduledAt as string);
    const time = `${String(scheduled.getHours()).padStart(2, '0')}:${String(scheduled.getMinutes()).padStart(2, '0')}`;
    expect(text(element.querySelector('.match-detail__schedule'))).toContain(time);
    expect(text(element.querySelector('.match-detail__court'))).toBe('Central');
  });

  it('emits closed from the close button, Escape and the backdrop, but not from inside the panel', () => {
    render(match(0, 0));

    (element.querySelector('.match-detail__close') as HTMLButtonElement).click();
    element.querySelector('.match-detail')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    (element.querySelector('.match-detail-overlay') as HTMLElement).click();
    (element.querySelector('.match-detail__facts') as HTMLElement).click();

    expect(closedCount).toBe(3);
  });

  it('follows the active locale', () => {
    i18n.setLocale('en');
    render(match(0, 0));

    expect(text(element.querySelector('.match-detail__title'))).toBe('Match details');
    expect(text(element.querySelector('.match-detail__duration'))).toBe('1 h 25 min');
    i18n.setLocale('es');
  });
});
