import { Injectable } from '@angular/core';

const ORDINAL_MAP: Record<number, { key: string; shortName: string; name: string }> = {
  1: { key: 'first', shortName: '1ª', name: '1ª Categoría' },
  2: { key: 'second', shortName: '2ª', name: '2ª Categoría' },
  3: { key: 'third', shortName: '3ª', name: '3ª Categoría' },
  4: { key: 'fourth', shortName: '4ª', name: '4ª Categoría' },
  5: { key: 'fifth', shortName: '5ª', name: '5ª Categoría' },
  6: { key: 'sixth', shortName: '6ª', name: '6ª Categoría' },
  7: { key: 'seventh', shortName: '7ª', name: '7ª Categoría' },
  8: { key: 'eighth', shortName: '8ª', name: '8ª Categoría' },
  9: { key: 'ninth', shortName: '9ª', name: '9ª Categoría' },
  10: { key: 'tenth', shortName: '10ª', name: '10ª Categoría' }
};

@Injectable({ providedIn: 'root' })
export class EntityKeyService {
  /**
   * Generates a snake_case key from a display name.
   * Transliterates common Spanish/Portuguese characters and normalizes to ASCII.
   * Preserves ª as it is a valid character in category names.
   */
  generateKey(name: string): string {
    if (!name || !name.trim()) {
      return '';
    }

    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/ñ/g, 'n')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  }

  /**
   * Normalizes a display name to sentence case (first letter uppercase, rest lowercase).
   */
  normalizeName(name: string): string {
    if (!name || !name.trim()) {
      return '';
    }

    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  /**
   * Checks if a key is unique within a given set of existing keys.
   */
  isUnique(key: string, existingKeys: string[], excludeId?: string): boolean {
    return !existingKeys.includes(key);
  }

  /**
   * Infers category defaults from a level number.
   * Returns shortName, name, key, sortOrder.
   */
  inferCategoryFromLevel(level: number): { shortName: string; name: string; key: string; sortOrder: number } {
    const mapped = ORDINAL_MAP[level];
    if (mapped) {
      return { ...mapped, sortOrder: level };
    }
    return {
      shortName: `${level}ª`,
      name: `${level}ª Categoría`,
      key: `level_${level}`,
      sortOrder: level
    };
  }
}
