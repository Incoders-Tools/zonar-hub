import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookieConsentComponent } from './cookie-consent.component';

describe('CookieConsentComponent', () => {
  let component: CookieConsentComponent;
  let fixture: ComponentFixture<CookieConsentComponent>;

  beforeEach(async () => {
    localStorage.removeItem('cookie-consent');

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(CookieConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('cookie-consent');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be visible when no consent stored', () => {
    expect(component.visible()).toBeTrue();
  });

  it('should be hidden when consent already stored', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    const fresh = TestBed.createComponent(CookieConsentComponent);
    fresh.componentInstance.ngOnInit();
    expect(fresh.componentInstance.visible()).toBeFalse();
  });

  it('should hide and store consent on accept()', () => {
    component.accept();
    expect(component.visible()).toBeFalse();
    expect(localStorage.getItem('cookie-consent')).toBe('accepted');
  });

  it('should hide on dismiss() without storing consent', () => {
    component.dismiss();
    expect(component.visible()).toBeFalse();
    expect(localStorage.getItem('cookie-consent')).toBeNull();
  });
});
