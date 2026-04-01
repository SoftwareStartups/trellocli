import type { ApiResponse } from '../models/apiResponse.js';

/**
 * Removes null/undefined values from object (shallow)
 */
function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Print API response as compact JSON (matching C# OutputFormatter behavior)
 */
export function print<T>(response: ApiResponse<T>): void {
  const cleaned = stripNulls(response as unknown as Record<string, unknown>);
  console.log(JSON.stringify(cleaned));
}

/**
 * Convert to JSON string
 */
export function toJson<T>(obj: T): string {
  return JSON.stringify(obj);
}
