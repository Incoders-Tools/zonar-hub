import { InjectionToken } from '@angular/core';

/** Used only when there is no `window` (no browser origin to resolve against). */
const RELATIVE_API_BASE_URL = '/api';

interface WindowWithApiBaseUrl extends Window {
  __ZH_API_BASE_URL__?: string;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Resolves the API base URL from `window.__ZH_API_BASE_URL__`, written into `runtime-config.js`
 * by `scripts/write-runtime-config.mjs` from `ZH_API_BASE_URL`. Without a configured value the
 * app calls the API on its own origin (`${location.origin}/api`).
 */
export function resolveApiBaseUrl(
  win: Window | null = typeof window === 'undefined' ? null : window
): string {
  if (!win) {
    return RELATIVE_API_BASE_URL;
  }

  const configured = (win as WindowWithApiBaseUrl).__ZH_API_BASE_URL__;
  if (typeof configured !== 'string' || configured.trim().length === 0) {
    return `${win.location.origin}${RELATIVE_API_BASE_URL}`;
  }

  return normalizeBaseUrl(configured.trim());
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => resolveApiBaseUrl()
});
