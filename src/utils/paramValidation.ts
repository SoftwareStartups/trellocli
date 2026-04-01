import { fail } from '../models/apiResponse.js';
import { print } from './outputFormatter.js';

export function requireParam(value: string, name: string): boolean {
  if (!value) {
    print(fail(`${name} required`, 'MISSING_PARAM'));
    return false;
  }
  return true;
}
