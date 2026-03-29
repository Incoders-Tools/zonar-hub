import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
  let fixture: ComponentFixture<ProgressBarComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBarComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should render progressbar role', () => {
    const bar = el.querySelector('[role="progressbar"]');
    expect(bar).toBeTruthy();
  });

  it('should clamp progress between 0 and 100', () => {
    fixture.componentRef.setInput('progress', 150);
    fixture.detectChanges();
    const bar = el.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('should show correct percentage', () => {
    fixture.componentRef.setInput('progress', 42);
    fixture.detectChanges();
    const percent = el.querySelector('.progress-bar__percent');
    expect(percent?.textContent?.trim()).toBe('42%');
  });

  it('should render fill bar at correct width', () => {
    fixture.componentRef.setInput('progress', 60);
    fixture.detectChanges();
    const fill = el.querySelector('.progress-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('60%');
  });

  it('should hide title when not provided', () => {
    const title = el.querySelector('.progress-bar__title');
    expect(title).toBeFalsy();
  });

  it('should show stage label when provided', () => {
    fixture.componentRef.setInput('stageLabel', 'Stage 1');
    fixture.detectChanges();
    const stage = el.querySelector('.progress-bar__stage');
    expect(stage?.textContent?.trim()).toBe('Stage 1');
  });

  it('should hide percentage when showPercentage is false', () => {
    fixture.componentRef.setInput('showPercentage', false);
    fixture.detectChanges();
    const percent = el.querySelector('.progress-bar__percent');
    expect(percent).toBeFalsy();
  });

  it('should have accessible min and max attributes', () => {
    const bar = el.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar?.getAttribute('aria-valuemax')).toBe('100');
  });
});
