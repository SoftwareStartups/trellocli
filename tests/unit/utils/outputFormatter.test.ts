import { describe, test, expect, spyOn } from 'bun:test';
import { print } from '../../../src/utils/outputFormatter.js';
import { success, fail } from '../../../src/models/apiResponse.js';

describe('outputFormatter', () => {
  describe('print', () => {
    test('outputs success response as compact JSON', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      print(success({ id: '1', name: 'Test' }));
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output).toEqual({ ok: true, data: { id: '1', name: 'Test' } });
      spy.mockRestore();
    });

    test('outputs error response as compact JSON', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      print(fail('bad', 'HTTP_ERROR'));
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output).toEqual({ ok: false, error: 'bad', code: 'HTTP_ERROR' });
      spy.mockRestore();
    });

    test('strips top-level null and undefined values', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      // stripNulls operates on top-level ApiResponse fields, not nested data
      print({ ok: true, data: { id: '1' }, error: undefined, code: undefined });
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output).not.toHaveProperty('error');
      expect(output).not.toHaveProperty('code');
      spy.mockRestore();
    });

    test('outputs single line (no pretty printing)', () => {
      const spy = spyOn(console, 'log').mockImplementation(() => {});
      print(success({ a: 1 }));
      const raw = spy.mock.calls[0][0] as string;
      expect(raw).not.toContain('\n');
      spy.mockRestore();
    });
  });
});
