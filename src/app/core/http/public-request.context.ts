import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marks a request to an anonymous public endpoint. Interceptors that attach credentials or
 * tenant/organization headers must skip requests carrying this flag, even for logged-in visitors.
 */
export const PUBLIC_REQUEST = new HttpContextToken<boolean>(() => false);

export function publicRequestContext(): HttpContext {
  return new HttpContext().set(PUBLIC_REQUEST, true);
}
