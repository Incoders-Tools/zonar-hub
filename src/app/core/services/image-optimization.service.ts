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

@Injectable({ providedIn: 'root' })
export class ImageOptimizationService {
  private readonly MOCK_DELAY = 300;

  async resize(file: File, dimensions: ImageDimensions): Promise<File> {
    await this.delay();
    // Mock: returns original file (in real impl would resize)
    return new File([file], file.name, { type: file.type });
  }

  async compress(file: File, quality: number = 0.8): Promise<File> {
    await this.delay();
    return new File([file], file.name, { type: file.type });
  }

  async crop(file: File, region: CropRegion): Promise<File> {
    await this.delay();
    return new File([file], file.name, { type: file.type });
  }

  async generateResponsive(file: File): Promise<ResponsiveImageSet> {
    await this.delay();
    return {
      desktop: new File([file], `desktop_${file.name}`, { type: file.type }),
      tablet: new File([file], `tablet_${file.name}`, { type: file.type }),
      mobile: new File([file], `mobile_${file.name}`, { type: file.type })
    };
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.MOCK_DELAY));
  }
}
