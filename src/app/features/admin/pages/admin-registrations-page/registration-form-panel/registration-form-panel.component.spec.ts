import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrationFormPanelComponent } from './registration-form-panel.component';
import { RegistrationFacadeService } from '../registration-facade.service';
import { RegistrationService } from '../../../../../core/services/registration.service';
import { TournamentService } from '../../../../../core/services/tournament.service';
import { RegistrationStrategyService } from '../../../../../core/services/registration-strategy.service';
import { EligibilityValidationService } from '../../../../../core/services/eligibility-validation.service';
import { MockEligibilityProfileRepository } from '../../../../../core/repositories/mock/mock-eligibility-profile.repository';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiCategoryRepository } from '../../../../../core/repositories/api/api-category.repository';
import { API_BASE_URL } from '../../../../../core/config/api-base-url.token';
import { Registration } from '../../../../../core/models/registration.model';

describe('RegistrationFormPanelComponent', () => {
  let component: RegistrationFormPanelComponent;
  let fixture: ComponentFixture<RegistrationFormPanelComponent>;

  const mockRegistration: Registration = {
    id: 'r1',
    tournamentId: 't1',
    tournamentName: 'Test Tournament',
    participants: [
      { slotNumber: 1, playerId: 'p1', playerName: 'Player One', categoryId: 'cat1', categoryName: 'A', genderId: 'g1', genderLabel: 'Male' },
      { slotNumber: 2, playerId: 'p2', playerName: 'Player Two', categoryId: 'cat1', categoryName: 'A', genderId: 'g1', genderLabel: 'Male' }
    ],
    player1Id: 'p1',
    player1Name: 'Player One',
    player2Id: 'p2',
    player2Name: 'Player Two',
    categoryId: 'cat1',
    categoryName: 'A',
    genderId: 'g1',
    genderLabel: 'Male',
    statusId: 'rs2',
    statusLabel: 'Pending',
    source: 'admin',
    registeredAt: '2024-01-15T10:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationFormPanelComponent],
      providers: [
        RegistrationFacadeService,
        RegistrationService,
        TournamentService,
        RegistrationStrategyService,
        EligibilityValidationService,
        MockEligibilityProfileRepository,
        ApiCategoryRepository,
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationFormPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values in create mode', () => {
    fixture.detectChanges();
    expect(component.form.get('tournamentId')?.value).toBe('');
    expect(component.form.get('source')?.value).toBe('admin');
    expect(component.form.get('observations')?.value).toBe('');
    expect(component.isEditing()).toBe(false);
  });

  it('should mark tournamentId as required', () => {
    fixture.detectChanges();
    const tournamentControl = component.form.get('tournamentId');
    tournamentControl?.setValue('');
    expect(tournamentControl?.hasError('required')).toBe(true);

    tournamentControl?.setValue('t1');
    expect(tournamentControl?.hasError('required')).toBe(false);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should detect edit mode when registration input is provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('registration', mockRegistration);
    });
    fixture.detectChanges();
    expect(component.isEditing()).toBe(true);
  });

  it('should have canSave false when form is invalid', () => {
    fixture.detectChanges();
    expect(component.canSave()).toBe(false);
  });

  it('should track participants on selection', () => {
    fixture.detectChanges();
    const mockPlayer = {
      id: 'p1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      categoryId: 'cat1',
      categoryName: 'A',
      genderId: 'g1',
      genderLabel: 'Male',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    };

    component.onParticipantSelected({ slotNumber: 1, player: mockPlayer });
    expect(component.participants().has(1)).toBe(true);
    expect(component.participants().get(1)?.id).toBe('p1');
  });

  it('should clear participant on slot clear', () => {
    fixture.detectChanges();
    const mockPlayer = {
      id: 'p1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      categoryId: 'cat1',
      categoryName: 'A',
      genderId: 'g1',
      genderLabel: 'Male',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    };

    component.onParticipantSelected({ slotNumber: 1, player: mockPlayer });
    expect(component.participants().has(1)).toBe(true);

    component.onParticipantCleared(1);
    expect(component.participants().has(1)).toBe(false);
  });

  it('should compute selectedPlayerIds from participants', () => {
    fixture.detectChanges();
    const mockPlayer = {
      id: 'p1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      categoryId: 'cat1',
      categoryName: 'A',
      genderId: 'g1',
      genderLabel: 'Male',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    };

    component.onParticipantSelected({ slotNumber: 1, player: mockPlayer });
    expect(component.selectedPlayerIds().has('p1')).toBe(true);
  });
});
