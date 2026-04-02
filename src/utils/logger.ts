let verbose = false;

export function setVerbose(enabled: boolean): void {
  verbose = enabled;
}

export function isVerbose(): boolean {
  return verbose;
}

export function debug(msg: string): void {
  if (verbose) process.stderr.write(`[DEBUG] ${msg}\n`);
}

export function warn(msg: string): void {
  if (verbose) process.stderr.write(`[WARN] ${msg}\n`);
}

export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete('key');
    u.searchParams.delete('token');
    return u.pathname + (u.search || '');
  } catch {
    return url.replace(/[?&](key|token)=[^&]*/g, '');
  }
}
