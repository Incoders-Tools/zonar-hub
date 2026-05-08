import { Injectable } from '@angular/core';
import {
  FileStorageRepository,
  ImageTransformOptions,
  StorageBucket
} from '../file-storage.repository';

/**
 * Lightweight FE-only storage stub. Until the API exposes a real upload
 * endpoint we keep the file in-memory and surface a Data URL the UI can
 * render so flows that already wired image upload don't blow up.
 */
@Injectable({ providedIn: 'root' })
export class ApiFileStorageRepository implements FileStorageRepository {
  async upload(_bucket: StorageBucket, _path: string, file: File): Promise<string> {
    return await this.readAsDataUrl(file);
  }

  async delete(_bucket: StorageBucket, _path: string): Promise<void> {
    // No-op: nothing persisted server-side until the upload endpoint exists.
  }

  buildTransformUrl(url: string, _options: ImageTransformOptions): string {
    return url;
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error('common.unexpectedError'));
      reader.readAsDataURL(file);
    });
  }
}
