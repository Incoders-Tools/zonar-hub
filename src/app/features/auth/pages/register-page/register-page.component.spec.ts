import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPageComponent } from './register-page.component';
import { provideRouter } from '@angular/router';

describe('RegisterPageComponent', () => {
  let component: RegisterPageComponent;
  let fixture: ComponentFixture<RegisterPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on form step', () => {
    expect(component.step()).toBe('form');
  });

  it('should have required form fields', () => {
    expect(component.form.contains('fullName')).toBeTrue();
    expect(component.form.contains('email')).toBeTrue();
    expect(component.form.contains('phone')).toBeTrue();
    expect(component.form.contains('password')).toBeTrue();
    expect(component.form.contains('confirmPassword')).toBeTrue();
    expect(component.form.contains('acceptTerms')).toBeTrue();
  });

  it('should start with form invalid', () => {
    expect(component.formValid()).toBeFalse();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.showConfirm()).toBeFalse();
    component.toggleConfirm();
    expect(component.showConfirm()).toBeTrue();
  });

  it('should detect weak password strength', () => {
    component.form.get('password')?.setValue('short');
    expect(component.getPasswordStrength()).toBe('weak');
  });

  it('should detect strong password strength', () => {
    component.form.get('password')?.setValue('Str0ng!Pass#2024');
    expect(component.getPasswordStrength()).toBe('strong');
  });

  it('should accept terms from dialog', () => {
    component.acceptTermsFromDialog();
    expect(component.form.get('acceptTerms')?.value).toBeTrue();
    expect(component.showTerms()).toBeFalse();
  });

  it('should go back to form from verify step', () => {
    component.step.set('verify');
    component.backToForm();
    expect(component.step()).toBe('form');
  });

  it('should not allow account creation without verification', () => {
    expect(component.canCreateAccount()).toBeFalse();
  });
});
