import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticipantSearchComponent } from './participant-search.component';

describe('ParticipantSearchComponent', () => {
  let component: ParticipantSearchComponent;
  let fixture: ComponentFixture<ParticipantSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantSearchComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantSearchComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slotNumber', 1);
    fixture.componentRef.setInput('tournamentId', 't1');
    fixture.componentRef.setInput('sportId', 'sp1');
    fixture.componentRef.setInput('config', {
      sportKey: 'padel',
      participantType: 'pair',
      minPlayers: 2,
      maxPlayers: 2,
      requiresGender: true,
      requiresCategory: true,
      categoryToleranceLevels: 1,
      allowsHabitualPartner: true
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show results initially', () => {
    expect(component.showResults()).toBe(false);
    expect(component.searchResults().length).toBe(0);
  });

  it('should clear selection', () => {
    spyOn(component.playerCleared, 'emit');
    component.selectedPlayer.set({ id: 'p1', firstName: 'Test', lastName: 'Player', email: 't@t.com', categoryId: 'cat1', categoryName: '1ª', genderId: 'g1', genderLabel: 'M', isActive: true, createdAt: '2025-01-01' });
    component.clearSelection();
    expect(component.selectedPlayer()).toBeNull();
    expect(component.playerCleared.emit).toHaveBeenCalledWith(1);
  });

  it('should dismiss habitual partner', () => {
    component.dismissPartner();
    expect(component.partnerDismissed()).toBe(true);
  });
});
