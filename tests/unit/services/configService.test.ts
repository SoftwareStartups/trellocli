import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ConfigService } from '../../../src/services/configService.js';

describe('ConfigService', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trellocli-test-'));
    delete process.env.TRELLO_API_KEY;
    delete process.env.TRELLO_TOKEN;
  });

  afterEach(() => {
    process.env.TRELLO_API_KEY = originalEnv.TRELLO_API_KEY;
    process.env.TRELLO_TOKEN = originalEnv.TRELLO_TOKEN;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    test('loads from env vars when set', () => {
      process.env.TRELLO_API_KEY = 'env-key';
      process.env.TRELLO_TOKEN = 'env-token';
      const config = new ConfigService(tmpDir);
      expect(config.apiKey).toBe('env-key');
      expect(config.token).toBe('env-token');
    });

    test('loads from unencrypted config file (backwards compat)', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'config.json'),
        JSON.stringify({ apiKey: 'file-key', token: 'file-token' })
      );
      const config = new ConfigService(tmpDir);
      expect(config.apiKey).toBe('file-key');
      expect(config.token).toBe('file-token');
    });

    test('loads from encrypted config file', () => {
      const writer = new ConfigService(tmpDir);
      writer.saveAuth('enc-key', 'enc-token');

      const reader = new ConfigService(tmpDir);
      expect(reader.apiKey).toBe('enc-key');
      expect(reader.token).toBe('enc-token');
    });

    test('env vars take priority over config file', () => {
      process.env.TRELLO_API_KEY = 'env-key';
      fs.writeFileSync(
        path.join(tmpDir, 'config.json'),
        JSON.stringify({ apiKey: 'file-key', token: 'file-token' })
      );
      const config = new ConfigService(tmpDir);
      expect(config.apiKey).toBe('env-key');
      expect(config.token).toBe('file-token');
    });

    test('handles missing config file gracefully', () => {
      const config = new ConfigService(tmpDir);
      expect(config.apiKey).toBeUndefined();
      expect(config.token).toBeUndefined();
    });

    test('handles invalid JSON in config file', () => {
      fs.writeFileSync(path.join(tmpDir, 'config.json'), 'not json');
      const config = new ConfigService(tmpDir);
      expect(config.apiKey).toBeUndefined();
    });
  });

  describe('isConfigured', () => {
    test('returns true when both key and token set', () => {
      process.env.TRELLO_API_KEY = 'k';
      process.env.TRELLO_TOKEN = 't';
      const config = new ConfigService(tmpDir);
      expect(config.isConfigured).toBe(true);
    });

    test('returns false when key missing', () => {
      process.env.TRELLO_TOKEN = 't';
      const config = new ConfigService(tmpDir);
      expect(config.isConfigured).toBe(false);
    });
  });

  describe('saveAuth', () => {
    test('saves encrypted credentials to file', () => {
      const config = new ConfigService(tmpDir);
      const result = config.saveAuth('my-key', 'my-token');
      expect(result.success).toBe(true);

      const saved = JSON.parse(
        fs.readFileSync(path.join(tmpDir, 'config.json'), 'utf-8')
      );
      expect(saved.encrypted).toBe(true);
      expect(saved.data).toBeDefined();
      expect(saved.iv).toBeDefined();
      expect(saved.salt).toBeDefined();
      // Verify plaintext credentials are NOT in the file
      const raw = fs.readFileSync(path.join(tmpDir, 'config.json'), 'utf-8');
      expect(raw).not.toContain('my-key');
      expect(raw).not.toContain('my-token');
    });

    test('saved credentials can be read back', () => {
      const config1 = new ConfigService(tmpDir);
      config1.saveAuth('round-key', 'round-token');

      const config2 = new ConfigService(tmpDir);
      expect(config2.apiKey).toBe('round-key');
      expect(config2.token).toBe('round-token');
    });

    test('creates config directory if missing', () => {
      const nestedDir = path.join(tmpDir, 'nested');
      const config = new ConfigService(nestedDir);
      config.saveAuth('k', 't');
      expect(fs.existsSync(nestedDir)).toBe(true);
    });

    test('rejects empty API key', () => {
      const config = new ConfigService(tmpDir);
      const result = config.saveAuth('', 'token');
      expect(result.success).toBe(false);
      expect(result.error).toContain('API Key');
    });

    test('rejects empty token', () => {
      const config = new ConfigService(tmpDir);
      const result = config.saveAuth('key', '');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Token');
    });

    test('rejects whitespace-only values', () => {
      const config = new ConfigService(tmpDir);
      expect(config.saveAuth('   ', 'token').success).toBe(false);
      expect(config.saveAuth('key', '   ').success).toBe(false);
    });
  });

  describe('clearAuth', () => {
    test('deletes config file', () => {
      const config = new ConfigService(tmpDir);
      config.saveAuth('k', 't');
      expect(fs.existsSync(path.join(tmpDir, 'config.json'))).toBe(true);

      const result = config.clearAuth();
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'config.json'))).toBe(false);
    });

    test('succeeds when no config file exists', () => {
      const config = new ConfigService(tmpDir);
      const result = config.clearAuth();
      expect(result.success).toBe(true);
    });
  });

  describe('getAuthQuery', () => {
    test('returns query string with key and token', () => {
      process.env.TRELLO_API_KEY = 'abc';
      process.env.TRELLO_TOKEN = 'xyz';
      const config = new ConfigService(tmpDir);
      expect(config.getAuthQuery()).toBe('key=abc&token=xyz');
    });
  });

  describe('validate', () => {
    test('returns valid when both set', () => {
      process.env.TRELLO_API_KEY = 'k';
      process.env.TRELLO_TOKEN = 't';
      const config = new ConfigService(tmpDir);
      expect(config.validate()).toEqual({ valid: true });
    });

    test('returns error when API key missing', () => {
      process.env.TRELLO_TOKEN = 't';
      const config = new ConfigService(tmpDir);
      const result = config.validate();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('API Key');
    });

    test('returns error when token missing', () => {
      process.env.TRELLO_API_KEY = 'k';
      const config = new ConfigService(tmpDir);
      const result = config.validate();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token');
    });
  });
});
