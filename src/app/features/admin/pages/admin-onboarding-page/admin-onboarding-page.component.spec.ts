import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminOnboardingPageComponent } from './admin-onboarding-page.component';

describe('AdminOnboardingPageComponent', () => {
  let component: AdminOnboardingPageComponent;
  let fixture: ComponentFixture<AdminOnboardingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOnboardingPageComponent]
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
    component.complexForm.patchValue({ name: 'My Complex', address: '123 St', city: 'Barcelona' });
    component.nextStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should go back to previous step', () => {
    component.currentStep.set(2);
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });
});
