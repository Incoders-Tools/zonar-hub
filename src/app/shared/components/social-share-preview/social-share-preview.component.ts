import { Component, input, output, signal, inject, computed, OnInit } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AsyncButtonComponent } from '../async-button/async-button.component';
import { ContentService } from '../../../core/services/content.service';
import { FlyerBackground } from '../../../core/models';

/**
 * Payload for social share preview.
 */
export interface SocialSharePayload {
  type: 'tournament' | 'registration' | 'general';
  title: string;
  subtitle?: string;
  lines: string[];
  metadata?: Record<string, string>;
  imageUrl?: string;
}

@Component({
  selector: 'app-social-share-preview',
  standalone: true,
  imports: [TranslatePipe, AsyncButtonComponent],
  template: `
    <div class="share-overlay" (click)="onOverlayClick($event)">
      <div class="share-dialog">
        <div class="share-dialog__header">
          <h2 class="share-dialog__title">{{ 'share.previewTitle' | t }}</h2>
          <button class="share-dialog__close" (click)="close.emit()" [attr.aria-label]="'share.close' | t">✕</button>
        </div>

        <!-- Background selector -->
        <div class="share-dialog__backgrounds">
          <label class="share-dialog__bg-label">{{ 'share.selectBackground' | t }}</label>
          <div class="share-dialog__bg-options">
            @for (bg of availableBackgrounds(); track bg.id) {
              <button
                class="share-dialog__bg-thumb"
                [class.share-dialog__bg-thumb--active]="selectedBackground()?.id === bg.id"
                [style.backgroundImage]="'url(' + bg.thumbnailUrl + ')'"
                (click)="selectedBackground.set(bg)">
              </button>
            }
            @if (availableBackgrounds().length === 0) {
              <p class="share-dialog__no-bg">{{ 'share.noBackgrounds' | t }}</p>
            }
          </div>
        </div>

        <!-- Preview canvas -->
        <div class="share-dialog__preview"
             [style.backgroundImage]="selectedBackground() ? 'url(' + selectedBackground()!.imageUrl + ')' : 'none'"
             [style.backgroundColor]="'var(--zh-surface-elevated)'"
             #previewEl>
          <div class="share-dialog__preview-overlay">
            <div class="share-dialog__preview-logo">Zonar Hub</div>
            <h3 class="share-dialog__preview-title">{{ payload().title }}</h3>
            @if (payload().subtitle) {
              <p class="share-dialog__preview-subtitle">{{ payload().subtitle }}</p>
            }
            <div class="share-dialog__preview-lines">
              @for (line of payload().lines; track $index) {
                <span class="share-dialog__preview-line">{{ line }}</span>
              }
            </div>
            @if (payload().metadata) {
              <div class="share-dialog__preview-meta">
                @for (entry of metadataEntries(); track entry[0]) {
                  <span class="share-dialog__preview-meta-item">
                    <strong>{{ entry[0] }}:</strong> {{ entry[1] }}
                  </span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="share-dialog__actions">
          <button class="share-dialog__btn share-dialog__btn--secondary" (click)="close.emit()">
            {{ 'share.close' | t }}
          </button>
          <app-async-button
            variant="primary"
            [loading]="downloading()"
            (clicked)="downloadImage()">
            {{ 'share.download' | t }}
          </app-async-button>
        </div>

        <p class="share-dialog__hint">{{ 'share.shareToInstagramHint' | t }}</p>
      </div>
    </div>
  `,
  styleUrl: './social-share-preview.component.scss'
})
export class SocialSharePreviewComponent implements OnInit {
  private readonly content = inject(ContentService);

  readonly payload = input.required<SocialSharePayload>();
  readonly close = output<void>();
  readonly shared = output<void>();

  readonly selectedBackground = signal<FlyerBackground | null>(null);
  readonly downloading = signal(false);

  readonly availableBackgrounds = computed(() => {
    const type = this.payload().type;
    const category = type === 'tournament' ? 'tournament'
      : type === 'registration' ? 'registration'
      : 'general';
    return this.content.flyerBackgrounds().filter(b => b.isActive && (b.category === category || b.category === 'general'));
  });

  readonly metadataEntries = computed(() => {
    const meta = this.payload().metadata;
    if (!meta) return [];
    return Object.entries(meta);
  });

  ngOnInit(): void {
    const bgs = this.availableBackgrounds();
    if (bgs.length > 0) {
      this.selectedBackground.set(bgs[0]);
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-overlay')) {
      this.close.emit();
    }
  }

  async downloadImage(): Promise<void> {
    this.downloading.set(true);
    try {
      // Create a canvas-based image from the preview
      const previewEl = document.querySelector('.share-dialog__preview') as HTMLElement;
      if (!previewEl) return;

      // Use html2canvas-like approach with canvas API
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = 1080;

      // Draw background
      const bg = this.selectedBackground();
      if (bg?.imageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = bg.imageUrl;
          });
          ctx.drawImage(img, 0, 0, 1080, 1080);
        } catch {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, 1080, 1080);
        }
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 1080, 1080);
      }

      // Draw overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 1080, 1080);

      // Draw logo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Zonar Hub', 540, 80);

      // Draw title
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText(this.payload().title, 540, 200);

      // Draw subtitle
      if (this.payload().subtitle) {
        ctx.font = '32px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(this.payload().subtitle ?? '', 540, 260);
      }

      // Draw lines
      ctx.font = '28px sans-serif';
      ctx.fillStyle = '#ffffff';
      let y = 340;
      for (const line of this.payload().lines) {
        ctx.fillText(line, 540, y);
        y += 44;
      }

      // Download
      const link = document.createElement('a');
      link.download = `zonar-${this.payload().type}-share.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      this.shared.emit();
    } finally {
      this.downloading.set(false);
    }
  }
}
