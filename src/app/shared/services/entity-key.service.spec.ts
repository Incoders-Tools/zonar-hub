import { EntityKeyService } from './entity-key.service';

describe('EntityKeyService', () => {
  let service: EntityKeyService;

  beforeEach(() => {
    service = new EntityKeyService();
  });

  describe('generateKey', () => {
    it('should generate a snake_case key from a simple name', () => {
      expect(service.generateKey('Cuarta')).toBe('cuarta');
    });

    it('should handle multi-word names', () => {
      expect(service.generateKey('En Curso')).toBe('en_curso');
    });

    it('should strip accents', () => {
      expect(service.generateKey('Promoción Especial')).toBe('promocion_especial');
    });

    it('should handle ñ', () => {
      expect(service.generateKey('Año Nuevo')).toBe('ano_nuevo');
    });

    it('should strip special characters', () => {
      expect(service.generateKey('Test (Beta)')).toBe('test_beta');
    });

    it('should return empty string for empty input', () => {
      expect(service.generateKey('')).toBe('');
    });

    it('should return empty string for whitespace-only input', () => {
      expect(service.generateKey('   ')).toBe('');
    });

    it('should collapse multiple spaces', () => {
      expect(service.generateKey('A   B   C')).toBe('a_b_c');
    });
  });

  describe('normalizeName', () => {
    it('should capitalize first letter and lowercase rest', () => {
      expect(service.normalizeName('CUARTA')).toBe('Cuarta');
    });

    it('should handle already normalized names', () => {
      expect(service.normalizeName('Quinta')).toBe('Quinta');
    });

    it('should trim whitespace', () => {
      expect(service.normalizeName('  test  ')).toBe('Test');
    });

    it('should return empty string for empty input', () => {
      expect(service.normalizeName('')).toBe('');
    });
  });

  describe('isUnique', () => {
    it('should return true when key is not in the list', () => {
      expect(service.isUnique('new_key', ['existing_a', 'existing_b'])).toBe(true);
    });

    it('should return false when key exists in the list', () => {
      expect(service.isUnique('existing_a', ['existing_a', 'existing_b'])).toBe(false);
    });
  });
});
