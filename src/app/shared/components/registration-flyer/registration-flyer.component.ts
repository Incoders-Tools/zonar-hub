import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SocialShareComponent, ShareConfig } from '../social-share/social-share.component';
import { ContentService } from '../../../core/services/content.service';
import { FlyerBackground } from '../../../core/models';

export interface FlyerData {
  tournamentName: string;
  date: string;
  location: string;
  playerNames: string[];
  category?: string;
  registrationUrl?: string;
}

@Component({
  selector: 'app-registration-flyer',
  standalone: true,
  imports: [TranslatePipe, SocialShareComponent],
  template: `
    <div class="registration-flyer">
      <h3 class="registration-flyer__title">{{ 'flyers.registrant.title' | t }}</h3>

      <!-- Background selector -->
      <div class="registration-flyer__bg-selector">
        <span class="registration-flyer__bg-label">{{ 'flyers.registrant.selectBackground' | t }}</span>
        <div class="registration-flyer__bg-list">
          @for (bg of availableBackgrounds(); track bg.id) {
            <button
              class="registration-flyer__bg-thumb"
              [class.registration-flyer__bg-thumb--active]="selectedBg()?.id === bg.id"
              [style.backgroundImage]="'url(' + bg.thumbnailUrl + ')'"
              [style.backgroundColor]="'var(--zh-surface-card)'"
              (click)="selectBackground(bg)"
              [attr.aria-label]="bg.name">
            </button>
          }
        </div>
      </div>

      <!-- Flyer preview -->
      <div
        class="registration-flyer__preview"
        [style.backgroundImage]="selectedBg() ? 'url(' + selectedBg()!.imageUrl + ')' : 'none'">
        <div class="registration-flyer__overlay">
          <span class="registration-flyer__badge">{{ 'flyers.registrant.registered' | t }}</span>
          <h2 class="registration-flyer__tournament">{{ data().tournamentName }}</h2>
          <p class="registration-flyer__date">📅 {{ data().date }}</p>
          <p class="registration-flyer__location">📍 {{ data().location }}</p>
          @if (data().category) {
            <p class="registration-flyer__category">🏷️ {{ data().category }}</p>
          }
          <div class="registration-flyer__players">
            @for (name of data().playerNames; track name) {
              <span class="registration-flyer__player">{{ name }}</span>
            }
          </div>
        </div>
      </div>

      <!-- Share -->
      <app-social-share [config]="shareConfig()"></app-social-share>

      <!-- Download -->
      <button class="btn btn--secondary registration-flyer__download" (click)="download()">
        {{ 'flyers.registrant.download' | t }}
      </button>
    </div>
  `,
  styleUrl: './registration-flyer.component.scss'
})
export class RegistrationFlyerComponent {
  private readonly contentService = inject(ContentService);

  readonly data = input.required<FlyerData>();
  readonly selectedBg = signal<FlyerBackground | null>(null);

  readonly availableBackgrounds = computed(() =>
    this.contentService.flyerBackgroundsByCategory('registration')
      .concat(this.contentService.flyerBackgroundsByCategory('tournament'))
      .concat(this.contentService.flyerBackgroundsByCategory('general'))
  );

  constructor() {
    effect(() => {
      const bgs = this.availableBackgrounds();
      if (bgs.length > 0 && !this.selectedBg()) {
        this.selectedBg.set(bgs[0]);
      }
    });
  }

  readonly shareConfig = computed<ShareConfig>(() => {
    const d = this.data();
    return {
      url: d.registrationUrl ?? window.location.href,
      title: d.tournamentName,
      text: d.playerNames.join(' & ') + ' - ' + d.date,
      imageUrl: this.selectedBg()?.imageUrl
    };
  });

  selectBackground(bg: FlyerBackground): void {
    this.selectedBg.set(bg);
  }

  download(): void {
    // Mock download - in production this would use canvas/html2canvas
    const link = document.createElement('a');
    if (this.selectedBg()?.imageUrl) {
      link.href = this.selectedBg()!.imageUrl;
      link.download = `flyer-${this.data().tournamentName.replace(/\s+/g, '-')}.png`;
      link.click();
    }
  }
}
