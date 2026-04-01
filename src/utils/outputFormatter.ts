import type { ApiResponse } from '../models/apiResponse.js';

function stripNulls(obj: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  );
}

/**
 * Print API response as compact JSON (matching C# OutputFormatter behavior)
 */
export function print<T>(response: ApiResponse<T>): void {
  console.log(JSON.stringify(stripNulls(response)));
}
