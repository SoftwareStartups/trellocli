import { describe, test, expect } from 'bun:test';
import { success, fail } from '../../../src/models/apiResponse.js';

describe('apiResponse', () => {
  describe('success', () => {
    test.each([
      ['object', { id: '123', name: 'Test' }],
      ['array', [1, 2, 3]],
      ['null', null],
      ['string', 'hello'],
    ])('wraps %s data with ok: true', (_label, data) => {
      expect(success(data)).toEqual({ ok: true, data });
    });
  });

  describe('fail', () => {
    test('creates error response with default code', () => {
      expect(fail('Something went wrong')).toEqual({
        ok: false,
        error: 'Something went wrong',
        code: 'ERROR',
      });
    });

    test('creates error response with custom code', () => {
      expect(fail('Not found', 'NOT_FOUND')).toEqual({
        ok: false,
        error: 'Not found',
        code: 'NOT_FOUND',
      });
    });

    test('has no data field', () => {
      expect(fail('err')).not.toHaveProperty('data');
    });
  });
});
