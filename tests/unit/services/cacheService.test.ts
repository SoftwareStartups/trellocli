import { describe, test, expect, beforeEach } from 'bun:test';
import { CacheService } from '../../../src/services/cacheService.js';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService();
  });

  test('returns undefined for missing key', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  test('stores and retrieves data', () => {
    cache.set('key1', { id: '1' }, 60_000);
    expect(cache.get('key1')).toEqual({ id: '1' });
  });

  test('returns undefined for expired entries', async () => {
    cache.set('key2', 'data', 1); // 1ms TTL
    await new Promise((r) => setTimeout(r, 5));
    expect(cache.get('key2')).toBeUndefined();
  });

  test('invalidates by pattern', () => {
    cache.set('/boards/b1/lists', ['list1'], 60_000);
    cache.set('/boards/b1/cards', ['card1'], 60_000);
    cache.set('/members/me', { id: 'm1' }, 60_000);

    cache.invalidate('/boards/b1');
    expect(cache.get('/boards/b1/lists')).toBeUndefined();
    expect(cache.get('/boards/b1/cards')).toBeUndefined();
    expect(cache.get('/members/me')).toEqual({ id: 'm1' });
  });

  test('clears all entries', () => {
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  test('does nothing when disabled', () => {
    cache.setEnabled(false);
    cache.set('key', 'data', 60_000);
    expect(cache.get('key')).toBeUndefined();
  });

  test('tracks size', () => {
    expect(cache.size).toBe(0);
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    expect(cache.size).toBe(2);
  });
});
