import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Normalizes text input to lowercase in real time.
 * "PATRICIO@GMAIL.COM" → "patricio@gmail.com"
 *
 * Usage:
 *   <input formControlName="email" appNormalizeLowercase />
 */
@Directive({
  selector: '[appNormalizeLowercase]',
  standalone: true
})
export class NormalizeLowercaseDirective {
  private readonly control = inject(NgControl, { optional: true });

  @HostListener('input', ['$event.target'])
  onInput(target: HTMLInputElement): void {
    const normalized = target.value.toLowerCase();
    if (this.control?.control) {
      this.control.control.setValue(normalized, { emitEvent: false });
    }
    target.value = normalized;
  }
}
