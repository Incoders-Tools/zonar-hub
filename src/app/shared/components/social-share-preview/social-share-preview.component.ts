import { Component, input, output, signal, inject, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
      <div class="share-dialog" (click)="$event.stopPropagation()">
        <div class="share-dialog__header">
          <h2 class="share-dialog__title">{{ 'share.previewTitle' | t }}</h2>
          <button class="share-dialog__close" type="button" (click)="close.emit()" [attr.aria-label]="'share.close' | t">✕</button>
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
            <div class="share-dialog__preview-content">
              <h3 class="share-dialog__preview-title">{{ payload().title }}</h3>
              @if (payload().subtitle) {
                <p class="share-dialog__preview-subtitle">{{ payload().subtitle }}</p>
              }
              <div class="share-dialog__preview-divider"></div>
              <div class="share-dialog__preview-lines">
                @for (line of payload().lines; track $index) {
                  <span class="share-dialog__preview-line">{{ line }}</span>
                }
              </div>
              @if (payload().metadata) {
                <div class="share-dialog__preview-meta">
                  @for (entry of metadataEntries(); track entry[0]) {
                    <span class="share-dialog__preview-meta-item">
                      <strong>{{ entry[0] }}</strong> {{ entry[1] }}
                    </span>
                  }
                </div>
              }
            </div>
            <div class="share-dialog__preview-watermark">
              <span class="share-dialog__preview-watermark-text">ZONAR HUB</span>
            </div>
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
export class SocialSharePreviewComponent implements OnInit, OnDestroy {
  private readonly content = inject(ContentService);
  private readonly doc = inject(DOCUMENT);

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
    this.doc.body.style.overflow = 'hidden';
    const bgs = this.availableBackgrounds();
    if (bgs.length > 0) {
      this.selectedBackground.set(bgs[0]);
    }
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscKey(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-overlay')) {
      this.close.emit();
    }
  }

  async downloadImage(): Promise<void> {
    this.downloading.set(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = 1920;

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
          ctx.drawImage(img, 0, 0, 1080, 1920);
        } catch {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, 1080, 1920);
        }
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 1080, 1920);
      }

      // Draw gradient overlay (bottom-heavy for text readability)
      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
      gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Draw content centered vertically
      ctx.textAlign = 'center';

      // Title - large and bold
      ctx.font = 'bold 56px sans-serif';
      ctx.fillStyle = '#ffffff';
      let y = this.drawWrappedText(ctx, this.payload().title, 540, 640, 880, 68);

      // Subtitle
      if (this.payload().subtitle) {
        y += 16;
        ctx.font = '36px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        y = this.drawWrappedText(ctx, this.payload().subtitle!, 540, y, 880, 44);
      }

      // Decorative divider
      y += 24;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(440, y);
      ctx.lineTo(640, y);
      ctx.stroke();
      y += 32;

      // Lines
      ctx.font = '30px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      for (const line of this.payload().lines) {
        ctx.fillText(line, 540, y);
        y += 46;
      }

      // Metadata
      if (this.payload().metadata) {
        y += 16;
        ctx.font = '26px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (const [key, value] of Object.entries(this.payload().metadata!)) {
          ctx.fillText(`${key}: ${value}`, 540, y);
          y += 38;
        }
      }

      // Watermark - bottom right
      ctx.textAlign = 'right';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('ZONAR HUB', 1040, 1880);

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

  private drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  }
}
