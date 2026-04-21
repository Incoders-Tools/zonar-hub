import { Component, computed, inject, input, output, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, MatIcon, TranslatePipe],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent implements OnDestroy {
  private readonly optimizationService = inject(ImageOptimizationService);

  readonly currentImageUrl = input<string | null>(null);
  readonly accept = input('image/*');
  readonly maxSizeMb = input(5);
  readonly enableOptimization = input(true);
  readonly disabled = input(false);

  readonly imageChanged = output<{ file: File; previewUrl: string }>();
  readonly imageRemoved = output<void>();

  readonly previewUrl = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly optimizing = signal(false);
  readonly error = signal<string | null>(null);
  readonly isDragOver = signal(false);

  readonly displayUrl = computed(() => this.previewUrl() || this.currentImageUrl());

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.disabled()) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  ngOnDestroy(): void {
    this.revokeCurrentPreview();
  }

  removeImage(): void {
    this.revokeCurrentPreview();
    this.previewUrl.set(null);
    this.error.set(null);
    this.imageRemoved.emit();
  }

  private async processFile(file: File): Promise<void> {
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      this.error.set('imageUpload.maxSizeExceeded');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.error.set('imageUpload.invalidType');
      return;
    }

    this.error.set(null);
    this.uploading.set(true);

    try {
      let processedFile = file;
      if (this.enableOptimization()) {
        this.optimizing.set(true);
        const responsive = await this.optimizationService.generateResponsive(file);
        processedFile = responsive.desktop;
        this.optimizing.set(false);
      }

      const previewUrl = URL.createObjectURL(processedFile);
      this.revokeCurrentPreview();
      this.previewUrl.set(previewUrl);
      this.imageChanged.emit({ file: processedFile, previewUrl });
    } finally {
      this.uploading.set(false);
      this.optimizing.set(false);
    }
  }

  private revokeCurrentPreview(): void {
    const current = this.previewUrl();
    if (current?.startsWith('blob:')) {
      URL.revokeObjectURL(current);
    }
  }
}
