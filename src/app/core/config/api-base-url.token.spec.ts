import { resolveApiBaseUrl } from './api-base-url.token';

function fakeWindow(configured: unknown, origin = 'https://hub.example.com'): Window {
  return { __ZH_API_BASE_URL__: configured, location: { origin } } as unknown as Window;
}

describe('resolveApiBaseUrl', () => {
  it('uses the configured runtime value and trims trailing slashes', () => {
    expect(resolveApiBaseUrl(fakeWindow('https://api.example.com/api//'))).toBe('https://api.example.com/api');
  });

  it('trims surrounding whitespace from the configured value', () => {
    expect(resolveApiBaseUrl(fakeWindow('  https://api.example.com/api  '))).toBe('https://api.example.com/api');
  });

  it('falls back to the same-origin /api when the configured value is blank', () => {
    expect(resolveApiBaseUrl(fakeWindow('   '))).toBe('https://hub.example.com/api');
  });

  it('falls back to the same-origin /api when no value is configured', () => {
    expect(resolveApiBaseUrl(fakeWindow(undefined, 'https://other.example.org'))).toBe('https://other.example.org/api');
  });

  it('falls back to a relative /api path when there is no window', () => {
    expect(resolveApiBaseUrl(null)).toBe('/api');
  });

  it('never resolves to a localhost address when nothing is configured', () => {
    expect(resolveApiBaseUrl(null)).not.toContain('localhost');
    expect(resolveApiBaseUrl(fakeWindow(''))).not.toContain('localhost');
  });
});
