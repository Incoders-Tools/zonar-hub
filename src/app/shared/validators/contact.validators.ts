import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Contact and social-link validators. They mirror the API rules for organization public
 * profiles; blank values are valid because every link is optional (the API stores them as null).
 */

export const PROFILE_URL_MAX_LENGTH = 500;
export const CONTACT_EMAIL_MAX_LENGTH = 254;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const WHATSAPP_PHONE_PATTERN = /^\+?[0-9]{8,16}$/;

function trimmedValue(control: AbstractControl): string {
  const value = control.value;
  return typeof value === 'string' ? value.trim() : '';
}

/** Absolute http/https URL with a host, at most 500 characters. Errors: `httpUrlTooLong`, `httpUrl`. */
export function httpUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = trimmedValue(control);
    if (!value) return null;
    if (value.length > PROFILE_URL_MAX_LENGTH) return { httpUrlTooLong: true };

    try {
      const url = new URL(value);
      const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
      return isHttp && url.hostname ? null : { httpUrl: true };
    } catch {
      return { httpUrl: true };
    }
  };
}

/** One @, no whitespace and a dot in the domain, at most 254 characters. Errors: `contactEmailTooLong`, `contactEmail`. */
export function contactEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = trimmedValue(control);
    if (!value) return null;
    if (value.length > CONTACT_EMAIL_MAX_LENGTH) return { contactEmailTooLong: true };
    return EMAIL_PATTERN.test(value) ? null : { contactEmail: true };
  };
}

/** Optional leading plus followed by 8 to 16 digits, nothing else. Error: `whatsappPhone`. */
export function whatsappPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = trimmedValue(control);
    if (!value) return null;
    return WHATSAPP_PHONE_PATTERN.test(value) ? null : { whatsappPhone: true };
  };
}
