import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhoneInputComponent } from './phone-input.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

describe('PhoneInputComponent', () => {
  let component: PhoneInputComponent;
  let fixture: ComponentFixture<PhoneInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoneInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PhoneInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render country selector and number input', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.phone-input__country')).toBeTruthy();
    expect(el.querySelector('.phone-input__number')).toBeTruthy();
  });

  it('should default to Argentina +54', () => {
    expect(component.selectedCountry()).toBe('+54');
  });

  it('should update selectedCountry on country change', () => {
    const select = fixture.nativeElement.querySelector('.phone-input__country') as HTMLSelectElement;
    select.value = '+55';
    select.dispatchEvent(new Event('change'));
    expect(component.selectedCountry()).toBe('+55');
  });

  it('should update phoneNumber on input', () => {
    const input = fixture.nativeElement.querySelector('.phone-input__number') as HTMLInputElement;
    input.value = '1112345678';
    input.dispatchEvent(new Event('input'));
    expect(component.phoneNumber()).toBe('1112345678');
  });

  it('should compute full value with country code and number', () => {
    component.selectedCountry.set('+54');
    component.phoneNumber.set('1112345678');
    expect(component.fullValue()).toBe('+541112345678');
  });

  it('should return empty full value when no number', () => {
    component.phoneNumber.set('');
    expect(component.fullValue()).toBe('');
  });

  it('should parse phone value via writeValue', () => {
    component.writeValue('+551112345678');
    expect(component.selectedCountry()).toBe('+55');
    expect(component.phoneNumber()).toBe('1112345678');
  });

  it('should reset on null writeValue', () => {
    component.writeValue(null);
    expect(component.selectedCountry()).toBe('+54');
    expect(component.phoneNumber()).toBe('');
  });

  it('should show error for invalid phone format after touch', () => {
    component.touched.set(true);
    component.phoneNumber.set('12');
    expect(component.showError()).toBe(true);
  });

  it('should not show error for valid phone number', () => {
    component.touched.set(true);
    component.phoneNumber.set('1112345678');
    expect(component.showError()).toBe(false);
  });

  it('should not show error when not touched', () => {
    component.phoneNumber.set('12');
    expect(component.showError()).toBe(false);
  });

  it('should apply disabled state', () => {
    component.setDisabledState(true);
    expect(component.isDisabled()).toBe(true);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.phone-input--disabled')).toBeTruthy();
  });

  it('should call registered onChange on input', () => {
    const spy = jasmine.createSpy('onChange');
    component.registerOnChange(spy);
    component.selectedCountry.set('+54');
    component.phoneNumber.set('1112345678');
    component.onNumberInput({ target: { value: '1112345678' } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith('+541112345678');
  });

  it('should call registered onTouched on blur', () => {
    const spy = jasmine.createSpy('onTouched');
    component.registerOnTouched(spy);
    component.onTouched();
    expect(spy).toHaveBeenCalled();
    expect(component.touched()).toBe(true);
  });
});
