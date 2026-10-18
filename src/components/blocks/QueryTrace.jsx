/* query-trace: SQL's missing dry run. Run trace boots PGlite for `dataset`
   and executes every authored stage in order (each stage is a full query that
   applies one more clause), then steps prev/next over the intermediate
   tables — or Show all stacks them. Every stage shows its row count; when a
   stage's columns equal the previous stage's, rows the previous stage had and
   this one lost are appended with .cell-del (and rows only this stage has
   render with .cell-add), so a filter's victims — or a join trap's silent
   losses — are visible row by row. Columns changing (GROUP BY, SELECT swap)
   disables the diff: there is nothing row-for-row to compare. */
import { useId, useState } from 'react';
import { getDb, run } from '../../engines/sqlrunner.js';
import { loadDataset } from '../../lib/content.js';
import { normalizeRow } from '../../engines/resultcompare.js';
import { Code, MD } from '../md.jsx';
import './QueryTrace.css';

const MAX_ROWS = 50;
const rowKey = r => JSON.stringify(normalizeRow(r));

/* multiset diff of two results that share a column layout:
   added[i] flags current rows the previous stage didn't have; dropped lists
   previous rows this stage eliminated. null = no comparable diff. */
function classify(prev, cur) {
  if (!prev || !cur || prev.error || cur.error) return null;
  if (JSON.stringify(prev.columns) !== JSON.stringify(cur.columns)) return null;
  const tally = rows => {
    const m = new Map();
    for (const r of rows) { const k = rowKey(r); m.set(k, (m.get(k) || 0) + 1); }
    return m;
  };
  const inCur = tally(cur.rows);
  const dropped = [];
  for (const r of prev.rows) {
    const k = rowKey(r), n = inCur.get(k) || 0;
    if (n) inCur.set(k, n - 1); else dropped.push(r);
  }
  const inPrev = tally(prev.rows);
  const added = cur.rows.map(r => {
    const k = rowKey(r), n = inPrev.get(k) || 0;
    if (n) { inPrev.set(k, n - 1); return false; }
    return true;
  });
  return { added, dropped };
}

const Cell = ({ v }) => (v === null || v === undefined ? <span className="null">NULL</span> : String(v));

function StageTable({ r, diff }) {
  const shown = r.rows.slice(0, MAX_ROWS);
  const dropTotal = diff ? diff.dropped.length : 0;
  const dropped = (diff ? diff.dropped : []).slice(0, MAX_ROWS);
  const addTotal = diff ? diff.added.filter(Boolean).length : 0;
  const cut = r.rows.length > MAX_ROWS || dropped.length < dropTotal;
  return (
    <>
      <div className="table-scroll">
        <table className="trace qt-table">
          <thead><tr>{r.columns.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={`s${i}`}>{row.map((v, j) => (
                <td key={j} className={diff && diff.added[i] ? 'cell-add' : undefined}><Cell v={v} /></td>
              ))}</tr>
            ))}
            {dropped.map((row, i) => (
              <tr key={`d${i}`}>{row.map((v, j) => (
                <td key={j} className="cell-del"><Cell v={v} /></td>
              ))}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {cut && (
        <p className="dim small">Showing the first {MAX_ROWS} rows of each part ({r.rows.length} total{dropTotal ? `, ${dropTotal} dropped` : ''}).</p>
      )}
      {(addTotal > 0 || dropTotal > 0) && (
        <div className="qt-legend">
          {addTotal > 0 && <span className="qt-leg cell-add"> {addTotal} new row{addTotal > 1 ? 's' : ''} </span>}
          {dropTotal > 0 && <span className="qt-leg cell-del"> {dropTotal} dropped since the previous stage </span>}
          <span className="dim"> struck-through rows are shown so you can see what this clause removed</span>
        </div>
      )}
    </>
  );
}

export default function QueryTrace({ b }) {
  const stages = Array.isArray(b.stages) ? b.stages : [];
  const [res, setRes] = useState(null);        // [{ columns, rows, error }] per stage
  const [bootErr, setBootErr] = useState(null);
  const [busy, setBusy] = useState(null);      // status label while running
  const [idx, setIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const statusId = useId();

  const runTrace = async () => {
    setBootErr(null);
    setBusy('Booting PostgreSQL…');
    try {
      const db = await getDb(b.dataset, loadDataset);
      const out = [];
      for (let i = 0; i < stages.length; i++) {
        setBusy(`Running stage ${i + 1}/${stages.length}: ${stages[i].label || ''}`);
        out.push(await run(db, stages[i].sql));   // run() never throws; errors ride along
      }
      setRes(out);
      setIdx(0);
    } catch (e) {
      setBootErr(e?.message || String(e));
      setRes(null);
    } finally { setBusy(null); }
  };

  if (!b.dataset || !stages.length) return <div className="callout warn">query-trace block missing dataset or stages</div>;

  const view = showAll ? stages.map((_, i) => i) : [Math.min(idx, stages.length - 1)];

  return (
    <div className="blk query-trace">
      <div className="row-between">
        <div className="blk-title">{b.title || 'Query trace'}</div>
        <span className="badge">{b.dataset}</span>
      </div>

      <div className="action-row">
        <button type="button" className="reveal-btn" disabled={!!busy} onClick={runTrace}>
          {res ? 'Re-run trace' : 'Run trace'}
        </button>
        {res && !showAll && (
          <>
            <button type="button" className="reveal-btn" disabled={!!busy || idx === 0}
              onClick={() => setIdx(i => Math.max(0, i - 1))}>← Prev</button>
            <span className="qt-step small dim">stage {idx + 1} / {stages.length}</span>
            <button type="button" className="reveal-btn" disabled={!!busy || idx >= stages.length - 1}
              onClick={() => setIdx(i => Math.min(stages.length - 1, i + 1))}>Next →</button>
          </>
        )}
        {res && (
          <button type="button" className="reveal-btn" aria-pressed={showAll}
            onClick={() => setShowAll(v => !v)}>Show all</button>
        )}
        <span className="dim small mono">{stages.length} stages</span>
      </div>

      <div id={statusId} aria-live="polite">
        {busy && <div className="block-loading">{busy}</div>}
        {bootErr && <div className="bad-text">{bootErr}</div>}
        {!res && !busy && !bootErr && (
          <p className="dim small">
            Each stage is the full query up to one clause. Hit <b>Run trace</b> to boot PostgreSQL on{' '}
            <span className="mono">{b.dataset}</span> and step through the intermediate tables.
          </p>
        )}

        {view.map(i => {
          const st = stages[i];
          const r = res ? res[i] : null;
          const diff = r && !r.error ? classify(i > 0 ? res[i - 1] : null, r) : null;
          const nDrop = diff ? diff.dropped.length : 0;
          const nAdd = diff ? diff.added.filter(Boolean).length : 0;
          return (
            <div className="qt-stage" key={i}>
              <div className="qt-stage-head">
                <span className="qt-label">{i + 1}. {st.label || 'stage'}</span>
                {r && !r.error && (
                  <span className="qt-count">
                    {r.rows.length} row{r.rows.length === 1 ? '' : 's'}
                    {nDrop ? ` · ${nDrop} dropped` : ''}
                    {nAdd ? ` · ${nAdd} new` : ''}
                  </span>
                )}
              </div>
              <Code code={st.sql} lang="sql" />
              {st.note && <p className="qt-note small"><MD text={st.note} /></p>}
              {r && (r.error
                ? <div className="bad-text">{r.error}</div>
                : <StageTable r={r} diff={diff} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
