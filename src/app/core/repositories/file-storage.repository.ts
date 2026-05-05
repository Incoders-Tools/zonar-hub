/**
 * Repository contract for binary file storage.
 *
 * Concrete implementations:
 *  - MockFileStorageRepository  → keeps a local in-memory/Data-URL map (dev / mock mode)
 *  - ApiFileStorageRepository   → delegates to the .NET API which proxies to Supabase Storage
 *
 * The API implementation is responsible for:
 *  - authenticating the multipart upload
 *  - sanitising / re-encoding the image server-side if needed
 *  - returning the permanent public CDN URL (with Supabase image transformation params baked in)
 */
export interface FileStorageRepository {
  /**
   * Upload a binary file to a logical bucket/path.
   *
   * @param bucket  Logical storage bucket (e.g. 'complexes', 'players', 'sports')
   * @param path    Path inside the bucket (e.g. '{orgId}/logo.webp')
   * @param file    The file to upload (should already be optimised before calling)
   * @returns       Permanent public URL to access the stored file
   */
  upload(bucket: StorageBucket, path: string, file: File): Promise<string>;

  /**
   * Delete a previously stored file.
   *
   * @param bucket  Logical storage bucket
   * @param path    Path inside the bucket (as returned by upload)
   */
  delete(bucket: StorageBucket, path: string): Promise<void>;

  /**
   * Build a URL with inline transformation hints (resize + format).
   * Implementations backed by Supabase Storage can append query params;
   * others may return the URL as-is.
   */
  buildTransformUrl(url: string, options: ImageTransformOptions): string;
}

/** Logical storage buckets — must match server-side bucket configuration. */
export type StorageBucket = 'complexes' | 'players' | 'sports' | 'organizations' | 'flyer-backgrounds';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  /** Output format. Defaults to 'webp'. */
  format?: 'webp' | 'jpeg' | 'png' | 'origin';
  /** How to resize when both width and height are given. */
  resize?: 'cover' | 'contain' | 'fill';
}

/** DI token for the active FileStorageRepository implementation. */
import { InjectionToken } from '@angular/core';
export const FILE_STORAGE_REPOSITORY = new InjectionToken<FileStorageRepository>('FILE_STORAGE_REPOSITORY');
