export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export function success<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function fail(
  error: string,
  code: string = 'ERROR'
): ApiResponse<never> {
  return { ok: false, error, code };
}
