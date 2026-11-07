import { HttpContext } from '@angular/common/http';
import { PUBLIC_REQUEST, publicRequestContext } from './public-request.context';

describe('PUBLIC_REQUEST', () => {
  it('defaults to false so ordinary requests keep their credentials', () => {
    expect(new HttpContext().get(PUBLIC_REQUEST)).toBeFalse();
  });

  it('is set by publicRequestContext()', () => {
    expect(publicRequestContext().get(PUBLIC_REQUEST)).toBeTrue();
  });

  it('returns a fresh context on every call so the flag never leaks to another request', () => {
    expect(publicRequestContext()).not.toBe(publicRequestContext());
  });
});
