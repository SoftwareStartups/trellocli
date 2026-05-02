import { describe, test, expect } from 'bun:test';
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

describe('paramValidation', () => {
  describe('requireParam', () => {
    test('returns null for non-empty string', () => {
      expect(requireParam('abc', 'Test')).toBeNull();
    });

    test('returns MISSING_PARAM error for empty string', () => {
      const err = requireParam('', 'Card ID');
      expect(err).not.toBeNull();
      expect(err?.code).toBe('MISSING_PARAM');
      expect(err?.message).toContain('Card ID');
    });
  });

  describe('validateTrelloId', () => {
    test('accepts valid 24-char hex IDs', () => {
      expect(
        validateTrelloId('507f1f77bcf86cd799439011', 'Card ID')
      ).toBeNull();
      expect(
        validateTrelloId('507F1F77BCF86CD799439011', 'Card ID')
      ).toBeNull();
    });

    test.each([
      'abc123',
      '507f1f77bcf86cd79943901g',
      '',
    ])('rejects invalid ID: %s', (id) => {
      const err = validateTrelloId(id, 'Card ID');
      expect(err?.code).toBe('INVALID_PARAM');
    });
  });

  describe('validateDate', () => {
    test.each([
      '2025-01-15',
      '2025-01-15T10:30:00Z',
    ])('accepts valid date: %s', (date) => {
      expect(validateDate(date, 'Due date')).toBeNull();
    });

    test('rejects invalid date', () => {
      const err = validateDate('not-a-date', 'Due date');
      expect(err?.code).toBe('INVALID_PARAM');
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
      expect(validateColor(color, 'Color')).toBeNull();
    });

    test('is case insensitive', () => {
      expect(validateColor('Green', 'Color')).toBeNull();
      expect(validateColor('BLUE', 'Color')).toBeNull();
    });

    test('rejects invalid colors', () => {
      expect(validateColor('magenta', 'Color')?.code).toBe('INVALID_PARAM');
    });
  });

  describe('validateFilePath', () => {
    test('accepts valid file', () => {
      const tmpFile = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, 'test');
      try {
        expect(validateFilePath(tmpFile, 'File')).toBeNull();
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });

    test('rejects non-existent file', () => {
      const err = validateFilePath('/nonexistent/file.txt', 'File');
      expect(err?.code).toBe('INVALID_PARAM');
      expect(err?.message).toContain('not found');
    });

    test('rejects a directory', () => {
      const err = validateFilePath(os.tmpdir(), 'File');
      expect(err?.code).toBe('INVALID_PARAM');
      expect(err?.message).toContain('not a regular file');
    });

    if (process.platform !== 'win32') {
      test('rejects a device file', () => {
        const err = validateFilePath('/dev/null', 'File');
        expect(err?.code).toBe('INVALID_PARAM');
        expect(err?.message).toContain('not a regular file');
      });
    }

    test('rejects file exceeding 10 MB', () => {
      const tmpFile = path.join(os.tmpdir(), `big-${Date.now()}.bin`);
      const fd = fs.openSync(tmpFile, 'w');
      fs.ftruncateSync(fd, 11 * 1024 * 1024);
      fs.closeSync(fd);
      try {
        const err = validateFilePath(tmpFile, 'File');
        expect(err?.message).toContain('10 MB');
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });
  });

  describe('validateUrl', () => {
    test('accepts valid HTTP URL', () => {
      expect(validateUrl('https://example.com/file.pdf', 'URL')).toBeNull();
    });

    test('rejects invalid URL', () => {
      expect(validateUrl('not a url', 'URL')?.code).toBe('INVALID_PARAM');
    });
  });
});
