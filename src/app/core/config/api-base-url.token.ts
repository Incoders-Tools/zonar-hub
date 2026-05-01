import { InjectionToken } from '@angular/core';

const DEFAULT_API_BASE_URL = 'http://localhost:5336/api';

interface WindowWithApiBaseUrl extends Window {
  __ZH_API_BASE_URL__?: string;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_API_BASE_URL;
  }

  const configured = (window as WindowWithApiBaseUrl).__ZH_API_BASE_URL__;
  if (typeof configured !== 'string' || configured.trim().length === 0) {
    return DEFAULT_API_BASE_URL;
  }

  return normalizeBaseUrl(configured.trim());
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: resolveApiBaseUrl
});
