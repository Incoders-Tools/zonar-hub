import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cancels from the button and overlay when not loading', () => {
    const spy = spyOn(component.cancelled, 'emit');
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('.confirm-dialog__cancel')!.click();
    element.querySelector<HTMLElement>('.confirm-overlay')!.click();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('blocks button, overlay, and direct cancellation while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const spy = spyOn(component.cancelled, 'emit');
    const element: HTMLElement = fixture.nativeElement;
    const cancel = element.querySelector<HTMLButtonElement>('.confirm-dialog__cancel')!;
    expect(cancel.disabled).toBeTrue();
    cancel.click();
    element.querySelector<HTMLElement>('.confirm-overlay')!.click();
    component.onCancel();
    expect(spy).not.toHaveBeenCalled();
  });
});
