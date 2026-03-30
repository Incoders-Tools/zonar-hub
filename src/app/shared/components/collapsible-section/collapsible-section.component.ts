import { Component, input, output, signal, OnInit } from '@angular/core';
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
  readonly isExpanded = signal(false);
  readonly expandedChange = output<boolean>();

  ngOnInit(): void {
    this.isExpanded.set(this.initialExpanded());
  }

  toggle(): void {
    this.isExpanded.update(v => !v);
    this.expandedChange.emit(this.isExpanded());
  }
}
