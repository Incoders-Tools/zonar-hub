import { Component, input, output, signal } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface ShareConfig {
  url: string;
  title: string;
  text?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="social-share">
      <span class="social-share__label">{{ 'share.label' | t }}</span>
      <div class="social-share__buttons">
        <button
          class="social-share__btn social-share__btn--whatsapp"
          (click)="shareWhatsApp()"
          [attr.aria-label]="'share.whatsapp' | t">
          📱
        </button>
        <button
          class="social-share__btn social-share__btn--twitter"
          (click)="shareTwitter()"
          [attr.aria-label]="'share.twitter' | t">
          🐦
        </button>
        <button
          class="social-share__btn social-share__btn--facebook"
          (click)="shareFacebook()"
          [attr.aria-label]="'share.facebook' | t">
          📘
        </button>
        @if (showInstagram()) {
          <button
            class="social-share__btn social-share__btn--instagram"
            (click)="instagramRequested.emit()"
            [attr.aria-label]="'share.instagram' | t">
            📸
          </button>
        }
        <button
          class="social-share__btn social-share__btn--copy"
          (click)="copyLink()"
          [attr.aria-label]="'share.copyLink' | t">
          {{ copied() ? '✅' : '🔗' }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './social-share.component.scss'
})
export class SocialShareComponent {
  readonly config = input.required<ShareConfig>();
  readonly showInstagram = input(false);
  readonly copied = signal(false);

  /** Emitted when the user clicks the Instagram button (opens preview dialog externally) */
  readonly instagramRequested = output<void>();

  shareWhatsApp(): void {
    const c = this.config();
    const text = encodeURIComponent(`${c.title}\n${c.text ?? ''}\n${c.url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  }

  shareTwitter(): void {
    const c = this.config();
    const text = encodeURIComponent(c.title);
    const url = encodeURIComponent(c.url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener');
  }

  shareFacebook(): void {
    const c = this.config();
    const url = encodeURIComponent(c.url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener');
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.config().url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }
}
