import { describe, test, expect } from 'bun:test';
import { formatText } from '../../../src/utils/textFormatter.js';
import { success, fail } from '../../../src/models/apiResponse.js';

describe('textFormatter', () => {
  describe('formatText', () => {
    test('formats error response', () => {
      const result = formatText(fail('Card not found', 'NOT_FOUND'));
      expect(result).toBe('Error: Card not found (NOT_FOUND)');
    });

    test('formats error without code', () => {
      const result = formatText(fail('Something wrong'));
      expect(result).toContain('Error: Something wrong');
    });

    test('formats single object', () => {
      const result = formatText(
        success({ id: 'abc', name: 'My Card', url: 'https://trello.com/c/x' })
      );
      expect(result).toContain('id');
      expect(result).toContain('abc');
      expect(result).toContain('name');
      expect(result).toContain('My Card');
    });

    test('formats array of objects as table', () => {
      const result = formatText(
        success([
          { id: 'b1', name: 'Board 1', url: 'https://trello.com/b/1' },
          { id: 'b2', name: 'Board 2', url: 'https://trello.com/b/2' },
        ])
      );
      expect(result).toContain('id');
      expect(result).toContain('name');
      expect(result).toContain('Board 1');
      expect(result).toContain('Board 2');
    });

    test('formats empty array', () => {
      const result = formatText(success([]));
      expect(result).toBe('(no results)');
    });

    test('formats delete response', () => {
      const result = formatText(success({ deleted: true }));
      expect(result).toBe('Deleted successfully.');
    });

    test('formats removed response', () => {
      const result = formatText(success({ removed: true }));
      expect(result).toBe('Removed successfully.');
    });

    test('formats message response', () => {
      const result = formatText(
        success({ message: 'Auth saved to ~/.config/trellocli/config.json' })
      );
      expect(result).toBe('Auth saved to ~/.config/trellocli/config.json');
    });

    test('formats string data', () => {
      const result = formatText(success('hello'));
      expect(result).toBe('hello');
    });

    test('formats null data', () => {
      const result = formatText(success(null));
      expect(result).toBe('(no data)');
    });

    test('strips null values from single object', () => {
      const result = formatText(success({ id: 'abc', desc: null }));
      expect(result).toContain('id');
      expect(result).not.toContain('desc');
    });
  });
});
