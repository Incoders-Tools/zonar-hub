import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { DrawStandingRowView } from '../draw-view.model';

/** Read-only standings of a group or round robin, rendered in the order the API resolver gives. */
@Component({
  selector: 'app-draw-standings-table',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './draw-standings-table.component.html',
  styleUrl: './draw-standings-table.component.scss'
})
export class DrawStandingsTableComponent {
  readonly rows = input.required<DrawStandingRowView[]>();
  /** Already translated table caption (for example "Posiciones del Grupo A"). */
  readonly caption = input.required<string>();
}
