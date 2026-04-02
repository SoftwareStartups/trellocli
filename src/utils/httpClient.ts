import { debug, warn, redactUrl, isVerbose } from './logger.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BASE_MS = 1_000;
const RETRY_CAP_MS = 30_000;
const RATE_LIMIT_THRESHOLD = 5;

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface FetchOptions {
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseMs?: number;
}

function getTimeoutMs(): number {
  const env = process.env.TRELLO_TIMEOUT_MS;
  if (env) {
    const parsed = Number(env);
    if (parsed > 0) return parsed;
  }
  return DEFAULT_TIMEOUT_MS;
}

function getRetryBaseMs(): number {
  const env = process.env.TRELLO_RETRY_BASE_MS;
  if (env) {
    const parsed = Number(env);
    if (parsed >= 0) return parsed;
  }
  return DEFAULT_RETRY_BASE_MS;
}

function backoffMs(attempt: number, baseMs: number): number {
  const base = Math.min(baseMs * 2 ** attempt, RETRY_CAP_MS);
  const jitter = Math.random() * 100;
  return base + jitter;
}

export async function fetchWithResilience(
  url: string,
  init?: RequestInit,
  options?: FetchOptions
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? getTimeoutMs();
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryBaseMs = options?.retryBaseMs ?? getRetryBaseMs();
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = performance.now();
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (isVerbose()) {
        const method = init?.method ?? 'GET';
        const elapsed = Math.round(performance.now() - start);
        debug(
          `${method} ${redactUrl(url)} -> ${response.status} (${elapsed}ms)`
        );
      }

      // Check proactive rate limiting
      const remaining = response.headers.get(
        'x-rate-limit-api-token-remaining'
      );
      const intervalMs = response.headers.get(
        'x-rate-limit-api-token-interval-ms'
      );
      if (remaining !== null && Number(remaining) < RATE_LIMIT_THRESHOLD) {
        const waitMs = intervalMs ? Number(intervalMs) : 1_000;
        warn(`Rate limit low (${remaining} remaining), waiting ${waitMs}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
      }

      // Retry on retryable status codes
      if (RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries) {
        if (response.status === 429) {
          const waitMs = intervalMs
            ? Number(intervalMs)
            : backoffMs(attempt, retryBaseMs);
          warn(`429 rate limited, retrying in ${Math.round(waitMs)}ms`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        const waitMs = backoffMs(attempt, retryBaseMs);
        warn(`HTTP ${response.status}, retrying in ${Math.round(waitMs)}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (isVerbose()) {
        const method = init?.method ?? 'GET';
        const elapsed = Math.round(performance.now() - start);
        debug(
          `${method} ${redactUrl(url)} -> ERROR: ${lastError.message} (${elapsed}ms)`
        );
      }
      if (attempt < maxRetries) {
        const waitMs = backoffMs(attempt, retryBaseMs);
        warn(`Network error, retrying in ${Math.round(waitMs)}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }

  throw lastError ?? new Error('Request failed after retries');
}
