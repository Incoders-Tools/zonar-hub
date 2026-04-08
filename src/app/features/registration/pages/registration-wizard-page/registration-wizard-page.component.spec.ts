import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { RegistrationWizardPageComponent } from './registration-wizard-page.component';
import { WizardFacadeService, WizardSlot } from './wizard-facade.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Tournament } from '../../../../core/models';

describe('RegistrationWizardPageComponent', () => {
  let component: RegistrationWizardPageComponent;
  let fixture: ComponentFixture<RegistrationWizardPageComponent>;
  let facadeSpy: jasmine.SpyObj<WizardFacadeService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  const mockTournament: Tournament = {
    id: 't1',
    name: 'Test Tournament',
    complexId: 'c1',
    complexName: 'Complex A',
    categoryId: 'cat1',
    categoryName: 'Category A',
    genderId: 'g1',
    genderLabel: 'Male',
    tournamentTypeId: 'tt1',
    tournamentTypeName: 'Standard',
    sportId: 's1',
    sportName: 'Padel',
    statusId: 'ts1',
    statusLabel: 'Open',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
    registrationStartDate: '2026-03-01',
    registrationEndDate: '2026-03-31',
    maxPairs: 16,
    description: 'Test',
    rules: '',
    createdAt: '2026-01-01'
  };

  const mockSlots: WizardSlot[] = [
    { slotNumber: 1, label: null, genderId: null, categoryId: null, minAge: null, maxAge: null, required: true },
    { slotNumber: 2, label: null, genderId: null, categoryId: null, minAge: null, maxAge: null, required: true }
  ];

  beforeEach(async () => {
    facadeSpy = jasmine.createSpyObj('WizardFacadeService', [
      'loadTournament', 'selectParticipant', 'clearParticipant',
      'getOtherSelectedPlayerIds', 'getEligibilitySlotForSlotNumber',
      'submitRegistration', 'sendVerificationCode', 'verifyCode'
    ], {
      tournament: signal<Tournament | null>(mockTournament),
      config: signal(null),
      eligibilityProfile: signal(null),
      participants: signal(new Map()),
      existingRegistrations: signal([]),
      categories: signal([]),
      habitualPartnerSuggestion: signal(null),
      loading: signal(false),
      submitting: signal(false),
      slotCount: signal(2),
      allSlotsValid: signal(false),
      slots: signal(mockSlots)
    });

    facadeSpy.getOtherSelectedPlayerIds.and.returnValue(new Set());
    facadeSpy.getEligibilitySlotForSlotNumber.and.returnValue(null);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [RegistrationWizardPageComponent],
      providers: [
        I18nService,
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 't1' } } }
        }
      ]
    })
    .overrideComponent(RegistrationWizardPageComponent, {
      set: {
        providers: [{ provide: WizardFacadeService, useValue: facadeSpy }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationWizardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tournament on init', () => {
    expect(facadeSpy.loadTournament).toHaveBeenCalledWith('t1');
  });

  it('should start at step 0', () => {
    expect(component.currentStep()).toBe(0);
  });

  it('should advance to next step', () => {
    component.nextStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should go back to previous step', () => {
    component.nextStep();
    component.prevStep();
    expect(component.currentStep()).toBe(0);
  });

  it('should not go below step 0', () => {
    component.prevStep();
    expect(component.currentStep()).toBe(0);
  });

  it('should not advance beyond step 3', () => {
    component.currentStep.set(3);
    component.nextStep();
    expect(component.currentStep()).toBe(3);
  });

  it('should update step on onStepChanged', () => {
    component.onStepChanged(2);
    expect(component.currentStep()).toBe(2);
  });

  it('should generate steps with correct label keys', () => {
    const steps = component.steps();
    expect(steps.length).toBe(4);
    expect(steps[0].labelKey).toBe('registration.step.participants');
    expect(steps[1].labelKey).toBe('registration.step.availability');
    expect(steps[2].labelKey).toBe('registration.step.verification');
    expect(steps[3].labelKey).toBe('registration.step.confirmation');
  });

  it('should mark previous steps as completed', () => {
    component.currentStep.set(2);
    const steps = component.steps();
    expect(steps[0].completed).toBe(true);
    expect(steps[1].completed).toBe(true);
    expect(steps[2].completed).toBe(false);
  });

  it('should toggle tutorial visibility', () => {
    expect(component.showTutorial()).toBe(false);
    component.showTutorial.set(true);
    expect(component.showTutorial()).toBe(true);
  });

  it('should call facade sendVerificationCode when sending code', async () => {
    facadeSpy.sendVerificationCode.and.returnValue(Promise.resolve());
    await component.sendCode();
    expect(component.codeSent()).toBe(true);
    expect(notificationSpy.success).toHaveBeenCalledWith('registration.codeSent');
  });

  it('should verify code successfully', async () => {
    facadeSpy.verifyCode.and.returnValue(Promise.resolve(true));
    component.verificationCode.setValue('123456');
    await component.verifyCode();
    expect(component.codeVerified()).toBe(true);
    expect(notificationSpy.success).toHaveBeenCalledWith('registration.codeVerified');
  });

  it('should show error on invalid code', async () => {
    facadeSpy.verifyCode.and.returnValue(Promise.resolve(false));
    component.verificationCode.setValue('000000');
    await component.verifyCode();
    expect(component.codeVerified()).toBe(false);
    expect(notificationSpy.error).toHaveBeenCalledWith('registration.codeInvalid');
  });

  it('should submit registration and navigate on success', async () => {
    const mockReg = { id: 'r1', tournamentId: 't1' };
    facadeSpy.submitRegistration.and.returnValue(Promise.resolve(mockReg as any));
    await component.submitRegistration();
    expect(notificationSpy.success).toHaveBeenCalledWith('registration.success');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tournaments', 't1', 'confirmed-pairs']);
  });

  it('should show duplicate pair error on submission failure', async () => {
    facadeSpy.submitRegistration.and.returnValue(Promise.reject(new Error('registration.duplicatePair')));
    await component.submitRegistration();
    expect(notificationSpy.error).toHaveBeenCalledWith('registration.duplicatePair');
  });

  it('should show generic error on submission failure', async () => {
    facadeSpy.submitRegistration.and.returnValue(Promise.reject(new Error('Unknown error')));
    await component.submitRegistration();
    expect(notificationSpy.error).toHaveBeenCalledWith('registration.errorSubmit');
  });
});
