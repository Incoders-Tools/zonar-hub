import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TutorialModalComponent } from './tutorial-modal.component';

describe('TutorialModalComponent', () => {
  let fixture: ComponentFixture<TutorialModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TutorialModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(TutorialModalComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle minimized state', () => {
    expect(fixture.componentInstance.minimized()).toBe(false);
    fixture.componentInstance.toggleMinimize();
    expect(fixture.componentInstance.minimized()).toBe(true);
  });
});
