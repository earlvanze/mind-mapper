import { describe, expect, it } from 'vitest';
import { hasRegex } from './searchNodes';

describe('regex search', () => {
  describe('hasRegex', () => {
    it('returns true for valid /pattern/flags syntax', () => {
      expect(hasRegex('/node|leaf/i')).toBe(true);
      expect(hasRegex('/\\d+/')).toBe(true);
      expect(hasRegex('/^root/')).toBe(true);
      expect(hasRegex('/test/g')).toBe(true);
      expect(hasRegex('/case insensitive/i')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(hasRegex('node')).toBe(false);
      expect(hasRegex('hello world')).toBe(false);
    });

    it('returns false for wildcards', () => {
      expect(hasRegex('node*')).toBe(false);
      expect(hasRegex('*leaf*')).toBe(false);
      expect(hasRegex('te?t')).toBe(false);
    });

    it('returns false for incomplete regex', () => {
      expect(hasRegex('/pattern')).toBe(false);
      expect(hasRegex('pattern/')).toBe(false);
      expect(hasRegex('/')).toBe(false);
    });
  });
});
