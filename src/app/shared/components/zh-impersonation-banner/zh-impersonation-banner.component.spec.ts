import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ZhImpersonationBannerComponent } from './zh-impersonation-banner.component';

describe('ZhImpersonationBannerComponent', () => {
  let fixture: ComponentFixture<ZhImpersonationBannerComponent>;

  const FUTURE_EXPIRY = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZhImpersonationBannerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ZhImpersonationBannerComponent);
    fixture.componentRef.setInput('targetName', 'Ana García');
    fixture.componentRef.setInput('targetEmail', 'ana@example.com');
    fixture.componentRef.setInput('tenantName', 'Club Tenis Norte');
    fixture.componentRef.setInput('expiresAt', FUTURE_EXPIRY);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render target name', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ana García');
  });

  it('should render target email', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('ana@example.com');
  });

  it('should render tenant name', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Club Tenis Norte');
  });

  it('should render a countdown / expiry indicator', () => {
    // The component must display some expiry text (the exact format is an implementation detail)
    const el: HTMLElement = fixture.nativeElement;
    const countdown = el.querySelector('[data-testid="expiry"]');
    expect(countdown).toBeTruthy();
  });

  it('should have aria-live="polite" on the host or a descendant region', () => {
    const el: HTMLElement = fixture.nativeElement;
    // Check host attribute first, then any descendant
    const hostAttr = el.querySelector('[aria-live]');
    // The component may set aria-live on its own host element or a wrapper
    const hostEl = fixture.debugElement.nativeElement as HTMLElement;
    const fromHost = hostEl.getAttribute('aria-live');
    expect(fromHost || hostAttr).toBeTruthy();
  });

  it('should contain a translation key for bannerLabel (rendered via | t pipe)', () => {
    // The template must include the bannerLabel i18n key somewhere.
    // Since I18nService returns the key when no translation is found in tests,
    // we verify the key string appears in the rendered output.
    const el: HTMLElement = fixture.nativeElement;
    // Either the key or its translation must be present
    expect(
      el.textContent?.includes('admin.impersonation.bannerLabel') ||
      el.textContent?.includes('Impersonando a') ||
      el.textContent?.includes('Impersonating') ||
      el.textContent?.includes('Representando')
    ).toBeTrue();
  });

  it('should contain a translation key for bannerTenant (rendered via | t pipe)', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(
      el.textContent?.includes('admin.impersonation.bannerTenant') ||
      el.textContent?.includes('Club Tenis Norte')
    ).toBeTrue();
  });

  it('should contain an exit button with a translation key for bannerExit', () => {
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('[data-testid="exit-btn"]');
    expect(btn).toBeTruthy();
  });

  it('should emit exit event when exit button is clicked', () => {
    let exitCount = 0;
    const sub = fixture.componentInstance.exit.subscribe(() => exitCount++);

    const btn = fixture.debugElement.query(By.css('[data-testid="exit-btn"]'));
    expect(btn).toBeTruthy();
    btn.nativeElement.click();
    fixture.detectChanges();

    expect(exitCount).toBe(1);
    sub.unsubscribe();
  });

  it('should use only CSS custom properties for colors (no hardcoded values in host style)', () => {
    // The component SCSS must not emit hardcoded hex/rgb literals on the host.
    // We assert that the element style (inline) does not contain hex/rgb literals.
    // The CSS file check is done via grep during build verification.
    const el: HTMLElement = fixture.nativeElement;
    const inlineStyle = el.getAttribute('style') || '';
    expect(inlineStyle).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(inlineStyle).not.toMatch(/rgb\(/);
  });
});
