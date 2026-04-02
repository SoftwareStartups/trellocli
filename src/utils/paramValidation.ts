import * as fs from 'node:fs';
import * as path from 'node:path';
import { fail } from '../models/apiResponse.js';
import { print } from './outputFormatter.js';

export function requireParam(value: string, name: string): boolean {
  if (!value) {
    print(fail(`${name} required`, 'MISSING_PARAM'));
    return false;
  }
  return true;
}

const TRELLO_ID_RE = /^[0-9a-f]{24}$/i;

export function validateTrelloId(value: string, name: string): boolean {
  if (!TRELLO_ID_RE.test(value)) {
    print(
      fail(`Invalid ${name}: expected 24-character hex string`, 'INVALID_PARAM')
    );
    return false;
  }
  return true;
}

export function validateDate(value: string, name: string): boolean {
  if (Number.isNaN(new Date(value).getTime())) {
    print(
      fail(
        `Invalid ${name}: expected ISO 8601 date (e.g. 2025-01-15)`,
        'INVALID_PARAM'
      )
    );
    return false;
  }
  return true;
}

const TRELLO_COLORS = new Set([
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
  'blue',
  'sky',
  'lime',
  'pink',
  'black',
]);

export function validateColor(value: string, name: string): boolean {
  if (!TRELLO_COLORS.has(value.toLowerCase())) {
    print(
      fail(
        `Invalid ${name}: must be one of ${[...TRELLO_COLORS].join(', ')}`,
        'INVALID_PARAM'
      )
    );
    return false;
  }
  return true;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFilePath(value: string, name: string): boolean {
  const normalized = path.normalize(value);
  if (normalized.includes('..')) {
    print(fail(`Invalid ${name}: path traversal not allowed`, 'INVALID_PARAM'));
    return false;
  }
  if (!fs.existsSync(value)) {
    print(fail(`Invalid ${name}: file not found`, 'INVALID_PARAM'));
    return false;
  }
  const stats = fs.statSync(value);
  if (stats.size > MAX_FILE_SIZE) {
    print(
      fail(
        `Invalid ${name}: file exceeds 10 MB limit (${Math.round(stats.size / 1024 / 1024)} MB)`,
        'INVALID_PARAM'
      )
    );
    return false;
  }
  return true;
}

export function validateUrl(value: string, name: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    print(fail(`Invalid ${name}: expected a valid URL`, 'INVALID_PARAM'));
    return false;
  }
}
