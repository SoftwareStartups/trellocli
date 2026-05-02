import { describe, test, expect } from 'bun:test';
import { fail } from '../../../src/models/apiResponse.js';

describe('apiResponse', () => {
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
