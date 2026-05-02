import { CHECKITEM_FIELDS, MEMBER_FIELDS } from '../models/types.js';

/** Strip an object or array of objects to only the listed fields. */
export function pickFields(data: unknown, fields: readonly string[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => pickFields(item, fields));
  }
  if (typeof data !== 'object' || data === null) return data;
  const source = data as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in source) result[f] = source[f];
  }
  return result;
}

/** Apply `transform` to `data`, mapping if it's an array. */
function arrayOrSingle(
  data: unknown,
  transform: (item: Record<string, unknown>) => Record<string, unknown>
): unknown {
  if (Array.isArray(data)) {
    return data.map((d) => transform(d as Record<string, unknown>));
  }
  return transform(data as Record<string, unknown>);
}

export function transformComment(data: unknown): unknown {
  return arrayOrSingle(data, (c) => ({
    ...c,
    data:
      c.data && typeof c.data === 'object'
        ? { text: (c.data as Record<string, unknown>).text }
        : c.data,
    memberCreator: c.memberCreator
      ? pickFields(c.memberCreator, MEMBER_FIELDS)
      : c.memberCreator,
  }));
}

export function transformAction(data: unknown): unknown {
  return arrayOrSingle(data, (a) => ({
    ...a,
    memberCreator: a.memberCreator
      ? pickFields(a.memberCreator, MEMBER_FIELDS)
      : a.memberCreator,
  }));
}

export function transformChecklist(data: unknown): unknown {
  return arrayOrSingle(data, (cl) => ({
    ...cl,
    checkItems: Array.isArray(cl.checkItems)
      ? pickFields(cl.checkItems, CHECKITEM_FIELDS)
      : cl.checkItems,
  }));
}
