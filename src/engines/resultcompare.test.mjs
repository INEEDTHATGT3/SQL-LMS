import assert from 'node:assert/strict';
import { compare, normalizeValue, normalizeRow } from './resultcompare.js';

/* --- normalisation --- */
assert.equal(normalizeValue(null), null);
assert.equal(normalizeValue(''), '');                      // empty string is not NULL, not 0
assert.equal(normalizeValue('abc'), 'abc');
assert.equal(normalizeValue('250000.00'), 250000);
assert.equal(normalizeValue('-3.5'), -3.5);
assert.equal(normalizeValue('1e3'), 1000);
assert.equal(normalizeValue(42), 42);
assert.equal(normalizeValue(true), true);
assert.equal(normalizeValue(new Date('2024-01-15T00:00:00Z')), '2024-01-15T00:00:00.000Z');
assert.equal(normalizeValue(10n), 10);
assert.deepEqual(normalizeRow(['1.50', null, 'x']), [1.5, null, 'x']);

/* --- identical results --- */
{
  const r = compare({ columns: ['a'], rows: [[1], [2]] }, { columns: ['a'], rows: [[1], [2]] });
  assert.equal(r.ok, true);
  assert.equal(r.reason, null);
}

/* --- multiset: order does not matter by default --- */
{
  const exp = { columns: ['id', 'name'], rows: [[1, 'a'], [2, 'b'], [2, 'b']] };
  const got = { columns: ['id', 'name'], rows: [[2, 'b'], [1, 'a'], [2, 'b']] };
  assert.equal(compare(exp, got).ok, true);
}

/* --- duplicates are counted, not deduplicated --- */
{
  const exp = { columns: ['x'], rows: [[1], [1]] };
  assert.equal(compare(exp, { columns: ['x'], rows: [[1]] }).ok, false);
  const r = compare(exp, { columns: ['x'], rows: [[1]] });
  assert.equal(r.diff.missing.length, 1);
  assert.equal(r.diff.extra.length, 0);
  assert.match(r.reason, /1 missing/);
  assert.equal(compare(exp, { columns: ['x'], rows: [[1], [1], [1]] }).ok, false);
}

/* --- NULL vs empty string vs 0 --- */
{
  const exp = { columns: ['e'], rows: [[null]] };
  assert.equal(compare(exp, { columns: ['e'], rows: [['']] }).ok, false);
  assert.equal(compare(exp, { columns: ['e'], rows: [[0]] }).ok, false);
  assert.equal(compare(exp, { columns: ['e'], rows: [[null]] }).ok, true);
}

/* --- numeric string vs number (PG numeric arrives as text) --- */
{
  const exp = { columns: ['salary'], rows: [['250000.00']] };
  assert.equal(compare(exp, { columns: ['salary'], rows: [[250000]] }).ok, true);
  assert.equal(compare(exp, { columns: ['salary'], rows: [['250000.00']] }).ok, true);
}

/* --- float tolerance: default 1e-6, configurable --- */
{
  const exp = { columns: ['f'], rows: [[0.30000000000000004]] };
  assert.equal(compare(exp, { columns: ['f'], rows: [[0.3]] }).ok, true);   // within default tol
  assert.equal(compare(exp, { columns: ['f'], rows: [[0.31]] }).ok, false);
  assert.equal(compare(exp, { columns: ['f'], rows: [[0.31]] }, { floatTol: 0.1 }).ok, true);
}

/* --- column-count mismatch --- */
{
  const r = compare({ columns: ['a', 'b'], rows: [[1, 2]] }, { columns: ['a'], rows: [[1]] });
  assert.equal(r.ok, false);
  assert.match(r.reason, /column count mismatch/);
  assert.equal(r.diff.missing.length, 1);
  assert.equal(r.diff.extra.length, 1);
}

/* --- orderMatters: same multiset, wrong order --- */
{
  const exp = { columns: ['n'], rows: [[1], [2], [3]] };
  const got = { columns: ['n'], rows: [[3], [2], [1]] };
  assert.equal(compare(exp, got).ok, true);                                   // default: multiset
  const r = compare(exp, got, { orderMatters: true });
  assert.equal(r.ok, false);
  assert.match(r.reason, /row 1 differs/);
  assert.equal(r.diff.missing.length, 2);   // row 2 ([2]) matches in place
  assert.equal(r.diff.extra.length, 2);
  assert.equal(compare(exp, { columns: ['n'], rows: [[1], [2], [3]] }, { orderMatters: true }).ok, true);
  /* orderMatters with a length change points at the truncation */
  const r2 = compare(exp, { columns: ['n'], rows: [[1], [2]] }, { orderMatters: true });
  assert.equal(r2.ok, false);
  assert.match(r2.reason, /expected 3 row\(s\), got 2/);
  assert.equal(r2.diff.extra.length, 0);
  assert.equal(r2.diff.missing.length, 1);
}

/* --- checkColumnNames --- */
{
  const exp = { columns: ['EmpId', 'Name'], rows: [[1, 'a']] };
  assert.equal(compare(exp, { columns: ['empid', 'name'], rows: [[1, 'a']] }, { checkColumnNames: true }).ok, true);
  const r = compare(exp, { columns: ['id', 'name'], rows: [[1, 'a']] }, { checkColumnNames: true });
  assert.equal(r.ok, false);
  assert.match(r.reason, /column names differ/);
  /* off by default */
  assert.equal(compare(exp, { columns: ['id', 'name'], rows: [[1, 'a']] }).ok, true);
}

/* --- row objects (not arrays) are accepted via columns order --- */
{
  const exp = { columns: ['a', 'b'], rows: [{ a: 1, b: 'x' }] };
  const got = { columns: ['a', 'b'], rows: [[1, 'x']] };
  assert.equal(compare(exp, got).ok, true);
}

/* --- plain row arrays (no columns wrapper) --- */
{
  assert.equal(compare([[1], [2]], [[2], [1]]).ok, true);
}

/* --- empty vs empty --- */
{
  assert.equal(compare({ columns: ['a'], rows: [] }, { columns: ['a'], rows: [] }).ok, true);
}
