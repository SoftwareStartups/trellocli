import type { ApiResponse } from '../models/apiResponse.js';
import { formatText } from './textFormatter.js';

let jsonMode = false;

export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

function stripNulls(obj: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  );
}

export function print<T>(response: ApiResponse<T>): void {
  if (!response.ok && !process.env.__TRELLOCLI_TEST) {
    process.exitCode = 1;
  }
  if (jsonMode) {
    console.log(JSON.stringify(stripNulls(response)));
  } else {
    console.log(formatText(response));
  }
}
