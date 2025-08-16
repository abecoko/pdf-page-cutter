import { describe, it, expect } from 'vitest';
import { PageParser } from './pageParser.js';

describe('PageParser', () => {
  describe('Basic parsing', () => {
    it('should parse single page numbers', () => {
      const parser = new PageParser(10);
      expect(parser.parse('1')).toEqual([1]);
      expect(parser.parse('5')).toEqual([5]);
      expect(parser.parse('10')).toEqual([10]);
    });

    it('should parse multiple pages', () => {
      const parser = new PageParser(10);
      expect(parser.parse('1,3,5')).toEqual([1, 3, 5]);
    });

    it('should parse ranges', () => {
      const parser = new PageParser(10);
      expect(parser.parse('1-3')).toEqual([1, 2, 3]);
      expect(parser.parse('5-7')).toEqual([5, 6, 7]);
    });

    it('should parse mixed specifications', () => {
      const parser = new PageParser(10);
      expect(parser.parse('1,3-5,8')).toEqual([1, 3, 4, 5, 8]);
    });
  });

  describe('Special keywords', () => {
    it('should parse "all"', () => {
      const parser = new PageParser(5);
      expect(parser.parse('all')).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse "odd"', () => {
      const parser = new PageParser(10);
      expect(parser.parse('odd')).toEqual([1, 3, 5, 7, 9]);
    });

    it('should parse "even"', () => {
      const parser = new PageParser(10);
      expect(parser.parse('even')).toEqual([2, 4, 6, 8, 10]);
    });

    it('should parse "first" and "last"', () => {
      const parser = new PageParser(10);
      expect(parser.parse('first')).toEqual([1]);
      expect(parser.parse('last')).toEqual([10]);
    });
  });

  describe('Exclusion', () => {
    it('should exclude pages with !', () => {
      const parser = new PageParser(10);
      expect(parser.parse('1-5,!3')).toEqual([1, 2, 4, 5]);
    });

    it('should exclude ranges', () => {
      const parser = new PageParser(10);
      expect(parser.parse('all,!3-5')).toEqual([1, 2, 6, 7, 8, 9, 10]);
    });

    it('should exclude with keywords', () => {
      const parser = new PageParser(10);
      expect(parser.parse('all,!odd')).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe('Order preservation', () => {
    it('should maintain specified order', () => {
      const parser = new PageParser(10);
      expect(parser.parse('9,1-3')).toEqual([9, 1, 2, 3]);
      expect(parser.parse('5,1,3')).toEqual([5, 1, 3]);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle out-of-range pages gracefully', () => {
      const parser = new PageParser(5);
      expect(parser.parse('1-10')).toEqual([1, 2, 3, 4, 5]);
      expect(parser.parse('7')).toEqual([]);
    });

    it('should throw on invalid range', () => {
      const parser = new PageParser(10);
      expect(() => parser.parse('5-2')).toThrow('Invalid range: start (5) is greater than end (2)');
    });

    it('should throw on invalid input', () => {
      const parser = new PageParser(10);
      expect(() => parser.parse('')).toThrow('Empty page specification');
      expect(() => parser.parse('abc')).toThrow('Invalid page number: abc');
      expect(() => parser.parse('1-abc')).toThrow('Invalid range: 1-abc');
    });

    it('should throw when no pages selected', () => {
      const parser = new PageParser(10);
      expect(() => parser.parse('all,!all')).toThrow('No pages selected');
    });
  });

  describe('Presets', () => {
    it('should generate correct presets', () => {
      const presets = PageParser.getPresets(20);
      expect(presets.all).toBe('all');
      expect(presets.odd).toBe('odd');
      expect(presets.even).toBe('even');
      expect(presets.first10).toBe('1-10');
      expect(presets.excludeFirst).toBe('2-20');
      expect(presets.excludeLast).toBe('1-19');
      expect(presets.middle).toBe('2-19');
    });

    it('should handle small page counts', () => {
      const presets = PageParser.getPresets(3);
      expect(presets.first10).toBe('1-3');
      expect(presets.excludeFirst).toBe('2-3');
      expect(presets.excludeLast).toBe('1-2');
      expect(presets.middle).toBe('2-2');
    });
  });
});