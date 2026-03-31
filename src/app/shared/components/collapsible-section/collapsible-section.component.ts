import { Component, input, output, signal, effect, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-collapsible-section',
  standalone: true,
  imports: [MatIcon, TranslatePipe],
  templateUrl: './collapsible-section.component.html',
  styleUrl: './collapsible-section.component.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('250ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class CollapsibleSectionComponent implements OnInit {
  readonly titleKey = input.required<string>();
  readonly initialExpanded = input(false);
  /** External control: parent can drive expanded state via this input. */
  readonly expanded = input<boolean | undefined>(undefined);
  readonly isExpanded = signal(false);
  readonly expandedChange = output<boolean>();

  constructor() {
    effect(() => {
      const ext = this.expanded();
      if (ext !== undefined) {
        this.isExpanded.set(ext);
      }
    });
  }

  ngOnInit(): void {
    if (this.expanded() === undefined) {
      this.isExpanded.set(this.initialExpanded());
    }
  }

  toggle(): void {
    this.isExpanded.update(v => !v);
    this.expandedChange.emit(this.isExpanded());
  }

  /** Programmatic control for collapse-all / expand-all via @ViewChildren. */
  setExpanded(value: boolean): void {
    this.isExpanded.set(value);
    this.expandedChange.emit(value);
  }
}
