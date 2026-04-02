import { describe, test, expect } from 'bun:test';
import { success, fail } from '../../../src/models/apiResponse.js';

describe('apiResponse', () => {
  describe('success', () => {
    test('wraps data with ok: true', () => {
      const result = success({ id: '123', name: 'Test' });
      expect(result).toEqual({
        ok: true,
        data: { id: '123', name: 'Test' },
      });
    });

    test('wraps array data', () => {
      const result = success([1, 2, 3]);
      expect(result).toEqual({ ok: true, data: [1, 2, 3] });
    });

    test('wraps null data', () => {
      const result = success(null);
      expect(result).toEqual({ ok: true, data: null });
    });

    test('wraps string data', () => {
      const result = success('hello');
      expect(result).toEqual({ ok: true, data: 'hello' });
    });
  });

  describe('fail', () => {
    test('creates error response with default code', () => {
      const result = fail('Something went wrong');
      expect(result).toEqual({
        ok: false,
        error: 'Something went wrong',
        code: 'ERROR',
      });
    });

    test('creates error response with custom code', () => {
      const result = fail('Not found', 'NOT_FOUND');
      expect(result).toEqual({
        ok: false,
        error: 'Not found',
        code: 'NOT_FOUND',
      });
    });

    test('has no data field', () => {
      const result = fail('err');
      expect(result).not.toHaveProperty('data');
    });
  });
});
