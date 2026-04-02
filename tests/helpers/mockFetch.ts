import { mock } from 'bun:test';

interface MockResponseOptions {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Mocks globalThis.fetch to return a single response.
 * Since trelloApiService now uses fetchWithResilience (which calls fetch),
 * this still works for testing the service layer.
 * For tests that need to avoid retry delays, use non-retryable status codes
 * (400, 401, 403, 404) instead of retryable ones (500, 502, 503, 504, 429).
 */
export function mockFetchResponse(options: MockResponseOptions = {}): void {
  const { status = 200, body = {}, headers = {} } = options;
  const fn = mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
      })
    )
  );
  globalThis.fetch = fn as typeof fetch;
}

export function mockFetchSequence(responses: MockResponseOptions[]): void {
  let callIndex = 0;
  const fn = mock(() => {
    const opts = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    const { status = 200, body = {}, headers = {} } = opts;
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
      })
    );
  });
  globalThis.fetch = fn as typeof fetch;
}

export function mockFetchError(message: string): void {
  const fn = mock(() => Promise.reject(new Error(message)));
  globalThis.fetch = fn as typeof fetch;
}

export function restoreFetch(original: typeof fetch): void {
  globalThis.fetch = original;
}
