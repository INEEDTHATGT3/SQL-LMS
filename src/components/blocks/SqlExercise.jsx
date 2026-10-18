/* sql-exercise: runnable, graded SQL in the browser. Learner SQL and the
   authored solution run on every dataset in `datasets` (first = visible
   playground, the rest = hidden grading sets) inside the PGlite sandbox from
   engines/sqlrunner; results are compared with engines/resultcompare (NULL-
   aware, multiset by default, `orderMatters`/`floatTol`/`checkColumnNames`
   pass through). Run shows the first 50 rows; Submit grades against the
   solution on EVERY dataset and shows a DiffTables of missing/extra rows on
   mismatch. Passing calls setSolved(lessonId, id). Draft text persists under
   blocks['sql:' + id]; PGlite boots lazily on the first Run/Submit, never on
   mount. Embedded mode (inside a problem) drops the title row. */
import { useEffect, useId, useRef, useState } from 'react';
import { getDb, run, explain, schemaOf } from '../../engines/sqlrunner.js';
import compare from '../../engines/resultcompare.js';
import { loadDataset } from '../../lib/content.js';
import { logMistake } from '../../lib/progress.js';
import { Code, MD } from '../md.jsx';
import { DiffTables } from './TableDiff.jsx';
import './SqlExercise.css';

const MAX_ROWS = 50;

