import { describe, test, expect } from 'bun:test';
import { errorMessage } from '../../../src/utils/errorUtils.js';

describe('errorUtils', () => {
  describe('errorMessage', () => {
    test('extracts message from Error', () => {
      expect(errorMessage(new Error('boom'))).toBe('boom');
    });

    test('converts string to string', () => {
      expect(errorMessage('raw string')).toBe('raw string');
    });

    test('converts number to string', () => {
      expect(errorMessage(42)).toBe('42');
    });

    test('converts null to string', () => {
      expect(errorMessage(null)).toBe('null');
    });

    test('converts undefined to string', () => {
      expect(errorMessage(undefined)).toBe('undefined');
    });
  });
});
