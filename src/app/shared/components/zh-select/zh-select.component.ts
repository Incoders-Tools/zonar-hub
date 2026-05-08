import {
  Component,
  forwardRef,
  input,
  computed,
  signal,
  inject,
  DestroyRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface ZhSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Reusable select control standardising markup, styles, validation messages
 * and a11y across every admin form. Implements ControlValueAccessor so it can
 * be bound with `formControlName` or `[(ngModel)]` exactly like the native
 * element it replaces.
 */
@Component({
  selector: 'zh-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zh-select.component.html',
  styleUrl: './zh-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ZhSelectComponent),
      multi: true
    }
  ]
})
export class ZhSelectComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);

  readonly label = input<string>('');
  readonly required = input<boolean>(false);
  readonly options = input<ZhSelectOption[]>([]);
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly errorMessage = input<string>('');
  readonly error = input<boolean>(false);
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
  readonly inputId = input<string>('');

  protected readonly value = signal<string>('');
  protected readonly touched = signal<boolean>(false);
  protected readonly disabledByFormControl = signal<boolean>(false);

  protected readonly isDisabled = computed(() =>
    this.disabledInput() || this.disabledByFormControl()
  );

  protected readonly hasError = computed(() =>
    !!this.error() || (!!this.errorMessage() && this.touched())
  );

  protected readonly autoId = computed(() =>
    this.inputId() || `zh-select-${Math.random().toString(36).slice(2, 9)}`
  );

  protected readonly selectedOption = computed(() =>
    this.options().find(o => o.value === this.value())
  );

  protected readonly selectedDescription = computed(() =>
    this.selectedOption()?.description ?? ''
  );

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByFormControl.set(isDisabled);
  }

  protected handleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  @HostListener('focusout')
  protected handleBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }
}
