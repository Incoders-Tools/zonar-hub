import { Component, input, output, computed } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Reusable isActive toggle / display component.
 *
 * Modes:
 * - 'badge'  : Read-only status pill (for tables, detail views)
 * - 'toggle' : Interactive checkbox with status badge (for forms)
 */
@Component({
  selector: 'app-active-toggle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (mode() === 'toggle') {
      <label class="active-toggle active-toggle--interactive"
        [class.active-toggle--disabled]="disabled()">
        <span class="active-toggle__switch"
          [class.active-toggle__switch--on]="value()">
          <input
            type="checkbox"
            [checked]="value()"
            [disabled]="disabled()"
            (change)="onToggle($event)"
            class="active-toggle__input" />
          <span class="active-toggle__track">
            <span class="active-toggle__thumb"></span>
          </span>
        </span>
        <span
          class="active-toggle__badge"
          [class.active-toggle__badge--active]="value()"
          [class.active-toggle__badge--inactive]="!value()">
          {{ statusKey() | t }}
        </span>
      </label>
    } @else {
      <span
        class="active-toggle__badge"
        [class.active-toggle__badge--active]="value()"
        [class.active-toggle__badge--inactive]="!value()">
        {{ statusKey() | t }}
      </span>
    }
  `,
  styleUrl: './active-toggle.component.scss'
})
export class ActiveToggleComponent {
  readonly value = input.required<boolean>();
  readonly mode = input<'badge' | 'toggle'>('badge');
  readonly disabled = input(false);
  readonly activeLabelKey = input('common.active');
  readonly inactiveLabelKey = input('common.inactive');

  readonly toggled = output<boolean>();

  readonly statusKey = computed(() =>
    this.value() ? this.activeLabelKey() : this.inactiveLabelKey()
  );

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggled.emit(checked);
  }
}
