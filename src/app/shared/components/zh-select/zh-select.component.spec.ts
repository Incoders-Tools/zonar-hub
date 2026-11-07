import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZhSelectComponent } from './zh-select.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZhSelectComponent],
  template: `<zh-select [formControl]="modality" [required]="true"
    [options]="options" [errorMessage]="'Modality is required'"
    [error]="explicitError" />`
})
class SelectHostComponent {
  readonly modality = new FormControl('', Validators.required);
  readonly options = [{ value: 'doubles', label: 'Doubles' }];
  explicitError = false;
}

describe('ZhSelectComponent required state', () => {
  let fixture: ComponentFixture<SelectHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectHostComponent);
    fixture.detectChanges();
  });

  function select(): HTMLSelectElement {
    return fixture.nativeElement.querySelector('select') as HTMLSelectElement;
  }

  function expectError(visible: boolean): void {
    const wrapper = fixture.nativeElement.querySelector('.zh-select') as HTMLElement;
    expect(wrapper.classList.contains('zh-select--invalid')).toBe(visible);
    expect(select().getAttribute('aria-invalid')).toBe(visible ? 'true' : null);
    expect(fixture.nativeElement.querySelector('[role="alert"]') !== null).toBe(visible);
  }

  it('clears the required error after selecting a valid modality', () => {
    select().dispatchEvent(new Event('focusout', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.modality.invalid).toBe(true);
    expectError(true);

    select().value = 'doubles';
    select().dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.modality.valid).toBe(true);
    expectError(false);
  });

  it('keeps an explicitly supplied error visible after selecting a value', () => {
    fixture.componentInstance.explicitError = true;
    select().value = 'doubles';
    select().dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expectError(true);
  });
});

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ZhSelectComponent],
  template: `<zh-select [formControl]="court" [options]="options" [placeholder]="placeholder" />`
})
class PreselectHostComponent {
  readonly court = new FormControl('court-2', { nonNullable: true });
  options = [{ value: 'court-1', label: 'Central' }, { value: 'court-2', label: 'Lateral' }];
  placeholder = 'No court';
}

describe('ZhSelectComponent selected option', () => {
  function render(initial: string, placeholder = 'No court'): ComponentFixture<PreselectHostComponent> {
    const fixture = TestBed.createComponent(PreselectHostComponent);
    fixture.componentInstance.court.setValue(initial);
    fixture.componentInstance.placeholder = placeholder;
    fixture.detectChanges();
    return fixture;
  }

  function select(fixture: ComponentFixture<PreselectHostComponent>): HTMLSelectElement {
    return fixture.nativeElement.querySelector('select') as HTMLSelectElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PreselectHostComponent] }).compileComponents();
  });

  it('renders a value written before the first render as the selected option', () => {
    const fixture = render('court-2');
    expect(select(fixture).value).toBe('court-2');
    expect(select(fixture).selectedOptions[0].textContent?.trim()).toBe('Lateral');
  });

  it('keeps the selected option when the options arrive or change after the value', () => {
    const fixture = render('court-2');
    fixture.componentInstance.options = [{ value: 'court-0', label: 'Anexo' }, ...fixture.componentInstance.options];
    fixture.detectChanges();
    expect(select(fixture).value).toBe('court-2');

    fixture.componentInstance.court.setValue('court-1');
    fixture.detectChanges();
    expect(select(fixture).value).toBe('court-1');
  });

  it('selects the placeholder when there is no value, and the first option without a placeholder', () => {
    expect(select(render('')).value).toBe('');
    expect(select(render('')).selectedOptions[0].textContent?.trim()).toBe('No court');
    expect(select(render('', '')).value).toBe('court-1');
  });

  it('emits the chosen value to the form control', () => {
    const fixture = render('');
    select(fixture).value = 'court-1';
    select(fixture).dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.court.value).toBe('court-1');
  });
});
