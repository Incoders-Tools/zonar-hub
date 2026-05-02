import {
  Component,
  ElementRef,
  ViewChild,
  forwardRef,
  inject,
  input,
  signal,
  computed,
  OnInit
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormControl,
  NgControl
} from '@angular/forms';
import { DateFormatService } from '../../../core/services/date-format.service';

/**
 * Shared date input component that respects the user's preferred date format.
 *
 * Internally stores dates as ISO strings (yyyy-MM-dd).
 * Displays dates in the format configured via DateFormatService.
 * Provides a calendar popup via a hidden native date input.
 */
@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="date-input" [class.date-input--error]="hasError()" [class.date-input--disabled]="isDisabled()">
      <input
        class="date-input__text"
        type="text"
        [placeholder]="placeholder()"
        [value]="displayValue()"
        (input)="onTextInput($event)"
        (blur)="onBlur()"
        [disabled]="isDisabled()"
        [attr.aria-label]="placeholder()"
      />
      <button
        class="date-input__calendar-btn"
        type="button"
        tabindex="-1"
        [disabled]="isDisabled()"
        (click)="openCalendar()"
        aria-label="Open calendar">
        📅
      </button>
      <input
        #nativePicker
        class="date-input__native"
        type="date"
        [min]="min() || ''"
        [max]="max() || ''"
        [value]="isoValue()"
        (change)="onNativeChange($event)"
        tabindex="-1"
      />
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .date-input {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .date-input__text {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 0.75rem;
      border: 1px solid var(--zh-border, #d1d5db);
      border-radius: var(--zh-radius-md);
      font-size: var(--zh-font-size-md);
      color: var(--zh-text-primary);
      background: var(--zh-surface-card);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      font-family: inherit;
    }
    .date-input__text:focus {
      outline: none;
      border-color: var(--zh-primary);
      box-shadow: 0 0 0 2px rgba(var(--zh-primary-rgb, 59, 130, 246), 0.15);
    }
    .date-input__text::placeholder {
      color: var(--zh-text-muted);
    }
    .date-input--error .date-input__text {
      border-color: var(--zh-danger);
    }
    .date-input--disabled .date-input__text {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .date-input__calendar-btn {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 6px;
      font-size: 16px;
      line-height: 1;
      border-radius: var(--zh-radius-sm);
      transition: background 0.15s ease;
    }
    .date-input__calendar-btn:hover:not(:disabled) {
      background: var(--zh-surface-muted);
    }
    .date-input__calendar-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .date-input__native {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true
    }
  ]
})
export class DateInputComponent implements ControlValueAccessor {
  @ViewChild('nativePicker', { static: true }) nativePicker!: ElementRef<HTMLInputElement>;

  private readonly dateFormat = inject(DateFormatService);

  readonly min = input<string | null>('');
  readonly max = input<string | null>('');
  readonly hasError = input<boolean>(false);
  readonly externalDisabled = input<boolean>(false);

  readonly isoValue = signal<string>('');
  private readonly internalDisabled = signal<boolean>(false);

  readonly isDisabled = computed(() => this.externalDisabled() || this.internalDisabled());

  readonly placeholder = computed(() => {
    const fmt = this.dateFormat.format();
    return fmt.toLowerCase();
  });

  readonly displayValue = computed(() => {
    const iso = this.isoValue();
    if (!iso) return '';
    return this.formatIsoToDisplay(iso);
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.isoValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.internalDisabled.set(isDisabled);
  }

  onTextInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    
    // Only allow numbers and common date separators
    const sanitized = raw.replace(/[^0-9\/\-\.]/g, '');
    if (sanitized !== raw) {
      input.value = sanitized;
      return;
    }
    
    const iso = this.parseDisplayToIso(sanitized);
    if (iso) {
      this.isoValue.set(iso);
      this.onChange(iso);
    } else if (sanitized === '') {
      this.isoValue.set('');
      this.onChange('');
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  onNativeChange(event: Event): void {
    const iso = (event.target as HTMLInputElement).value;
    this.isoValue.set(iso);
    this.onChange(iso);
  }

  openCalendar(): void {
    this.nativePicker.nativeElement.showPicker?.();
    this.nativePicker.nativeElement.click();
  }

  private formatIsoToDisplay(iso: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) return iso;
    const [, year, month, day] = match;
    return this.dateFormat.format()
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year);
  }

  private parseDisplayToIso(display: string): string | null {
    const fmt = this.dateFormat.format();
    const sep = fmt.replace(/[dMy]/g, '').charAt(0) || '/';
    const parts = display.split(sep);
    if (parts.length !== 3) return null;

    const fmtParts = fmt.split(sep);
    const map: Record<string, string> = {};
    fmtParts.forEach((fp, i) => {
      if (fp.includes('d')) map['day'] = parts[i];
      else if (fp.includes('M')) map['month'] = parts[i];
      else if (fp.includes('y')) map['year'] = parts[i];
    });

    const day = parseInt(map['day'], 10);
    const month = parseInt(map['month'], 10);
    const year = parseInt(map['year'], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}