function ResultTable({ columns, rows }) {
  return (
    <div className="table-scroll">
      <table className="trace sql-res">
        <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>{r.map((v, j) => (
            <td key={j}>{v === null || v === undefined ? <span className="null">NULL</span> : String(v)}</td>
          ))}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default function SqlExercise({ b, ctx }) {
  const store = ctx.store;
  const draftKey = 'sql:' + b.id;
  const st = store.blocks?.[draftKey] || {};
  const datasets = b.datasets || [];
  const gradeOpts = {
    orderMatters: !!b.orderMatters,
    floatTol: b.floatTol ?? 1e-6,
    checkColumnNames: !!b.checkColumnNames,
  };
  const solved = !!store.solved?.[b.id];

  const [text, setText] = useState(st.text ?? b.starter ?? '');
  const [result, setResult] = useState(null);          // last Run output on the visible dataset
  const [grading, setGrading] = useState(null);        // last Submit verdict
  const [hintIdx, setHintIdx] = useState(-1);
  const [solOpen, setSolOpen] = useState(false);      // solution reveals only after a submit (and a click)
  const [busy, setBusy] = useState(null);              // 'boot' | 'run' | 'grade' | null
  const [schema, setSchema] = useState(undefined);     // undefined = not peeked yet
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const editorRef = useRef(null);
  const statusId = useId();

  /* debounced draft save (+ flush on blur); ponytail: rewrites the whole progress blob, fine at this size */
  useEffect(() => {
    if (text === (st.text || '')) return;
    const t = setTimeout(() => store.actions.saveBlock(ctx.lessonId, draftKey, { ...st, text }), 600);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  /* boots PGlite (cached); the caller owns the status label */
  const boot = name => getDb(name, loadDataset);

  const doRun = async () => {
    setPlan(null);
    setBusy('boot');
    try {
      const db = await boot(datasets[0]);
      setBusy('run');
      const r = await run(db, text);
      setResult({ ...r, total: r.rows.length, truncated: r.rows.length > MAX_ROWS });
    } finally { setBusy(null); }
  };

  const doExplain = async () => {
    setBusy('boot');
    try {
      const db = await boot(datasets[0]);
      setBusy('run');
      setPlan(await explain(db, text));
    } catch (e) { setPlan({ error: e.message || String(e) }); }
    finally { setBusy(null); }
  };

  const doSubmit = async () => {
    setGrading(null);
    setResult(null);   // drop a stale Run error/result so it can't linger under the verdict
    setBusy('boot');
    try {
      /* boot every dataset first (incl. hidden twins), then grade against the solution */
      const pairs = [];
      for (const ds of datasets) pairs.push([ds, await boot(ds)]);
      setBusy('grade');
      let fail = null;
      for (const [ds, db] of pairs) {
        const sol = await run(db, b.solution);
        if (sol.error) { fail = { ds, reason: `authored solution failed on ${ds}: ${sol.error}` }; break; }
        const got = await run(db, text);
        if (got.error) { fail = { ds, reason: got.error }; break; }
        const cmp = compare(sol, got, gradeOpts);
        if (!cmp.ok) {
          fail = { ds, reason: cmp.reason, missing: cmp.diff.missing, extra: cmp.diff.extra, columns: sol.columns };
          break;
        }
      }
      store.actions.saveBlock(ctx.lessonId, draftKey, { ...st, text, submitted: true });
      if (fail) {
        setGrading({ pass: false, ...fail });
        if (!st.submitted) logMistake(ctx.lessonId, b.prompt, String(b.solution).trim());
      } else {
        setGrading({ pass: true });
        store.actions.setSolved(ctx.lessonId, b.id, true);
      }
    } finally { setBusy(null); }
  };

  const onEditorKey = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const t = e.target;
      const { selectionStart: s, selectionEnd: en } = t;
      setText(prev => prev.slice(0, s) + '  ' + prev.slice(en));
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; });
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!busy) doRun();
    }
  };

  const toggleSchema = async () => {
    const next = !schemaOpen;
    setSchemaOpen(next);
    if (next && schema === undefined) {
      setBusy('boot');
      try {
        const db = await boot(datasets[0]);
        setSchema(await schemaOf(db));
      } finally { setBusy(null); }
    }
  };

  const hints = b.hints || [];
  const status = busy === 'boot' ? 'Booting PostgreSQL…'
    : busy === 'grade' ? `Grading on ${datasets.length} dataset${datasets.length > 1 ? 's' : ''}…`
    : busy === 'run' ? 'Running…' : '';
  const stemId = `${statusId}-q`;

  return (
    <div className={'blk sql-exercise' + (b.embedded ? ' embedded' : '')}>
      {(!b.embedded || solved) && (
        <div className="row-between">
          {!b.embedded && <div className="blk-title">{b.title || 'SQL exercise'}{b.tier ? ` · L${b.tier}` : ''}</div>}
          {solved && <span className="badge green">✓ SOLVED</span>}
        </div>
      )}

      <div className="quiz-q" id={stemId}><MD text={b.prompt} /></div>

      <div className="action-row">
        <button type="button" className="reveal-btn" onClick={toggleSchema} aria-expanded={schemaOpen}>
          Schema
        </button>
        <button type="button" className="reveal-btn" disabled={!!busy} onClick={doRun}>
          Run{b.embedded ? '' : ' (ctrl+⏎)'}
        </button>
        <button type="button" className="reveal-btn" disabled={!!busy} onClick={doSubmit}>Submit</button>
        {b.showPlan && (
          <button type="button" className="reveal-btn" disabled={!!busy} onClick={doExplain}>EXPLAIN</button>
        )}
        {datasets.length > 1 && <span className="dim small mono">{datasets.length} datasets</span>}
      </div>

      <textarea ref={editorRef} className="sql-editor" value={text} spellCheck={false}
        aria-labelledby={stemId} aria-describedby={statusId}
        placeholder="Write your query here. Tab inserts two spaces; Ctrl/Cmd+Enter runs."
        onChange={e => setText(e.target.value)} onKeyDown={onEditorKey}
        onBlur={() => text !== (st.text || '') && store.actions.saveBlock(ctx.lessonId, draftKey, { ...st, text })} />

      <div id={statusId} aria-live="polite">
        {status && <div className="block-loading">{status}</div>}
        {result && (result.error
          ? <div className="bad-text sql-err">{result.error}</div>
          : <>
              {result.total === 0
                ? <p className="dim small">0 rows returned.</p>
                : <ResultTable columns={result.columns} rows={result.rows.slice(0, MAX_ROWS)} />}
              {result.truncated && (
                <p className="dim small">Showing first {MAX_ROWS} of {result.total} rows — Submit checks the full result.</p>
              )}
            </>)}
        {schemaOpen && schema && (
          <div className="sql-schema">
            <table><tbody>{schema.map(t => (
              <tr key={t.table}>
                <td className="t">{t.table}</td>
                <td className="cols">{t.columns.join(' · ')}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}
        {plan && (plan.error
          ? <div className="bad-text sql-err">{plan.error}</div>
          : <details className="sql-plan" open><summary className="dim small">EXPLAIN (FORMAT JSON)</summary>
              <pre>{JSON.stringify(plan, null, 2)}</pre>
            </details>)}

        {grading?.pass && (
          <div className="verdict ok">PASS — matches on all {datasets.length} dataset{datasets.length > 1 ? 's' : ''}; marked SOLVED</div>
        )}
        {grading && !grading.pass && (
          <>
            <div className="verdict bad">FAIL on dataset “{grading.ds}”: {grading.reason}</div>
            {(grading.missing?.length || grading.extra?.length) ? (
              <DiffTables before={grading.missing || []} after={grading.extra || []}
                columns={grading.columns} labelBefore="Expected" labelAfter="Your result" />
            ) : null}
          </>
        )}
      </div>

      {hints.map((h, i) => i <= hintIdx && (
        <div key={i} className="callout blue">Hint {i + 1}: <MD text={h} /></div>
      ))}
      {hintIdx < hints.length - 1 && (
        <button type="button" className="reveal-btn" onClick={() => setHintIdx(i => i + 1)}>Hint {hintIdx + 2}</button>
      )}

      {st.submitted && !solOpen && (
        <div><button type="button" className="reveal-btn" onClick={() => setSolOpen(true)}>Reveal solution</button></div>
      )}
      {solOpen && <Code code={b.solution} lang="sql" />}
    </div>
  );
}
