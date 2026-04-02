import type { ApiResponse } from '../models/apiResponse.js';

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (Array.isArray(value)) {
    if (value.length === 0) return '(none)';
    if (typeof value[0] === 'object') return `(${value.length} items)`;
    return value.join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatSingle(data: Record<string, unknown>): string {
  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined
  );
  if (entries.length === 0) return '(empty)';
  const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
  return entries
    .map(([k, v]) => `${k.padEnd(maxKeyLen)}  ${formatValue(v)}`)
    .join('\n');
}

function formatList(items: Record<string, unknown>[]): string {
  if (items.length === 0) return '(no results)';

  // Pick display columns: prefer id, name, url, then first 4 keys
  const allKeys = Object.keys(items[0]);
  const preferred = ['id', 'name', 'url', 'fullName', 'username', 'color'];
  const displayKeys = [
    ...preferred.filter((k) => allKeys.includes(k)),
    ...allKeys.filter((k) => !preferred.includes(k)),
  ].slice(0, 5);

  const cols = process.stdout.columns || 120;
  const colWidth = Math.floor(
    (cols - displayKeys.length + 1) / displayKeys.length
  );

  const header = displayKeys.map((k) => k.padEnd(colWidth)).join(' ');
  const separator = displayKeys.map(() => '-'.repeat(colWidth)).join(' ');
  const rows = items.map((item) =>
    displayKeys
      .map((k) => {
        const val = formatValue(item[k]);
        return val.length > colWidth
          ? `${val.slice(0, colWidth - 1)}…`
          : val.padEnd(colWidth);
      })
      .join(' ')
  );

  return [header, separator, ...rows].join('\n');
}

export function formatText<T>(response: ApiResponse<T>): string {
  if (!response.ok) {
    const code = response.code ? ` (${response.code})` : '';
    return `Error: ${response.error}${code}`;
  }

  const data = response.data;

  if (data === null || data === undefined) return '(no data)';

  if (typeof data === 'string') return data;

  if (typeof data === 'object' && 'message' in (data as object)) {
    return String((data as Record<string, unknown>).message);
  }

  if (typeof data === 'object' && 'deleted' in (data as object)) {
    return 'Deleted successfully.';
  }

  if (typeof data === 'object' && 'removed' in (data as object)) {
    return 'Removed successfully.';
  }

  if (Array.isArray(data)) {
    return formatList(data as Record<string, unknown>[]);
  }

  if (typeof data === 'object') {
    return formatSingle(data as Record<string, unknown>);
  }

  return String(data);
}
