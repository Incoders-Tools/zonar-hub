import { Component, input, output, signal, computed, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';

/**
 * Professional 6-digit OTP input component.
 *
 * Features:
 * - 6 distinct input slots
 * - Auto-focus advance
 * - Paste support for full code
 * - Backspace navigation
 * - Visual feedback for each digit
 *
 * Usage:
 *   <app-otp-input (codeComplete)="onCode($event)" [disabled]="verifying()"></app-otp-input>
 */
@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [],
  template: `
    <div class="otp-input" [class.otp-input--disabled]="disabled()" [class.otp-input--error]="error()">
      <div class="otp-input__slots">
        @for (digit of digits(); track $index) {
          <input
            #digitInput
            class="otp-input__digit"
            [class.otp-input__digit--filled]="digit !== ''"
            [class.otp-input__digit--active]="focusedIndex() === $index"
            type="text"
            inputmode="numeric"
            maxlength="1"
            autocomplete="one-time-code"
            [value]="digit"
            [disabled]="disabled()"
            (input)="onDigitInput($event, $index)"
            (keydown)="onKeyDown($event, $index)"
            (focus)="onFocus($index)"
            (paste)="onPaste($event, $index)"
            [attr.aria-label]="'Digit ' + ($index + 1)" />
        }
      </div>
    </div>
  `,
  styleUrl: './otp-input.component.scss'
})
export class OtpInputComponent implements AfterViewInit {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly length = input(6);
  readonly disabled = input(false);
  readonly error = input(false);

  readonly codeComplete = output<string>();
  readonly codeChanged = output<string>();

  readonly digits = signal<string[]>(['', '', '', '', '', '']);
  readonly focusedIndex = signal(-1);

  readonly code = computed(() => this.digits().join(''));
  readonly isComplete = computed(() => this.code().length === this.length() && /^\d+$/.test(this.code()));

  ngAfterViewInit(): void {
    this.focusSlot(0);
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length > 0) {
      this.setDigit(index, value[0]);
      if (index < this.length() - 1) {
        this.focusSlot(index + 1);
      }
    } else {
      this.setDigit(index, '');
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.digits()[index] === '' && index > 0) {
        this.setDigit(index - 1, '');
        this.focusSlot(index - 1);
        event.preventDefault();
      } else {
        this.setDigit(index, '');
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusSlot(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < this.length() - 1) {
      this.focusSlot(index + 1);
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent, _index: number): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, this.length());
    if (pasted.length > 0) {
      const newDigits = [...this.digits()];
      for (let i = 0; i < pasted.length && i < this.length(); i++) {
        newDigits[i] = pasted[i];
      }
      this.digits.set(newDigits);
      this.emitCode();
      const nextFocus = Math.min(pasted.length, this.length() - 1);
      this.focusSlot(nextFocus);
    }
  }

  onFocus(index: number): void {
    this.focusedIndex.set(index);
  }

  /** Reset all digits */
  reset(): void {
    this.digits.set(Array(this.length()).fill(''));
    this.focusSlot(0);
  }

  private setDigit(index: number, value: string): void {
    const newDigits = [...this.digits()];
    newDigits[index] = value;
    this.digits.set(newDigits);
    this.emitCode();
  }

  private emitCode(): void {
    const code = this.code();
    this.codeChanged.emit(code);
    if (this.isComplete()) {
      this.codeComplete.emit(code);
    }
  }

  private focusSlot(index: number): void {
    setTimeout(() => {
      const inputs = this.digitInputs?.toArray();
      if (inputs && inputs[index]) {
        inputs[index].nativeElement.focus();
        inputs[index].nativeElement.select();
      }
    });
  }
}
