import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock,
} from 'bun:test';
import * as realKeychain from '../../../../src/auth/keychain.js';

const setSecretMock = mock(async () => {});
const promptHiddenMock = mock(async () => '');

await mock.module('../../../../src/auth/keychain.js', () => ({
  ...realKeychain,
  setSecret: setSecretMock,
}));

await mock.module('../../../../src/utils/prompt.js', () => ({
  promptHidden: promptHiddenMock,
}));

const { login } = await import('../../../../src/cli/commands/login.js');

const VALID_KEY = 'a'.repeat(32);
const VALID_TOKEN = 'b'.repeat(64);
const CONTROL_CHAR = String.fromCharCode(0);

let exitSpy: ReturnType<typeof spyOn>;
let logSpy: ReturnType<typeof spyOn>;
let errSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  setSecretMock.mockClear();
  promptHiddenMock.mockClear();
  exitSpy = spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`__EXIT_${code ?? 0}__`);
  }) as never) as unknown as ReturnType<typeof spyOn>;
  logSpy = spyOn(console, 'log').mockImplementation(() => {});
  errSpy = spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  exitSpy.mockRestore();
  logSpy.mockRestore();
  errSpy.mockRestore();
});

describe('login', () => {
  test('rejects credential containing control characters', async () => {
    await expect(
      login({
        apiKey: `bad${CONTROL_CHAR}key`,
        token: VALID_TOKEN,
        skipValidation: true,
      })
    ).rejects.toThrow('__EXIT_1__');
    expect(setSecretMock).not.toHaveBeenCalled();
    const errOutput = errSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(errOutput).toContain('control characters');
  });

  test('stores valid credentials with skipValidation', async () => {
    await login({
      apiKey: VALID_KEY,
      token: VALID_TOKEN,
      skipValidation: true,
    });
    expect(setSecretMock).toHaveBeenCalledTimes(2);
    expect(setSecretMock.mock.calls[0]).toEqual(['TRELLO_API_KEY', VALID_KEY]);
    expect(setSecretMock.mock.calls[1]).toEqual(['TRELLO_TOKEN', VALID_TOKEN]);
    expect(logSpy).toHaveBeenCalledWith('Credentials saved to OS keychain.');
  });

  test('warns on non-hex format but still stores', async () => {
    await login({
      apiKey: 'short-but-valid',
      token: 'also-short',
      skipValidation: true,
    });
    expect(setSecretMock).toHaveBeenCalledTimes(2);
    const warnings = errSpy.mock.calls.map((c) => c[0] as string).join('\n');
    expect(warnings).toContain('API key does not match');
    expect(warnings).toContain('Token does not match');
  });
});
