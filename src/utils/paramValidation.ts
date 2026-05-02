import * as fs from 'node:fs';

export interface ValidationError {
  message: string;
  code: 'MISSING_PARAM' | 'INVALID_PARAM';
}

export type Validator = (
  value: string,
  label: string
) => ValidationError | null;

export const requireParam: Validator = (value, name) =>
  value ? null : { message: `${name} required`, code: 'MISSING_PARAM' };

const TRELLO_ID_RE = /^[0-9a-f]{24}$/i;

export const validateTrelloId: Validator = (value, name) =>
  TRELLO_ID_RE.test(value)
    ? null
    : {
        message: `Invalid ${name}: expected 24-character hex string`,
        code: 'INVALID_PARAM',
      };

export const validateDate: Validator = (value, name) =>
  Number.isNaN(new Date(value).getTime())
    ? {
        message: `Invalid ${name}: expected ISO 8601 date (e.g. 2025-01-15)`,
        code: 'INVALID_PARAM',
      }
    : null;

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

export const validateColor: Validator = (value, name) =>
  TRELLO_COLORS.has(value.toLowerCase())
    ? null
    : {
        message: `Invalid ${name}: must be one of ${[...TRELLO_COLORS].join(', ')}`,
        code: 'INVALID_PARAM',
      };

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const validateFilePath: Validator = (value, name) => {
  let stats: fs.Stats;
  try {
    // realpathSync resolves symlinks; statSync alone would let a symlink to
    // /dev/zero through. realpathSync also throws ENOENT for missing files.
    fs.realpathSync(value);
    stats = fs.statSync(value);
  } catch {
    return {
      message: `Invalid ${name}: file not found`,
      code: 'INVALID_PARAM',
    };
  }
  if (!stats.isFile()) {
    return {
      message: `Invalid ${name}: not a regular file`,
      code: 'INVALID_PARAM',
    };
  }
  if (stats.size > MAX_FILE_SIZE) {
    return {
      message: `Invalid ${name}: file exceeds 10 MB limit (${Math.round(stats.size / 1024 / 1024)} MB)`,
      code: 'INVALID_PARAM',
    };
  }
  return null;
};

export const validatePositiveInt: Validator = (value, name) =>
  /^[1-9]\d*$/.test(value)
    ? null
    : {
        message: `Invalid ${name}: expected a positive integer`,
        code: 'INVALID_PARAM',
      };

export const validateUrl: Validator = (value, name) => {
  try {
    new URL(value);
    return null;
  } catch {
    return {
      message: `Invalid ${name}: expected a valid URL`,
      code: 'INVALID_PARAM',
    };
  }
};
