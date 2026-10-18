/* Pure result comparison for graded SQL: two { columns, rows } results
   (or plain row arrays) are equal when the same rows come back, NULL-aware
   and order-insensitive by default.

   compare(expected, got, opts) -> { ok, reason, diff: { missing, extra } }
     orderMatters     default false — multiset compare (each expected row must
                      be consumed by exactly one got row)
     floatTol         default 1e-6 — |a - b| <= tol for numeric cells
     checkColumnNames default false — when both sides carry columns, compare
                      them case-insensitively before the rows

   Normalisation (applied to both sides, so it can never flip a verdict):
   - null/undefined stay null (never equal to '' or 0)
   - PG numeric/text numerics ('250000.00', '1e3') become numbers
   - Date -> ISO string, bigint -> number, booleans stay booleans */

const NUMERIC = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

export function normalizeValue(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string' && NUMERIC.test(v)) return Number(v);
  if (typeof v === 'bigint') return Number(v);
  return v;
}

export const normalizeRow = row => row.map(normalizeValue);

function colsOf(x) {
  return x && !Array.isArray(x) && Array.isArray(x.columns) ? x.columns : null;
}

function rowsOf(x) {
  if (Array.isArray(x)) return x;
  return x && Array.isArray(x.rows) ? x.rows : [];
}

/* rows may be arrays or row objects; objects need a column order to become arrays */
function toArrays(rows, cols) {
  return rows.map(r => {
    if (Array.isArray(r)) return r.map(normalizeValue);
    if (r && typeof r === 'object') {
      const keys = cols || Object.keys(r).sort();
      return keys.map(k => normalizeValue(r[k]));
    }
    return [normalizeValue(r)];
  });
}

function cellEq(a, b, tol) {
  if (a === null || b === null) return a === b;          // NULL != '' != 0
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) <= tol;
  }
  return a === b;
}

function rowEq(a, b, tol) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!cellEq(a[i], b[i], tol)) return false;
  return true;
}

const fmt = row => `[${row.map(v => (v === null ? 'NULL' : JSON.stringify(v))).join(', ')}]`;

export function compare(expected, got, opts = {}) {
  const { orderMatters = false, floatTol = 1e-6, checkColumnNames = false } = opts;
  const expCols = colsOf(expected);
  const gotCols = colsOf(got);
  const exp = toArrays(rowsOf(expected), expCols);
  const res = toArrays(rowsOf(got), gotCols);
  const diff = { missing: [], extra: [] };

  if (checkColumnNames && expCols && gotCols) {
    const a = expCols.map(c => String(c).toLowerCase());
    const b = gotCols.map(c => String(c).toLowerCase());
    if (a.length !== b.length || a.some((c, i) => c !== b[i])) {
      return {
        ok: false,
        reason: `column names differ: expected ${a.join(', ')} · got ${b.join(', ')}`,
        diff
      };
    }
  }

  const expW = exp.length ? exp[0].length : null;
  const gotW = res.length ? res[0].length : null;
  if (expW !== null && gotW !== null && expW !== gotW) {
    diff.missing = exp;
    diff.extra = res;
    return { ok: false, reason: `column count mismatch: expected ${expW}, got ${gotW}`, diff };
  }

  if (orderMatters) {
    const n = Math.min(exp.length, res.length);
    let reason = null;
    for (let i = 0; i < n; i++) {
      if (!rowEq(exp[i], res[i], floatTol)) {
        diff.missing.push(exp[i]);
        diff.extra.push(res[i]);
        reason ||= `row ${i + 1} differs: expected ${fmt(exp[i])} · got ${fmt(res[i])}`;
      }
    }
    if (exp.length > n) {
      diff.missing.push(...exp.slice(n));
      reason ||= `expected ${exp.length} row(s), got ${res.length}`;
    } else if (res.length > n) {
      diff.extra.push(...res.slice(n));
      reason ||= `expected ${exp.length} row(s), got ${res.length}`;
    }
    return reason ? { ok: false, reason, diff } : { ok: true, reason: null, diff };
  }

  /* multiset: consume one got row per expected row (float-tolerant) */
  const used = new Array(res.length).fill(false);
  for (const er of exp) {
    const j = res.findIndex((gr, i) => !used[i] && rowEq(er, gr, floatTol));
    if (j >= 0) used[j] = true;
    else diff.missing.push(er);
  }
  for (let i = 0; i < res.length; i++) if (!used[i]) diff.extra.push(res[i]);
  if (diff.missing.length || diff.extra.length) {
    return {
      ok: false,
      reason: `${diff.missing.length} missing row(s), ${diff.extra.length} extra row(s)`,
      diff
    };
  }
  return { ok: true, reason: null, diff };
}

export default compare;
