export function errorMessage(ex: unknown): string {
  return ex instanceof Error ? ex.message : String(ex);
}
