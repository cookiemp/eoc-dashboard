import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toBe('bg-red-500 text-white');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'not-included');
      expect(result).toBe('base-class conditional-class');
    });

    it('should merge Tailwind conflicting classes correctly', () => {
      const result = cn('px-2', 'px-4');
      expect(result).toBe('px-4');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'other-class');
      expect(result).toBe('base-class other-class');
    });

    it('should handle empty string', () => {
      const result = cn('', 'some-class');
      expect(result).toBe('some-class');
    });

    it('should handle array of classes', () => {
      const result = cn(['class-1', 'class-2'], 'class-3');
      expect(result).toBe('class-1 class-2 class-3');
    });

    it('should handle object with boolean values', () => {
      const result = cn({
        'class-1': true,
        'class-2': false,
        'class-3': true,
      });
      expect(result).toBe('class-1 class-3');
    });

    it('should merge complex Tailwind classes', () => {
      const result = cn('bg-red-500 hover:bg-red-600', 'bg-blue-500');
      expect(result).toBe('hover:bg-red-600 bg-blue-500');
    });
  });
});
