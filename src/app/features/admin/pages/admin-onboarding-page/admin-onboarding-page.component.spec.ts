import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminOnboardingPageComponent } from './admin-onboarding-page.component';
import { provideHttpClient } from '@angular/common/http';

describe('AdminOnboardingPageComponent', () => {
  let component: AdminOnboardingPageComponent;
  let fixture: ComponentFixture<AdminOnboardingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOnboardingPageComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOnboardingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start at step 0', () => {
    expect(component.currentStep()).toBe(0);
  });

  it('should advance to next step when form is valid', () => {
    component.orgForm.patchValue({ displayName: 'My Organization', type: 'circuito' });
    component.nextStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should go back to previous step', () => {
    component.currentStep.set(2);
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });
});
