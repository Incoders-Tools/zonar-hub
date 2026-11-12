import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ParticipantSearchComponent } from './participant-search.component';
import { ApiPlayerRepository } from '../../../core/repositories/api/api-player.repository';
import { EligibilityValidationService } from '../../../core/services/eligibility-validation.service';
import { Gender, Player } from '../../../core/models';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1', firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test', categoryId: 'cat1', categoryName: '', genderId: 'g-f',
  genderLabel: '', isActive: true, createdAt: '2025-01-01', ...overrides
});

const mixed: Gender = { id: 'g-x', name: 'Mixto', key: 'mixed', isActive: true, sortOrder: 3, createdAt: '', updatedAt: '' };

describe('ParticipantSearchComponent', () => {
  let component: ParticipantSearchComponent;
  let fixture: ComponentFixture<ParticipantSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantSearchComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
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

  describe('eligibility of the results (L13a)', () => {
    async function search(players: Player[]): Promise<void> {
      spyOn(TestBed.inject(ApiPlayerRepository), 'search').and.resolveTo(players);
      component.searchControl.setValue('an');
      await new Promise(resolve => setTimeout(resolve, 350));
      await fixture.whenStable();
    }

    it('passes the gender catalog so a mixed slot admits any gender', async () => {
      const eligibility = TestBed.inject(EligibilityValidationService);
      spyOn(eligibility, 'getPlayerAvailabilityState').and.callThrough();
      fixture.componentRef.setInput('eligibilitySlot', {
        slotNumber: 1, genderId: 'g-x', categoryId: null, minAge: null, maxAge: null, label: null, required: true
      });
      fixture.componentRef.setInput('genders', [mixed]);

      await search([player({ genderId: 'g-m' })]);

      expect(eligibility.getPlayerAvailabilityState).toHaveBeenCalledWith(
        jasmine.anything(), 't1', jasmine.objectContaining({ genderId: 'g-x' }), jasmine.anything(), [], [], [mixed]);
      expect(component.searchResults()[0].availabilityState).toBe('available');
    });

    it('applies the tournament rules to its slot when no profile slot is given', async () => {
      fixture.componentRef.setInput('tournamentRules', { modalityKey: 'doubles', genderId: 'g-f', categoryId: null });

      await search([player({ id: 'p2', genderId: 'g-m' }), player({ id: 'p3', genderId: 'g-f' })]);

      expect(component.searchResults().map(r => r.availabilityState)).toEqual(['incompatibleGender', 'available']);
    });
  });
});
