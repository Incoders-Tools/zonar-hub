import { Injectable } from '@angular/core';
import {
  FileStorageRepository,
  StorageBucket,
  ImageTransformOptions
} from '../file-storage.repository';

/**
 * Mock implementation of FileStorageRepository.
 *
 * Converts uploaded files to Data URLs and keeps them in an in-memory map.
 * This makes uploads "work" end-to-end in the browser during local development
 * and in unit tests — no network required, no credentials needed.
 *
 * Note: Data URLs are not persisted across page reloads.
 */
@Injectable({ providedIn: 'root' })
export class MockFileStorageRepository implements FileStorageRepository {
  /** key: `{bucket}/{path}` → data URL */
  private readonly store = new Map<string, string>();

  async upload(bucket: StorageBucket, path: string, file: File): Promise<string> {
    const dataUrl = await this.toDataUrl(file);
    const key = `${bucket}/${path}`;
    this.store.set(key, dataUrl);
    return dataUrl;
  }

  async delete(bucket: StorageBucket, path: string): Promise<void> {
    this.store.delete(`${bucket}/${path}`);
  }

  buildTransformUrl(url: string, _options: ImageTransformOptions): string {
    // Mock has no CDN transform capability — return as-is.
    return url;
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }
}
