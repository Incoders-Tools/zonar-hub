import { Injectable } from '@angular/core';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResponsiveImageSet {
  desktop: File;
  tablet: File;
  mobile: File;
}

export const RESPONSIVE_PRESETS = {
  desktop: { width: 1200, height: 800 },
  tablet: { width: 768, height: 512 },
  mobile: { width: 375, height: 250 }
} as const;

/** Default WebP quality (0–1). Balances size and visual quality for web. */
const DEFAULT_QUALITY = 0.82;

/** Max dimension (px) for the longest side when no explicit dimensions given. */
const MAX_DIMENSION = 2400;

@Injectable({ providedIn: 'root' })
export class ImageOptimizationService {

  /**
   * Resize an image file to the given dimensions.
   * Preserves aspect ratio — the result fits within the bounding box.
   */
  async resize(file: File, dimensions: ImageDimensions): Promise<File> {
    const img = await this.loadImage(file);
    const { width, height } = this.fitWithinBounds(img.naturalWidth, img.naturalHeight, dimensions.width, dimensions.height);
    return this.drawToBlob(img, width, height, file.name, DEFAULT_QUALITY);
  }

  /**
   * Compress an image to WebP at the given quality (0–1).
   * Also downscales if either dimension exceeds MAX_DIMENSION.
   */
  async compress(file: File, quality: number = DEFAULT_QUALITY): Promise<File> {
    const img = await this.loadImage(file);
    const { width, height } = this.fitWithinBounds(img.naturalWidth, img.naturalHeight, MAX_DIMENSION, MAX_DIMENSION);
    return this.drawToBlob(img, width, height, file.name, quality);
  }

  /** Crop a specific region from an image and return as WebP. */
  async crop(file: File, region: CropRegion): Promise<File> {
    const img = await this.loadImage(file);
    return this.drawCroppedToBlob(img, region, file.name);
  }

  /**
   * Produce desktop / tablet / mobile variants in WebP.
   * Used for hero images and cover uploads.
   */
  async generateResponsive(file: File): Promise<ResponsiveImageSet> {
    const img = await this.loadImage(file);

    const [desktop, tablet, mobile] = await Promise.all([
      this.renderVariant(img, RESPONSIVE_PRESETS.desktop, `desktop_${file.name}`),
      this.renderVariant(img, RESPONSIVE_PRESETS.tablet, `tablet_${file.name}`),
      this.renderVariant(img, RESPONSIVE_PRESETS.mobile, `mobile_${file.name}`)
    ]);

    return { desktop, tablet, mobile };
  }

  /**
   * Compact logo optimiser: resize to fit a square bounding box and compress.
   * Suitable for logo / avatar fields.
   */
  async optimizeLogo(file: File, maxSidePx = 400): Promise<File> {
    const img = await this.loadImage(file);
    const { width, height } = this.fitWithinBounds(img.naturalWidth, img.naturalHeight, maxSidePx, maxSidePx);
    return this.drawToBlob(img, width, height, file.name, DEFAULT_QUALITY);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${file.name}`));
      };
      img.src = url;
    });
  }

  private fitWithinBounds(
    srcW: number, srcH: number,
    maxW: number, maxH: number
  ): ImageDimensions {
    const ratio = Math.min(maxW / srcW, maxH / srcH, 1); // never upscale
    return {
      width: Math.round(srcW * ratio),
      height: Math.round(srcH * ratio)
    };
  }

  private drawToBlob(
    img: HTMLImageElement,
    width: number,
    height: number,
    originalName: string,
    quality: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Canvas toBlob produced no output'));
            return;
          }
          const webpName = this.toWebpName(originalName);
          resolve(new File([blob], webpName, { type: 'image/webp' }));
        },
        'image/webp',
        quality
      );
    });
  }

  private drawCroppedToBlob(
    img: HTMLImageElement,
    region: CropRegion,
    originalName: string
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = region.width;
      canvas.height = region.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Canvas toBlob produced no output'));
            return;
          }
          resolve(new File([blob], this.toWebpName(originalName), { type: 'image/webp' }));
        },
        'image/webp',
        DEFAULT_QUALITY
      );
    });
  }

  private async renderVariant(
    img: HTMLImageElement,
    preset: ImageDimensions,
    name: string
  ): Promise<File> {
    const { width, height } = this.fitWithinBounds(img.naturalWidth, img.naturalHeight, preset.width, preset.height);
    return this.drawToBlob(img, width, height, name, DEFAULT_QUALITY);
  }

  private toWebpName(name: string): string {
    return name.replace(/\.[^.]+$/, '') + '.webp';
  }
}
