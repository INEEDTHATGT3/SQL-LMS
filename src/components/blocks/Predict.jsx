/* predict: commit a prediction (number, option or short text) BEFORE the
   explanation is revealed. One attempt, stored as mcq[qkey(prompt)] like a
   quiz answer; a wrong prediction is logged as a mistake. */
import { useId, useState } from 'react';
import { qkey } from '../../lib/qkey.js';
import { logMistake } from '../../lib/progress.js';
import { checkAnswer, correctText } from '../../engines/recall.js';
import { Block } from '../blocks.jsx';
import { MD, Code } from '../md.jsx';
import { AnswerInput } from './Question.jsx';

export default function Predict({ b, ctx }) {
  const k = qkey(b.prompt);
  const saved = ctx.store.mcq?.[k];
  const locked = saved !== undefined;
  const a = b.answer || {};
  const item = { kind: a.kind || 'text', options: a.options, answer: a.value, tolerance: a.tolerance, unit: a.unit };
  const ok = locked && checkAnswer(item, saved);
  const [skipped, setSkipped] = useState(false);
  const show = locked || (b.commitRequired === false && skipped);
  const labelId = useId();
  const submit = v => {
    if (locked) return;
    ctx.store.actions.recordAnswer(ctx.lessonId, k, v);
    if (!checkAnswer(item, v)) logMistake(ctx.lessonId, b.prompt, correctText(item));
  };
  return (
    <div className="blk">
      <div className="blk-title">Predict first</div>
      <div className="quiz-q" id={labelId}><MD text={b.prompt} /></div>
      <Given g={b.given} />
      <AnswerInput item={item} seed={k} saved={saved} onSubmit={submit} labelId={labelId} />
      {!show && (b.commitRequired === false
        ? <button type="button" className="reveal-btn" onClick={() => setSkipped(true)}>Skip, just show me</button>
        : <p className="dim small">Commit a prediction to unlock the explanation.</p>)}
      <div aria-live="polite">
        {locked && <>
          <div className={'verdict ' + (ok ? 'ok' : 'bad')}>{ok ? 'PREDICTION CORRECT' : 'PREDICTION OFF'}</div>
          {!ok && item.kind !== 'mcq' && <div className="small">Actual: <MD text={correctText(item)} /></div>}
        </>}
      </div>
      {show && (b.reveal || []).map((rb, i) => <Block key={i} b={rb} ctx={ctx} />)}
    </div>
  );
}

function Given({ g }) {
  if (!g) return null;
  return (<>
    {g.text && <p><MD text={g.text} /></p>}
    {Object.entries(g.tables || {}).map(([name, rows]) => <Rows key={name} name={name} rows={rows || []} />)}
    {g.sql && <Code code={g.sql} lang="sql" />}
  </>);
}

/* rows: [{ col: value }]; missing or null cells print as NULL */
function Rows({ name, rows }) {
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
  return (<>
    <div className="dim small mono">{name}</div>
    <div className="table-scroll">
      <table className="trace">
        <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>{cols.map(c => <td key={c}>{r[c] == null ? <span className="null">NULL</span> : String(r[c])}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  </>);
}
