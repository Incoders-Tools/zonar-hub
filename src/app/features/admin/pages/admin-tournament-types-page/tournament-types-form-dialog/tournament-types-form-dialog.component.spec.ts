import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TournamentTypesFormDialogComponent } from './tournament-types-form-dialog.component';
import { TournamentTypesFacadeService } from '../tournament-types-facade.service';
import { MockTournamentTypeRepository } from '../../../../../core/repositories/tournament-admin.repository';

describe('TournamentTypesFormDialogComponent', () => {
  let component: TournamentTypesFormDialogComponent;
  let fixture: ComponentFixture<TournamentTypesFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentTypesFormDialogComponent],
      providers: [TournamentTypesFacadeService, MockTournamentTypeRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentTypesFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with checkbox fields', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('scoresPoints')).toBeTruthy();
    expect(component.form.get('appliesGender')).toBeTruthy();
  });

  it('should emit cancelled event', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
