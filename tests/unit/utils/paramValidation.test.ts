import { describe, test, expect, spyOn } from 'bun:test';
import {
  requireParam,
  validateTrelloId,
  validateDate,
  validateColor,
  validateFilePath,
  validateUrl,
} from '../../../src/utils/paramValidation.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

function suppressOutput(): ReturnType<typeof spyOn> {
  return spyOn(console, 'log').mockImplementation(() => {});
}

describe('paramValidation', () => {
  describe('requireParam', () => {
    test('returns true for non-empty string', () => {
      const spy = suppressOutput();
      expect(requireParam('abc', 'Test')).toBe(true);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test('returns false and prints error for empty string', () => {
      const spy = suppressOutput();
      expect(requireParam('', 'Card ID')).toBe(false);
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output.ok).toBe(false);
      expect(output.code).toBe('MISSING_PARAM');
      spy.mockRestore();
    });
  });

  describe('validateTrelloId', () => {
    test('accepts valid 24-char hex ID', () => {
      const spy = suppressOutput();
      expect(validateTrelloId('507f1f77bcf86cd799439011', 'Card ID')).toBe(
        true
      );
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test('accepts uppercase hex', () => {
      const spy = suppressOutput();
      expect(validateTrelloId('507F1F77BCF86CD799439011', 'Card ID')).toBe(
        true
      );
      spy.mockRestore();
    });

    test('rejects too short', () => {
      const spy = suppressOutput();
      expect(validateTrelloId('abc123', 'Card ID')).toBe(false);
      spy.mockRestore();
    });

    test('rejects non-hex characters', () => {
      const spy = suppressOutput();
      expect(validateTrelloId('507f1f77bcf86cd79943901g', 'Card ID')).toBe(
        false
      );
      spy.mockRestore();
    });

    test('rejects empty string', () => {
      const spy = suppressOutput();
      expect(validateTrelloId('', 'Card ID')).toBe(false);
      spy.mockRestore();
    });
  });

  describe('validateDate', () => {
    test('accepts ISO date', () => {
      const spy = suppressOutput();
      expect(validateDate('2025-01-15', 'Due date')).toBe(true);
      spy.mockRestore();
    });

    test('accepts ISO datetime', () => {
      const spy = suppressOutput();
      expect(validateDate('2025-01-15T10:30:00Z', 'Due date')).toBe(true);
      spy.mockRestore();
    });

    test('rejects invalid date', () => {
      const spy = suppressOutput();
      expect(validateDate('not-a-date', 'Due date')).toBe(false);
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output.code).toBe('INVALID_PARAM');
      spy.mockRestore();
    });
  });

  describe('validateColor', () => {
    test('accepts valid Trello colors', () => {
      const spy = suppressOutput();
      for (const color of [
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
      ]) {
        expect(validateColor(color, 'Color')).toBe(true);
      }
      spy.mockRestore();
    });

    test('is case insensitive', () => {
      const spy = suppressOutput();
      expect(validateColor('Green', 'Color')).toBe(true);
      expect(validateColor('BLUE', 'Color')).toBe(true);
      spy.mockRestore();
    });

    test('rejects invalid colors', () => {
      const spy = suppressOutput();
      expect(validateColor('magenta', 'Color')).toBe(false);
      spy.mockRestore();
    });
  });

  describe('validateFilePath', () => {
    let tmpFile: string;

    test('accepts valid file', () => {
      const spy = suppressOutput();
      tmpFile = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, 'test');
      expect(validateFilePath(tmpFile, 'File')).toBe(true);
      fs.unlinkSync(tmpFile);
      spy.mockRestore();
    });

    test('rejects path traversal', () => {
      const spy = suppressOutput();
      expect(validateFilePath('../../../etc/passwd', 'File')).toBe(false);
      const output = JSON.parse(spy.mock.calls[0][0] as string);
      expect(output.error).toContain('traversal');
      spy.mockRestore();
    });

    test('rejects non-existent file', () => {
      const spy = suppressOutput();
      expect(validateFilePath('/nonexistent/file.txt', 'File')).toBe(false);
      spy.mockRestore();
    });

    test('rejects file exceeding 10 MB', () => {
      const spy = suppressOutput();
      tmpFile = path.join(os.tmpdir(), `big-${Date.now()}.bin`);
      // Create a sparse file that reports >10MB
      const fd = fs.openSync(tmpFile, 'w');
      fs.ftruncateSync(fd, 11 * 1024 * 1024);
      fs.closeSync(fd);
      expect(validateFilePath(tmpFile, 'File')).toBe(false);
      fs.unlinkSync(tmpFile);
      spy.mockRestore();
    });
  });

  describe('validateUrl', () => {
    test('accepts valid HTTP URL', () => {
      const spy = suppressOutput();
      expect(validateUrl('https://example.com/file.pdf', 'URL')).toBe(true);
      spy.mockRestore();
    });

    test('rejects invalid URL', () => {
      const spy = suppressOutput();
      expect(validateUrl('not a url', 'URL')).toBe(false);
      spy.mockRestore();
    });
  });
});
