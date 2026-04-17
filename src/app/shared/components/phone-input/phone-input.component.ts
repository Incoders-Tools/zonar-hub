import { Component, input, output, signal, computed, OnInit, OnDestroy, inject, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

export interface CountryCode {
  iso: string;
  flag: string;
  dialCode: string;
  name: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { iso: 'AR', flag: '🇦🇷', dialCode: '+54', name: 'Argentina' },
  { iso: 'BR', flag: '🇧🇷', dialCode: '+55', name: 'Brasil' },
  { iso: 'CL', flag: '🇨🇱', dialCode: '+56', name: 'Chile' },
  { iso: 'CO', flag: '🇨🇴', dialCode: '+57', name: 'Colombia' },
  { iso: 'EC', flag: '🇪🇨', dialCode: '+593', name: 'Ecuador' },
  { iso: 'ES', flag: '🇪🇸', dialCode: '+34', name: 'España' },
  { iso: 'MX', flag: '🇲🇽', dialCode: '+52', name: 'México' },
  { iso: 'PY', flag: '🇵🇾', dialCode: '+595', name: 'Paraguay' },
  { iso: 'PE', flag: '🇵🇪', dialCode: '+51', name: 'Perú' },
  { iso: 'UY', flag: '🇺🇾', dialCode: '+598', name: 'Uruguay' },
  { iso: 'US', flag: '🇺🇸', dialCode: '+1', name: 'United States' },
  { iso: 'VE', flag: '🇻🇪', dialCode: '+58', name: 'Venezuela' },
];

/**
 * Shared phone input component with country code selector.
 *
 * Value model: full international number string e.g. "+5491112345678"
 * Implements ControlValueAccessor for Reactive Forms integration.
 *
 * Usage:
 *   <app-phone-input formControlName="phone"></app-phone-input>
 *   <app-phone-input [value]="'+5491112345678'" (valueChange)="onPhone($event)"></app-phone-input>
 */
@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ]
})
export class PhoneInputComponent implements ControlValueAccessor {
  private readonly i18n = inject(I18nService);
  readonly countries = COUNTRY_CODES;
  readonly placeholder = input('phone.placeholder');
  readonly required = input(false);
  readonly showValidation = input(true);

  readonly resolvedPlaceholder = computed(() => this.i18n.translate(this.placeholder()));

  readonly selectedCountry = signal('+54');
  readonly phoneNumber = signal('');
  readonly isDisabled = signal(false);
  readonly touched = signal(false);

  readonly showError = computed(() => {
    if (!this.showValidation() || !this.touched()) return false;
    const num = this.phoneNumber().replace(/[\s\-()]/g, '');
    return this.required() && num.length === 0
      ? false // let "required" error show from parent
      : num.length > 0 && (num.length < 6 || num.length > 15 || !/^[0-9]+$/.test(num));
  });

  readonly fullValue = computed(() => {
    const num = this.phoneNumber().replace(/[\s\-()]/g, '');
    if (!num) return '';
    return `${this.selectedCountry()}${num}`;
  });

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {
    this.touched.set(true);
  };

  writeValue(value: string | null): void {
    if (!value) {
      this.selectedCountry.set('+54');
      this.phoneNumber.set('');
      return;
    }
    // Parse full phone into country code + number
    const match = this.parsePhone(value);
    this.selectedCountry.set(match.dialCode);
    this.phoneNumber.set(match.number);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    const original = fn;
    this.onTouched = () => {
      this.touched.set(true);
      original();
    };
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onCountryChange(event: Event): void {
    const dial = (event.target as HTMLSelectElement).value;
    this.selectedCountry.set(dial);
    this.emitValue();
  }

  onNumberInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const cleaned = target.value.replace(/\D/g, '');
    target.value = cleaned;
    this.phoneNumber.set(cleaned);
    this.emitValue();
  }

  onNumberKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onNumberPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = pasted.replace(/\D/g, '');
    const target = event.target as HTMLInputElement;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const current = target.value;
    const newValue = current.slice(0, start) + cleaned + current.slice(end);
    target.value = newValue;
    this.phoneNumber.set(newValue);
    this.emitValue();
    const newPos = start + cleaned.length;
    target.setSelectionRange(newPos, newPos);
  }

  private emitValue(): void {
    this.onChange(this.fullValue());
  }

  private parsePhone(value: string): { dialCode: string; number: string } {
    // Try to match known country codes (longest first)
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const cc of sorted) {
      if (value.startsWith(cc.dialCode)) {
        return { dialCode: cc.dialCode, number: value.slice(cc.dialCode.length) };
      }
    }
    // Fallback: if starts with +, take first few digits as code
    if (value.startsWith('+')) {
      return { dialCode: '+54', number: value.replace(/^\+\d{1,3}/, '') };
    }
    return { dialCode: '+54', number: value };
  }
}
