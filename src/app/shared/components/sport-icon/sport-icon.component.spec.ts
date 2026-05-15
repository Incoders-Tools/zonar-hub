import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SportIconComponent } from './sport-icon.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [SportIconComponent],
  template: `<app-sport-icon [icon]="icon" [source]="source" [size]="size" />`
})
class TestHostComponent {
  icon = '🎾';
  source: 'unicode' | 'svg' = 'unicode';
  size = 24;
}

describe('SportIconComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render unicode icon as text', () => {
    const span = fixture.nativeElement.querySelector('.sport-icon--unicode');
    expect(span).toBeTruthy();
    expect(span.textContent.trim()).toBe('🎾');
  });

  it('should render svg icon as image', () => {
    fixture.componentInstance.source = 'svg';
    fixture.componentInstance.icon = 'padel';
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.sport-icon--svg');
    expect(img).toBeTruthy();
    expect(img.src).toContain('uploads/sports-icons/padel.svg');
  });

  it('should apply custom size', () => {
    fixture.componentInstance.size = 32;
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.sport-icon--unicode');
    expect(span.style.fontSize).toBe('32px');
  });
});
