import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawStandingsTableComponent } from './draw-standings-table.component';
import { DrawStandingRowView } from '../draw-view.model';

describe('DrawStandingsTableComponent', () => {
  let fixture: ComponentFixture<DrawStandingsTableComponent>;
  let element: HTMLElement;

  const text = (node: Element | null) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const row = (overrides: Partial<DrawStandingRowView>): DrawStandingRowView => ({
    participantId: 'p1', position: 1, name: 'Gómez / Pérez', played: 2, won: 2, lost: 0, setsDiff: '+4', gamesDiff: '+11',
    isHighlighted: false, ...overrides
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DrawStandingsTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(DrawStandingsTableComponent);
    fixture.componentRef.setInput('caption', 'Posiciones del Grupo A');
    fixture.componentRef.setInput('rows', [
      row({}),
      row({ participantId: 'p2', position: 2, name: 'Sosa / Díaz', won: 0, lost: 2, setsDiff: '-4', gamesDiff: '-11', isHighlighted: true })
    ]);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('renders the caption and abbreviated column headers with their full names', () => {
    expect(text(element.querySelector('caption'))).toBe('Posiciones del Grupo A');
    const headers = Array.from(element.querySelectorAll('thead th'));
    expect(headers.map(text)).toEqual(['#', 'Pareja', 'PJ', 'PG', 'PP', 'Sets ±', 'Games ±']);
    expect(headers[2].querySelector('abbr')?.getAttribute('title')).toBe('Partidos jugados');
    expect(headers.every(header => header.getAttribute('scope') === 'col')).toBeTrue();
  });

  it('renders the rows in the given order with the pair as row header', () => {
    const rows = Array.from(element.querySelectorAll('tbody tr'));
    expect(rows.map(tr => text(tr.querySelector('th[scope="row"]')))).toEqual(['Gómez / Pérez', 'Sosa / Díaz']);
    expect(Array.from(rows[1].children).map(text)).toEqual(['2', 'Sosa / Díaz', '2', '0', '2', '-4', '-11']);
  });

  it('highlights the requested participant row', () => {
    const rows = element.querySelectorAll('tbody tr');
    expect(rows[0].classList).not.toContain('standings__row--highlighted');
    expect(rows[1].classList).toContain('standings__row--highlighted');
  });
});
