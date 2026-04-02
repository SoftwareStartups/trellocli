import { describe, test, expect, beforeEach, spyOn } from 'bun:test';
import {
  setVerbose,
  isVerbose,
  debug,
  warn,
  redactUrl,
} from '../../../src/utils/logger.js';

describe('logger', () => {
  beforeEach(() => {
    setVerbose(false);
  });

  describe('setVerbose / isVerbose', () => {
    test('defaults to false', () => {
      expect(isVerbose()).toBe(false);
    });

    test('can be enabled', () => {
      setVerbose(true);
      expect(isVerbose()).toBe(true);
    });
  });

  describe('debug', () => {
    test('writes to stderr when verbose', () => {
      setVerbose(true);
      const spy = spyOn(process.stderr, 'write').mockImplementation(() => true);
      debug('test message');
      expect(spy).toHaveBeenCalledWith('[DEBUG] test message\n');
      spy.mockRestore();
    });

    test('does nothing when not verbose', () => {
      const spy = spyOn(process.stderr, 'write').mockImplementation(() => true);
      debug('test message');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('warn', () => {
    test('writes to stderr when verbose', () => {
      setVerbose(true);
      const spy = spyOn(process.stderr, 'write').mockImplementation(() => true);
      warn('warning');
      expect(spy).toHaveBeenCalledWith('[WARN] warning\n');
      spy.mockRestore();
    });
  });

  describe('redactUrl', () => {
    test('removes key and token params from full URL', () => {
      const url =
        'https://api.trello.com/1/boards/abc?key=secret&token=secret2&filter=open';
      const result = redactUrl(url);
      expect(result).not.toContain('secret');
      expect(result).not.toContain('secret2');
      expect(result).toContain('filter=open');
      expect(result).toContain('/boards/abc');
    });

    test('handles URL with only auth params', () => {
      const url = 'https://api.trello.com/1/boards?key=k&token=t';
      const result = redactUrl(url);
      expect(result).not.toContain('key=');
      expect(result).not.toContain('token=');
    });

    test('handles malformed URL gracefully', () => {
      const result = redactUrl('/boards?key=k&token=t&filter=open');
      expect(result).not.toContain('key=k');
      expect(result).not.toContain('token=t');
      expect(result).toContain('filter=open');
    });
  });
});
