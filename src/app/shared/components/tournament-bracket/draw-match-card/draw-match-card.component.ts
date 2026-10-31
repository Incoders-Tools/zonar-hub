import { Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { DrawMatchView, DrawSideView } from '../draw-view.model';

/** One draw match: two pair rows with per-set games, winner check, BYE and pending placeholders. */
@Component({
  selector: 'app-draw-match-card',
  standalone: true,
  imports: [NgTemplateOutlet, MatIcon, TranslatePipe],
  templateUrl: './draw-match-card.component.html',
  styleUrl: './draw-match-card.component.scss'
})
export class DrawMatchCardComponent {
  readonly match = input.required<DrawMatchView>();
  /** Renders the card as a button that emits `activated`; bye matches are never activatable. */
  readonly activatable = input(true);
  readonly activated = output<HTMLElement>();

  readonly isButton = computed(() => this.activatable() && !this.match().isBye);
  readonly sides = computed<DrawSideView[]>(() => [this.match().home, this.match().away]);
  readonly isHighlighted = computed(() => this.match().home.isHighlighted || this.match().away.isHighlighted);

  activate(event: Event): void {
    this.activated.emit(event.currentTarget as HTMLElement);
  }
}
