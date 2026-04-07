import { spyOn } from 'bun:test';
import type { ConfigService } from '../../src/services/configService.js';

export const TEST_ID = '507f1f77bcf86cd799439011';
export const TEST_ID_2 = '607f1f77bcf86cd799439022';

export function makeConfig(
  overrides: Partial<ConfigService> = {}
): ConfigService {
  return {
    apiKey: 'test-key',
    token: 'test-token',
    isConfigured: true,
    hasConfigFile: true,
    getAuthQuery: () => 'key=test-key&token=test-token',
    validate: () => ({ valid: true }),
    saveAuth: () => ({ success: true }),
    clearAuth: () => ({ success: true }),
    ...overrides,
  } as unknown as ConfigService;
}

/**
 * Spy on console.log and return a getter for the parsed JSON output.
 * Call `restoreSpy()` in afterEach or use the returned spy.
 */
export function captureOutput(): {
  spy: ReturnType<typeof spyOn>;
  getOutput: () => unknown;
} {
  const spy = spyOn(console, 'log').mockImplementation(() => {});
  return {
    spy,
    getOutput: () => JSON.parse(spy.mock.calls[0]?.[0] as string),
  };
}

/**
 * Suppress console.log output. Returns the spy for assertions or restoration.
 */
export function suppressOutput(): ReturnType<typeof spyOn> {
  return spyOn(console, 'log').mockImplementation(() => {});
}
