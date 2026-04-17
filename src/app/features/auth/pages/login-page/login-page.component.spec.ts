import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPageComponent } from './login-page.component';
import { provideRouter } from '@angular/router';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render login heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading).toBeTruthy();
  });

  it('should have email and password fields', () => {
    expect(component.form.contains('email')).toBeTrue();
    expect(component.form.contains('password')).toBeTrue();
  });

  it('should start with form invalid', () => {
    expect(component.formValid()).toBeFalse();
  });

  it('should become valid when email and password are filled', () => {
    component.form.patchValue({ email: 'test@example.com', password: 'password123' });
    expect(component.form.valid).toBeTrue();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
  });

  it('should disable submit when form is invalid', () => {
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button?.disabled).toBeTrue();
  });

  it('should not submit when blocked', async () => {
    component.isBlocked.set(true);
    component.form.patchValue({ email: 'test@example.com', password: 'pass' });
    await component.onSubmit();
    expect(component.submitting()).toBeFalse();
  });
});
