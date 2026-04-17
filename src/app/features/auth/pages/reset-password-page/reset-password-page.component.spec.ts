import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasswordPageComponent } from './reset-password-page.component';
import { provideRouter } from '@angular/router';

describe('ResetPasswordPageComponent', () => {
  let component: ResetPasswordPageComponent;
  let fixture: ComponentFixture<ResetPasswordPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render reset password heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading).toBeTruthy();
  });

  it('should have password and confirmPassword fields', () => {
    expect(component.form.contains('password')).toBeTrue();
    expect(component.form.contains('confirmPassword')).toBeTrue();
  });

  it('should start with form invalid', () => {
    expect(component.formValid()).toBeFalse();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
  });

  it('should toggle confirm visibility', () => {
    expect(component.showConfirm()).toBeFalse();
    component.toggleConfirm();
    expect(component.showConfirm()).toBeTrue();
  });

  it('should detect password mismatch', () => {
    component.form.patchValue({ password: 'Password1!', confirmPassword: 'Different1!' });
    component.form.updateValueAndValidity();
    expect(component.form.get('confirmPassword')?.hasError('passwordMismatch')).toBeTrue();
  });

  it('should be valid when passwords match', () => {
    component.form.patchValue({ password: 'Password1!', confirmPassword: 'Password1!' });
    component.form.updateValueAndValidity();
    expect(component.form.valid).toBeTrue();
  });

  it('should detect weak password strength', () => {
    component.form.get('password')?.setValue('short');
    expect(component.getPasswordStrength()).toBe('weak');
  });
});
