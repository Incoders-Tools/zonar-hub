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
