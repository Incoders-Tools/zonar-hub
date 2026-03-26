import { Component } from '@angular/core';
import { HelpPopupComponent } from '../../../../shared/ui/help-popup/help-popup.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HelpPopupComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {}
