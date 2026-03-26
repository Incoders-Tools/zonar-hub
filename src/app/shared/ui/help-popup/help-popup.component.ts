import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-help-popup',
  standalone: true,
  templateUrl: './help-popup.component.html',
  styleUrl: './help-popup.component.scss'
})
export class HelpPopupComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) body!: string;
}
