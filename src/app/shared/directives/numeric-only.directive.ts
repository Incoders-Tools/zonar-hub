import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Restricts input to digits only (0-9) in real time.
 * Strips any non-numeric characters as the user types.
 *
 * Usage:
 *   <input formControlName="phone" appNumericOnly />
 */
@Directive({
  selector: '[appNumericOnly]',
  standalone: true
})
export class NumericOnlyDirective {
  private readonly control = inject(NgControl, { optional: true });

  @HostListener('input', ['$event.target'])
  onInput(target: HTMLInputElement): void {
    const cleaned = target.value.replace(/\D/g, '');
    if (this.control?.control) {
      this.control.control.setValue(cleaned, { emitEvent: false });
    }
    target.value = cleaned;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Allow control keys: backspace, tab, enter, escape, arrows, delete, home, end
    const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    // Allow Ctrl/Cmd combinations (copy, paste, select all)
    if (event.ctrlKey || event.metaKey) return;
    // Block non-digit keys
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = pasted.replace(/\D/g, '');
    const target = event.target as HTMLInputElement;
    // Insert cleaned content at cursor position
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const current = target.value;
    const newValue = current.slice(0, start) + cleaned + current.slice(end);
    target.value = newValue;
    if (this.control?.control) {
      this.control.control.setValue(newValue, { emitEvent: false });
    }
    // Restore cursor position
    const newPos = start + cleaned.length;
    target.setSelectionRange(newPos, newPos);
  }
}
