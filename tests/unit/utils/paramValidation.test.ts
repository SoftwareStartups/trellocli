import { describe, test, expect, afterEach } from 'bun:test';
import {
  requireParam,
  validateTrelloId,
  validateDate,
  validateColor,
  validateFilePath,
  validateUrl,
} from '../../../src/utils/paramValidation.js';
import { suppressOutput } from '../../helpers/testUtils.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let spy: ReturnType<typeof suppressOutput>;

afterEach(() => {
  spy?.mockRestore();
});

describe('paramValidation', () => {
  describe('requireParam', () => {
    test('returns true for non-empty string', () => {
      spy = suppressOutput();
      expect(requireParam('abc', 'Test')).toBe(true);
    });

    test('returns false and prints error for empty string', () => {
      spy = suppressOutput();
      expect(requireParam('', 'Card ID')).toBe(false);
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output.ok).toBe(false);
      expect(output.code).toBe('MISSING_PARAM');
    });
  });

  describe('validateTrelloId', () => {
    test('accepts valid 24-char hex IDs', () => {
      spy = suppressOutput();
      expect(validateTrelloId('507f1f77bcf86cd799439011', 'Card ID')).toBe(
        true
      );
      expect(validateTrelloId('507F1F77BCF86CD799439011', 'Card ID')).toBe(
        true
      );
    });

    test.each([
      'abc123',
      '507f1f77bcf86cd79943901g',
      '',
    ])('rejects invalid ID: %s', (id) => {
      spy = suppressOutput();
      expect(validateTrelloId(id, 'Card ID')).toBe(false);
    });
  });

  describe('validateDate', () => {
    test.each([
      '2025-01-15',
      '2025-01-15T10:30:00Z',
    ])('accepts valid date: %s', (date) => {
      spy = suppressOutput();
      expect(validateDate(date, 'Due date')).toBe(true);
    });

    test('rejects invalid date', () => {
      spy = suppressOutput();
      expect(validateDate('not-a-date', 'Due date')).toBe(false);
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output.code).toBe('INVALID_PARAM');
    });
  });

  describe('validateColor', () => {
    test.each([
      'green',
      'yellow',
      'orange',
      'red',
      'purple',
      'blue',
      'sky',
      'lime',
      'pink',
      'black',
    ])('accepts valid color: %s', (color) => {
      spy = suppressOutput();
      expect(validateColor(color, 'Color')).toBe(true);
    });

    test('is case insensitive', () => {
      spy = suppressOutput();
      expect(validateColor('Green', 'Color')).toBe(true);
      expect(validateColor('BLUE', 'Color')).toBe(true);
    });

    test('rejects invalid colors', () => {
      spy = suppressOutput();
      expect(validateColor('magenta', 'Color')).toBe(false);
    });
  });

  describe('validateFilePath', () => {
    test('accepts valid file', () => {
      spy = suppressOutput();
      const tmpFile = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, 'test');
      expect(validateFilePath(tmpFile, 'File')).toBe(true);
      fs.unlinkSync(tmpFile);
    });

    test('rejects path traversal', () => {
      spy = suppressOutput();
      expect(validateFilePath('../../../etc/passwd', 'File')).toBe(false);
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output.error).toContain('traversal');
    });

    test('rejects non-existent file', () => {
      spy = suppressOutput();
      expect(validateFilePath('/nonexistent/file.txt', 'File')).toBe(false);
    });

    test('rejects file exceeding 10 MB', () => {
      spy = suppressOutput();
      const tmpFile = path.join(os.tmpdir(), `big-${Date.now()}.bin`);
      const fd = fs.openSync(tmpFile, 'w');
      fs.ftruncateSync(fd, 11 * 1024 * 1024);
      fs.closeSync(fd);
      expect(validateFilePath(tmpFile, 'File')).toBe(false);
      fs.unlinkSync(tmpFile);
    });
  });

  describe('validateUrl', () => {
    test('accepts valid HTTP URL', () => {
      spy = suppressOutput();
      expect(validateUrl('https://example.com/file.pdf', 'URL')).toBe(true);
    });

    test('rejects invalid URL', () => {
      spy = suppressOutput();
      expect(validateUrl('not a url', 'URL')).toBe(false);
    });
  });
});
