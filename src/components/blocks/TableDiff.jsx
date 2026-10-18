/* table-diff: one reference table when `after` is absent, or a single merged
   before/after diff table. Rows pair by the `key` column when given, else by
   position; paired cells that differ render `before → after` with .cell-chg,
   rows only in before with .cell-del, rows only in after with .cell-add.
   NULL always renders as an italic NULL span, never as an empty string.
   DiffTables is the reusable core (also used by SqlExercise to show grading
   diffs); rows may be arrays (needs `columns`) or objects (column order =
   first-seen key order). */
import './TableDiff.css';
import { normalizeValue } from '../../engines/resultcompare.js';

const isObj = r => r && typeof r === 'object' && !Array.isArray(r);

function unionCols(...rowSets) {
  const cols = [];
  for (const rows of rowSets)
    for (const r of rows || [])
      if (isObj(r)) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
  return cols;
}

const toCells = (row, cols) => (Array.isArray(row) ? cols.map((_, i) => row[i]) : cols.map(c => (isObj(row) ? row[c] : row)));

const cellEq = (a, b) => normalizeValue(a) === normalizeValue(b);

function Cell({ v }) {
  if (v === null || v === undefined) return <span className="null">NULL</span>;
  return String(v);
}

/* rows paired for the diff: [{ cls, before, after }] in display order.
   Pairing key is `keyCol`, not `key` — React strips `key` from props. */
function pairRows(before, after, keyCol) {
  const out = [];
  if (keyCol) {
    const pool = new Map();
    after.forEach((r, i) => {
      const k = JSON.stringify(normalizeValue(isObj(r) ? r[keyCol] : null));
      const q = pool.get(k) || [];
      q.push({ r, i }); pool.set(k, q);
    });
    before.forEach(r => {
      const k = JSON.stringify(normalizeValue(isObj(r) ? r[keyCol] : null));
      const hit = (pool.get(k) || []).shift();
      if (hit) out.push({ cls: 'pair', before: r, after: hit.r });
      else out.push({ cls: 'del', before: r, after: null });
    });
    for (const q of pool.values()) for (const { r } of q) out.push({ cls: 'add', before: null, after: r });
  } else {
    const n = Math.min(before.length, after.length);
    for (let i = 0; i < n; i++) out.push({ cls: 'pair', before: before[i], after: after[i] });
    for (let i = n; i < before.length; i++) out.push({ cls: 'del', before: before[i], after: null });
    for (let i = n; i < after.length; i++) out.push({ cls: 'add', before: null, after: after[i] });
  }
  return out;
}

export function DiffTables({ before = [], after, columns, keyCol, highlight = [], labelBefore = 'before', labelAfter = 'after' }) {
  const rowsA = before || [];
  const rowsB = after || [];
  const cols = columns && columns.length ? [...columns] : unionCols(rowsA, rowsB);
  const hi = c => ((highlight || []).includes(c) ? 'td-hi' : undefined);
  const cn = (...xs) => xs.filter(Boolean).join(' ') || undefined;

  if (after === undefined || after === null) {
    return (
      <div className="table-scroll">
        <table className="trace td-table">
          <thead><tr>{cols.map(c => <th key={c} className={cn(hi(c))}>{c}</th>)}</tr></thead>
          <tbody>{rowsA.map((r, i) => (
            <tr key={i}>{cols.map((c, j) => <td key={j} className={cn(hi(c))}><Cell v={toCells(r, cols)[j]} /></td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    );
  }

  const pairs = pairRows(rowsA, rowsB, keyCol);
  if (!pairs.length) return <p className="dim small">Both tables are empty.</p>;
  return (
    <>
      <div className="table-scroll">
        <table className="trace td-table">
          <thead><tr>{cols.map(c => <th key={c} className={cn(hi(c))}>{c}</th>)}</tr></thead>
          <tbody>{pairs.map((p, i) => (
            <tr key={i}>{cols.map((c, j) => {
              const av = p.before === null ? null : toCells(p.before, cols)[j];
              const bv = p.after === null ? null : toCells(p.after, cols)[j];
              const cls = p.cls === 'del' ? 'cell-del' : p.cls === 'add' ? 'cell-add'
                : cellEq(av, bv) ? '' : 'cell-chg';
              const content = p.cls === 'pair' && !cellEq(av, bv)
                ? <><span className="td-chg-old"><Cell v={av} /></span><Cell v={bv} /></>
                : <Cell v={p.cls === 'add' ? bv : av} />;
              return <td key={j} className={cn(cls, hi(c))}>{content}</td>;
            })}</tr>
          ))}</tbody>
        </table>
      </div>
      <div className="td-legend">
        <span className="cell-del td-leg"> {labelBefore}-only </span>
        <span className="cell-add td-leg"> {labelAfter}-only </span>
        <span className="cell-chg td-leg"> changed </span>
        <span className="dim"> (NULL is never an empty string)</span>
      </div>
    </>
  );
}

export default function TableDiff({ b }) {
  const s = b.spec ?? b;
  const before = s.before || [];
  if (!before.length && !(s.after || []).length) return <div className="callout warn">table-diff block missing data</div>;
  return (
    <div className="blk table-diff">
      {s.title && <div className="blk-title">{s.title}</div>}
      {s.after === undefined || s.after === null
        ? <DiffTables before={before} columns={s.columns} highlight={s.highlight} />
        : <DiffTables before={before} after={s.after} keyCol={s.key} highlight={s.highlight}
            labelBefore="before" labelAfter="after" />}
    </div>
  );
}
