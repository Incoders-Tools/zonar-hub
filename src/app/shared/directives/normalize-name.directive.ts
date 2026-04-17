import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Normalizes text input to Title Case in real time.
 * "JOHN DOE" → "John Doe", "john doe" → "John Doe"
 *
 * Usage:
 *   <input formControlName="fullName" appNormalizeName />
 */
@Directive({
  selector: '[appNormalizeName]',
  standalone: true
})
export class NormalizeNameDirective {
  private readonly control = inject(NgControl, { optional: true });

  @HostListener('input', ['$event.target'])
  onInput(target: HTMLInputElement): void {
    const normalized = toTitleCase(target.value);
    if (this.control?.control) {
      this.control.control.setValue(normalized, { emitEvent: false });
    }
    target.value = normalized;
  }
}

/**
 * Converts a string to Title Case.
 * Exported for reuse in services or non-directive contexts.
 */
export function toTitleCase(value: string): string {
  if (!value) return value;
  return value.replace(/\S+/g, word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}
