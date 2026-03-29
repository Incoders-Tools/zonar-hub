import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingStateComponent } from './loading-state.component';

describe('LoadingStateComponent', () => {
  let fixture: ComponentFixture<LoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingStateComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(LoadingStateComponent);
    fixture.detectChanges();
  });

  it('should render a spinner', () => {
    const spinner = fixture.nativeElement.querySelector('.loading-state__spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show message by default', () => {
    const msg = fixture.nativeElement.querySelector('.loading-state__message');
    expect(msg).toBeTruthy();
  });

  it('should hide message when showMessage is false', () => {
    fixture.componentRef.setInput('showMessage', false);
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.loading-state__message');
    expect(msg).toBeFalsy();
  });

  it('should have role status for accessibility', () => {
    const el = fixture.nativeElement.querySelector('.loading-state');
    expect(el?.getAttribute('role')).toBe('status');
  });

  it('should use custom message key', () => {
    fixture.componentRef.setInput('messageKey', 'common.loading');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.loading-state');
    expect(el?.getAttribute('aria-label')).toBeTruthy();
  });
});
