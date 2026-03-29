import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoaderOverlayComponent } from './loader-overlay.component';

describe('LoaderOverlayComponent', () => {
  let fixture: ComponentFixture<LoaderOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderOverlayComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(LoaderOverlayComponent);
    fixture.detectChanges();
  });

  it('should render an overlay with role status', () => {
    const el: HTMLElement = fixture.nativeElement;
    const overlay = el.querySelector('.loader-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay?.getAttribute('role')).toBe('status');
  });

  it('should contain a spinner element', () => {
    const spinner = fixture.nativeElement.querySelector('.loader-overlay__spinner');
    expect(spinner).toBeTruthy();
  });

  it('should have an accessible label', () => {
    const overlay = fixture.nativeElement.querySelector('.loader-overlay');
    expect(overlay?.getAttribute('aria-label')).toBeTruthy();
  });
});
