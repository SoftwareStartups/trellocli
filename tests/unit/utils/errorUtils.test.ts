import { describe, test, expect } from 'bun:test';
import { errorMessage } from '../../../src/utils/errorUtils.js';

describe('errorUtils', () => {
  describe('errorMessage', () => {
    test('extracts message from Error', () => {
      expect(errorMessage(new Error('boom'))).toBe('boom');
    });

    test.each([
      ['string', 'raw string', 'raw string'],
      ['number', 42, '42'],
      ['null', null, 'null'],
      ['undefined', undefined, 'undefined'],
    ])('converts %s to string', (_label, input, expected) => {
      expect(errorMessage(input)).toBe(expected);
    });
  });
});
