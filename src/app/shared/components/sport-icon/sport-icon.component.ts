import { Component, input, computed } from '@angular/core';
import { SportIconSource } from '../../../core/models/sport.model';

/**
 * Unified sport icon renderer.
 *
 * Supports two icon sources:
 * - 'unicode': Renders the icon string as text (emoji)
 * - 'svg': Renders an inline SVG from the assets folder using the icon key
 */
@Component({
  selector: 'app-sport-icon',
  standalone: true,
  template: `
    @if (source() === 'svg') {
      <img
        [src]="svgPath()"
        [alt]="alt()"
        class="sport-icon sport-icon--svg"
        [style.width.px]="size()"
        [style.height.px]="size()" />
    } @else {
      <span
        class="sport-icon sport-icon--unicode"
        [style.font-size.px]="size()"
        [attr.aria-label]="alt()">
        {{ icon() }}
      </span>
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .sport-icon--unicode { line-height: 1; }
    .sport-icon--svg { object-fit: contain; }
  `]
})
export class SportIconComponent {
  readonly icon = input.required<string>();
  readonly source = input<SportIconSource>('unicode');
  readonly size = input(24);
  readonly alt = input('');

  readonly svgPath = computed(() =>
    `uploads/sports-icons/${this.icon()}.svg`
  );
}
