import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveToggleComponent } from './active-toggle.component';
import { I18nService } from '../../../core/i18n/i18n.service';

describe('ActiveToggleComponent', () => {
  let component: ActiveToggleComponent;
  let fixture: ComponentFixture<ActiveToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveToggleComponent],
      providers: [I18nService]
    }).compileComponents();
  });

  function createComponent(value: boolean, mode: 'badge' | 'toggle' = 'badge'): void {
    fixture = TestBed.createComponent(ActiveToggleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('mode', mode);
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent(true);
    expect(component).toBeTruthy();
  });

  it('should render active badge when value is true', () => {
    createComponent(true);
    const badge = fixture.nativeElement.querySelector('.active-toggle__badge--active');
    expect(badge).toBeTruthy();
  });

  it('should render inactive badge when value is false', () => {
    createComponent(false);
    const badge = fixture.nativeElement.querySelector('.active-toggle__badge--inactive');
    expect(badge).toBeTruthy();
  });

  it('should not show checkbox in badge mode', () => {
    createComponent(true, 'badge');
    const checkbox = fixture.nativeElement.querySelector('.active-toggle__input');
    expect(checkbox).toBeNull();
  });

  it('should show checkbox in toggle mode', () => {
    createComponent(true, 'toggle');
    const checkbox = fixture.nativeElement.querySelector('.active-toggle__input');
    expect(checkbox).toBeTruthy();
  });

  it('should emit toggled event on checkbox change', () => {
    createComponent(true, 'toggle');
    const spy = spyOn(component.toggled, 'emit');
    const checkbox = fixture.nativeElement.querySelector('.active-toggle__input') as HTMLInputElement;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('should respect disabled input', () => {
    fixture = TestBed.createComponent(ActiveToggleComponent);
    fixture.componentRef.setInput('value', true);
    fixture.componentRef.setInput('mode', 'toggle');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('.active-toggle__input') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });
});
