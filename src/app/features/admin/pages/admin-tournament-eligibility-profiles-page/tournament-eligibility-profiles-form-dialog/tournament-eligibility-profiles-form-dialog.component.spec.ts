import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TournamentEligibilityProfilesFormDialogComponent } from './tournament-eligibility-profiles-form-dialog.component';
import { TournamentEligibilityProfilesFacadeService } from '../tournament-eligibility-profiles-facade.service';
import { MockTournamentEligibilityProfileRepository } from '../../../../../../core/repositories/mock/mock-tournament-eligibility-profile.repository';

describe('TournamentEligibilityProfilesFormDialogComponent', () => {
  let component: TournamentEligibilityProfilesFormDialogComponent;
  let fixture: ComponentFixture<TournamentEligibilityProfilesFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentEligibilityProfilesFormDialogComponent],
      providers: [TournamentEligibilityProfilesFacadeService, MockTournamentEligibilityProfileRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentEligibilityProfilesFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with slots array', () => {
    expect(component.form).toBeTruthy();
    expect(component.slotsArray).toBeTruthy();
  });

  it('should add slot to slots array', () => {
    const initialLength = component.slotsArray.length;
    component.addSlot();
    expect(component.slotsArray.length).toBe(initialLength + 1);
  });

  it('should remove slot from slots array', () => {
    component.addSlot();
    const initialLength = component.slotsArray.length;
    component.removeSlot(0);
    expect(component.slotsArray.length).toBe(initialLength - 1);
  });

  it('should emit cancelled event', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
