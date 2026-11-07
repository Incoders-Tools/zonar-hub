import { FormControl } from '@angular/forms';
import {
  CONTACT_EMAIL_MAX_LENGTH,
  PROFILE_URL_MAX_LENGTH,
  contactEmailValidator,
  httpUrlValidator,
  whatsappPhoneValidator
} from './contact.validators';

describe('contact validators', () => {
  describe('httpUrlValidator', () => {
    const validate = (value: string | null) => httpUrlValidator()(new FormControl(value));

    it('accepts blank values because every link is optional', () => {
      expect(validate('')).toBeNull();
      expect(validate('   ')).toBeNull();
      expect(validate(null)).toBeNull();
    });

    it('accepts absolute http and https URLs', () => {
      expect(validate('https://www.instagram.com/club')).toBeNull();
      expect(validate('http://club.example.com')).toBeNull();
      expect(validate('  https://club.example.com/path  ')).toBeNull();
    });

    it('rejects other schemes, relative values and plain text', () => {
      expect(validate('javascript:alert(1)')).toEqual({ httpUrl: true });
      expect(validate('ftp://x')).toEqual({ httpUrl: true });
      expect(validate('mailto:club@example.com')).toEqual({ httpUrl: true });
      expect(validate('www.club.com')).toEqual({ httpUrl: true });
      expect(validate('/club')).toEqual({ httpUrl: true });
    });

    it('rejects URLs longer than the API limit', () => {
      const tooLong = `https://example.com/${'a'.repeat(PROFILE_URL_MAX_LENGTH)}`;
      const exact = `https://example.com/${'a'.repeat(PROFILE_URL_MAX_LENGTH - 'https://example.com/'.length)}`;

      expect(PROFILE_URL_MAX_LENGTH).toBe(500);
      expect(validate(exact)).toBeNull();
      expect(validate(tooLong)).toEqual({ httpUrlTooLong: true });
    });
  });

  describe('contactEmailValidator', () => {
    const validate = (value: string | null) => contactEmailValidator()(new FormControl(value));

    it('accepts blank values and valid emails', () => {
      expect(validate('')).toBeNull();
      expect(validate('hola@club.com')).toBeNull();
      expect(validate(' hola@club.com.ar ')).toBeNull();
    });

    it('rejects malformed emails', () => {
      expect(validate('hola')).toEqual({ contactEmail: true });
      expect(validate('hola@club')).toEqual({ contactEmail: true });
      expect(validate('ho la@club.com')).toEqual({ contactEmail: true });
      expect(validate('a@b@c.com')).toEqual({ contactEmail: true });
    });

    it('rejects emails longer than the API limit', () => {
      const tooLong = `${'a'.repeat(CONTACT_EMAIL_MAX_LENGTH)}@club.com`;

      expect(CONTACT_EMAIL_MAX_LENGTH).toBe(254);
      expect(validate(tooLong)).toEqual({ contactEmailTooLong: true });
    });
  });

  describe('whatsappPhoneValidator', () => {
    const validate = (value: string | null) => whatsappPhoneValidator()(new FormControl(value));

    it('accepts blank values and 8 to 16 digits with an optional leading plus', () => {
      expect(validate('')).toBeNull();
      expect(validate('+5491122334455')).toBeNull();
      expect(validate('12345678')).toBeNull();
      expect(validate('+1234567890123456')).toBeNull();
    });

    it('rejects letters, separators and lengths outside 8 to 16 digits', () => {
      expect(validate('+54 9 11 2233')).toEqual({ whatsappPhone: true });
      expect(validate('54911abc4455')).toEqual({ whatsappPhone: true });
      expect(validate('1234567')).toEqual({ whatsappPhone: true });
      expect(validate('12345678901234567')).toEqual({ whatsappPhone: true });
      expect(validate('++12345678')).toEqual({ whatsappPhone: true });
    });
  });
});
