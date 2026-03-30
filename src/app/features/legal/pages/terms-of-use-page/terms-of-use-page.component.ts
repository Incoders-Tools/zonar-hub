import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-terms-of-use-page',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './terms-of-use-page.component.html',
  styleUrl: './terms-of-use-page.component.scss'
})
export class TermsOfUsePageComponent {}
