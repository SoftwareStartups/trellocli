import { describe, test, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { login, logout } from '../../../src/commands/auth.js';

describe('auth commands', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };
  let logSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;
  let exitSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trellocli-auth-test-'));
    delete process.env.TRELLO_API_KEY;
    delete process.env.TRELLO_TOKEN;
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    process.env.TRELLO_API_KEY = originalEnv.TRELLO_API_KEY;
    process.env.TRELLO_TOKEN = originalEnv.TRELLO_TOKEN;
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('login', () => {
    test('saves credentials when provided via flags with skip-validation', async () => {
      await login({
        apiKey: 'test-key',
        token: 'test-token',
        skipValidation: true,
        configDir: tmpDir,
      });

      expect(
        logSpy.mock.calls.some((c) => String(c[0]).includes('saved'))
      ).toBe(true);

      // Verify file was created
      expect(fs.existsSync(path.join(tmpDir, 'config.json'))).toBe(true);
    });

    test('exits with error for empty API key', async () => {
      await expect(
        login({
          apiKey: '  ',
          token: 'test-token',
          skipValidation: true,
          configDir: tmpDir,
        })
      ).rejects.toThrow('process.exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(
        errorSpy.mock.calls.some((c) => String(c[0]).includes('API key'))
      ).toBe(true);
    });

    test('exits with error for empty token', async () => {
      await expect(
        login({
          apiKey: 'test-key',
          token: '   ',
          skipValidation: true,
          configDir: tmpDir,
        })
      ).rejects.toThrow('process.exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(
        errorSpy.mock.calls.some((c) => String(c[0]).includes('Token'))
      ).toBe(true);
    });
  });

  describe('logout', () => {
    test('prints already logged out when no config file', async () => {
      await logout(tmpDir);

      expect(
        logSpy.mock.calls.some((c) =>
          String(c[0]).includes('Already logged out')
        )
      ).toBe(true);
    });

    test('clears auth and prints confirmation', async () => {
      // Create a config file first
      const { ConfigService } = await import(
        '../../../src/services/configService.js'
      );
      const config = new ConfigService(tmpDir);
      config.saveAuth('key', 'token');

      await logout(tmpDir);

      expect(
        logSpy.mock.calls.some((c) =>
          String(c[0]).includes('Credentials removed')
        )
      ).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'config.json'))).toBe(false);
    });

    test('warns about env vars after logout', async () => {
      // Create a config file first
      const { ConfigService } = await import(
        '../../../src/services/configService.js'
      );
      const config = new ConfigService(tmpDir);
      config.saveAuth('key', 'token');

      process.env.TRELLO_API_KEY = 'still-set';
      process.env.TRELLO_TOKEN = 'still-set';

      await logout(tmpDir);

      expect(
        logSpy.mock.calls.some(
          (c) =>
            String(c[0]).includes('TRELLO_API_KEY') &&
            String(c[0]).includes('TRELLO_TOKEN')
        )
      ).toBe(true);
    });
  });
});
