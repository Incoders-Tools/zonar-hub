import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-cookie-policy-page',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './cookie-policy-page.component.html',
  styleUrl: './cookie-policy-page.component.scss'
})
export class CookiePolicyPageComponent {}
