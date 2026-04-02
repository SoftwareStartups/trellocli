import { describe, test, expect, afterEach } from 'bun:test';
import { print } from '../../../src/utils/outputFormatter.js';
import { success, fail } from '../../../src/models/apiResponse.js';
import { suppressOutput } from '../../helpers/testUtils.js';

let spy: ReturnType<typeof suppressOutput>;

afterEach(() => {
  spy?.mockRestore();
});

describe('outputFormatter', () => {
  describe('print', () => {
    test('outputs success response as compact JSON', () => {
      spy = suppressOutput();
      print(success({ id: '1', name: 'Test' }));
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output).toEqual({ ok: true, data: { id: '1', name: 'Test' } });
    });

    test('outputs error response as compact JSON', () => {
      spy = suppressOutput();
      print(fail('bad', 'HTTP_ERROR'));
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output).toEqual({ ok: false, error: 'bad', code: 'HTTP_ERROR' });
    });

    test('strips top-level null and undefined values', () => {
      spy = suppressOutput();
      print({ ok: true, data: { id: '1' }, error: undefined, code: undefined });
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output).not.toHaveProperty('error');
      expect(output).not.toHaveProperty('code');
    });

    test('outputs single line (no pretty printing)', () => {
      spy = suppressOutput();
      print(success({ a: 1 }));
      const raw = spy.mock.calls[0][0] as string;
      expect(raw).not.toContain('\n');
    });
  });
});
