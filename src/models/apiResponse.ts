export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export function success<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function fail<T>(error: string, code: string = 'ERROR'): ApiResponse<T> {
  return { ok: false, error, code };
}
