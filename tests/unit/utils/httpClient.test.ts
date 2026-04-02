import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { fetchWithResilience } from '../../../src/utils/httpClient.js';
import { setVerbose } from '../../../src/utils/logger.js';

const FAST = { retryBaseMs: 1, maxRetries: 3 };

describe('httpClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setVerbose(false);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('passes through successful response', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('{"ok":true}', { status: 200 }))
    ) as typeof fetch;
    const res = await fetchWithResilience(
      'https://api.trello.com/1/boards',
      undefined,
      FAST
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test('returns 4xx responses without retry', async () => {
    const fn = mock(() =>
      Promise.resolve(new Response('not found', { status: 404 }))
    );
    globalThis.fetch = fn as typeof fetch;
    const res = await fetchWithResilience(
      'https://api.trello.com/1/boards/x',
      undefined,
      FAST
    );
    expect(res.status).toBe(404);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries on 500 and eventually returns', async () => {
    let calls = 0;
    globalThis.fetch = mock(() => {
      calls++;
      if (calls <= 2) {
        return Promise.resolve(new Response('error', { status: 500 }));
      }
      return Promise.resolve(new Response('ok', { status: 200 }));
    }) as typeof fetch;

    const res = await fetchWithResilience(
      'https://api.trello.com/1/boards',
      undefined,
      FAST
    );
    expect(res.status).toBe(200);
    expect(calls).toBe(3);
  });

  test('retries on network error and eventually succeeds', async () => {
    let calls = 0;
    globalThis.fetch = mock(() => {
      calls++;
      if (calls === 1) {
        return Promise.reject(new Error('ECONNRESET'));
      }
      return Promise.resolve(new Response('ok', { status: 200 }));
    }) as typeof fetch;

    const res = await fetchWithResilience(
      'https://api.trello.com/1/boards',
      undefined,
      FAST
    );
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  test('throws after max retries on persistent network error', async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error('ECONNREFUSED'))
    ) as typeof fetch;

    await expect(
      fetchWithResilience('https://api.trello.com/1/boards', undefined, FAST)
    ).rejects.toThrow('ECONNREFUSED');
  });

  test('returns last 5xx response after max retries', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('error', { status: 503 }))
    ) as typeof fetch;

    const res = await fetchWithResilience(
      'https://api.trello.com/1/boards',
      undefined,
      FAST
    );
    expect(res.status).toBe(503);
  });

  test('passes method and body through', async () => {
    const fn = mock((_url: string, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      return Promise.resolve(new Response('{}', { status: 200 }));
    });
    globalThis.fetch = fn as typeof fetch;

    await fetchWithResilience(
      'https://api.trello.com/1/cards',
      { method: 'POST', body: new URLSearchParams({ name: 'test' }) },
      FAST
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('logs debug info when verbose with credentials stripped', async () => {
    setVerbose(true);
    const { spyOn } = await import('bun:test');
    const stderrSpy = spyOn(process.stderr, 'write').mockImplementation(
      () => true
    );

    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('{}', { status: 200 }))
    ) as typeof fetch;

    await fetchWithResilience(
      'https://api.trello.com/1/boards?key=secret&token=secret2',
      undefined,
      FAST
    );

    const output = stderrSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('[DEBUG]');
    expect(output).toContain('GET');
    expect(output).toContain('/boards');
    expect(output).not.toContain('secret');
    expect(output).not.toContain('secret2');

    stderrSpy.mockRestore();
    setVerbose(false);
  });

  test('retries on 429 with rate limit header', async () => {
    let calls = 0;
    globalThis.fetch = mock(() => {
      calls++;
      if (calls === 1) {
        return Promise.resolve(
          new Response('rate limited', {
            status: 429,
            headers: { 'x-rate-limit-api-token-interval-ms': '10' },
          })
        );
      }
      return Promise.resolve(new Response('ok', { status: 200 }));
    }) as typeof fetch;

    const res = await fetchWithResilience(
      'https://api.trello.com/1/boards',
      undefined,
      FAST
    );
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });
});
