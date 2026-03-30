import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TournamentStatusesFormDialogComponent } from './tournament-statuses-form-dialog.component';
import { TournamentStatusesFacadeService } from '../tournament-statuses-facade.service';
import { MockTournamentStatusRepository } from '../../../../../../core/repositories/mock/mock-tournament-status.repository';

describe('TournamentStatusesFormDialogComponent', () => {
  let component: TournamentStatusesFormDialogComponent;
  let fixture: ComponentFixture<TournamentStatusesFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentStatusesFormDialogComponent],
      providers: [TournamentStatusesFacadeService, MockTournamentStatusRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentStatusesFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('name')).toBeTruthy();
  });

  it('should emit cancelled event', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
