import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TournamentBracketComponent } from './tournament-bracket.component';
import { TournamentBracket, BracketMatch } from '../../../core/models';

const mockBracket: TournamentBracket = {
  tournamentId: 't1',
  categoryName: '4ta',
  genderLabel: 'Masculino',
  rounds: [
    {
      name: 'bracket.quarterfinals',
      matches: [
        {
          id: 'm1',
          roundIndex: 0,
          matchIndex: 0,
          pair1: { id: 'p1', player1: 'Player A', player2: 'Player B', seed: 1 },
          pair2: { id: 'p2', player1: 'Player C', player2: 'Player D' },
          score1: ['6', '6'],
          score2: ['3', '4'],
          winnerId: 'p1'
        },
        {
          id: 'm2',
          roundIndex: 0,
          matchIndex: 1,
          pair1: { id: 'p3', player1: 'Player E', player2: 'Player F' },
          pair2: null,
          score1: [],
          score2: [],
          winnerId: null
        }
      ]
    },
    {
      name: 'bracket.semifinals',
      matches: [
        {
          id: 'm3',
          roundIndex: 1,
          matchIndex: 0,
          pair1: { id: 'p1', player1: 'Player A', player2: 'Player B', seed: 1 },
          pair2: null,
          score1: [],
          score2: [],
          winnerId: null
        }
      ]
    }
  ]
};

describe('TournamentBracketComponent', () => {
  let component: TournamentBracketComponent;
  let fixture: ComponentFixture<TournamentBracketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentBracketComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentBracketComponent);
    component = fixture.componentInstance;
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('bracket', mockBracket);
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render rounds', () => {
    const el: HTMLElement = fixture.nativeElement;
    const rounds = el.querySelectorAll('.bracket__round');
    expect(rounds.length).toBe(2);
  });

  it('should render matches within rounds', () => {
    const el: HTMLElement = fixture.nativeElement;
    const matches = el.querySelectorAll('.bracket__match');
    expect(matches.length).toBe(3);
  });

  it('should identify winner correctly', () => {
    const match = mockBracket.rounds[0].matches[0];
    expect(component.isWinner(match, 'p1')).toBe(true);
    expect(component.isWinner(match, 'p2')).toBe(false);
  });

  it('should identify loser correctly', () => {
    const match = mockBracket.rounds[0].matches[0];
    expect(component.isLoser(match, 'p2')).toBe(true);
    expect(component.isLoser(match, 'p1')).toBe(false);
  });

  it('should not identify winner/loser when no winnerId', () => {
    const match = mockBracket.rounds[0].matches[1];
    expect(component.isWinner(match, 'p3')).toBe(false);
    expect(component.isLoser(match, 'p3')).toBe(false);
  });

  it('should handle undefined pairId', () => {
    const match = mockBracket.rounds[0].matches[0];
    expect(component.isWinner(match, undefined)).toBe(false);
    // isLoser returns true when a winner is set and pairId !== winnerId (including undefined)
    expect(component.isLoser(match, undefined)).toBe(true);
  });

  it('should render seed numbers when present', () => {
    const el: HTMLElement = fixture.nativeElement;
    const seeds = el.querySelectorAll('.bracket__seed');
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds[0].textContent?.trim()).toBe('1');
  });

  it('should show TBD for missing pairs', () => {
    const el: HTMLElement = fixture.nativeElement;
    const tbds = el.querySelectorAll('.bracket__names--tbd');
    expect(tbds.length).toBeGreaterThan(0);
  });

  it('should show winner icon for winning pair', () => {
    const el: HTMLElement = fixture.nativeElement;
    const icons = el.querySelectorAll('.bracket__winner-icon');
    expect(icons.length).toBeGreaterThan(0);
  });
});
