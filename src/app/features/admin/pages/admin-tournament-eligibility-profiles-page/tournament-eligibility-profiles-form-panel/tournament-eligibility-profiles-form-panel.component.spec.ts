import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TournamentEligibilityProfilesFormPanelComponent } from './tournament-eligibility-profiles-form-panel.component';
import { TournamentEligibilityProfilesFacadeService } from '../tournament-eligibility-profiles-facade.service';
import { MockTournamentEligibilityProfileRepository } from '../../../../../core/repositories/tournament-admin.repository';
import { AuthService } from '../../../../../core/auth/auth.service';
import { I18nService } from '../../../../../core/i18n/i18n.service';

describe('TournamentEligibilityProfilesFormPanelComponent', () => {
  let component: TournamentEligibilityProfilesFormPanelComponent;
  let fixture: ComponentFixture<TournamentEligibilityProfilesFormPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentEligibilityProfilesFormPanelComponent],
      providers: [
        I18nService,
        provideNoopAnimations(),
        TournamentEligibilityProfilesFacadeService,
        MockTournamentEligibilityProfileRepository,
        { provide: AuthService, useValue: { isSystemAdmin: () => false } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentEligibilityProfilesFormPanelComponent);
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
