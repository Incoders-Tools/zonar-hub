import { Component, signal, OnInit } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

const STORAGE_KEY = 'cookie-consent';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.scss'
})
export class CookieConsentComponent implements OnInit {
  readonly visible = signal(false);

  ngOnInit(): void {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      this.visible.set(true);
    }
  }

  accept(): void {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    this.visible.set(false);
  }

  dismiss(): void {
    this.visible.set(false);
  }
}
