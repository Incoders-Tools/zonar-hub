import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordPageComponent } from './forgot-password-page.component';
import { provideRouter } from '@angular/router';

describe('ForgotPasswordPageComponent', () => {
  let component: ForgotPasswordPageComponent;
  let fixture: ComponentFixture<ForgotPasswordPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render forgot password heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading).toBeTruthy();
  });

  it('should have email field', () => {
    expect(component.form.contains('email')).toBeTrue();
  });

  it('should start with form invalid', () => {
    expect(component.formValid()).toBeFalse();
  });

  it('should start in unsent state', () => {
    expect(component.sent()).toBeFalse();
  });

  it('should become valid with a valid email', () => {
    component.form.patchValue({ email: 'test@example.com' });
    expect(component.form.valid).toBeTrue();
  });

  it('should show validation error for invalid email', () => {
    component.form.get('email')?.setValue('invalid');
    component.form.get('email')?.markAsTouched();
    expect(component.form.get('email')?.hasError('email')).toBeTrue();
  });
});
