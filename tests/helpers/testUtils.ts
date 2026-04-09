import { spyOn } from 'bun:test';

export const TEST_ID = '507f1f77bcf86cd799439011';
export const TEST_ID_2 = '607f1f77bcf86cd799439022';
export const TEST_API_KEY = 'test-key';
export const TEST_TOKEN = 'test-token';

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
