import { describe, test, expect } from 'bun:test';
import { isTTY } from '../../../src/utils/prompt.js';

describe('prompt', () => {
  describe('isTTY', () => {
    test('returns a boolean', () => {
      const result = isTTY();
      expect(typeof result).toBe('boolean');
    });
  });

  // Note: promptHidden cannot be unit tested easily because it reads from
  // process.stdin interactively. It is covered by manual verification and
  // the login command integration tests which mock the prompt dependency.
});
