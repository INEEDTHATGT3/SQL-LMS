/* fd-stepper: step tables for FD tasks (closure:X, keys, primeAttrs,
   minimalCover, superkeyCount, equivalent).
   mode 'worked': every step shown; a faded example blanks the steps from
   fadeFrom on (fadeFrom = number of steps left worked; null = no fading;
   absent = backward fading by level: L1 fully worked, each level above blanks
   one more final step). mode 'practice': the learner answers first, one attempt,
   then the steps appear. Stored as recordAnswer(lessonId, qkey(`${stem} ${task}`),
   value) with stem = title or "R(...) {F}"; value shapes: engines/fd.js parseAnswer. */
import { useMemo, useState } from 'react';
import { qkey } from '../../lib/qkey.js';
import { logMistake } from '../../lib/progress.js';
import { relation, stepperTask, parseAnswer, checkAnswer, showValue, checkBlank, fdStr, relStr } from '../../engines/fd.js';
import './FdStepper.css';

const fdSet = F => `{${F.map(fdStr).join(', ')}}`;
const blankRows = m => m.rows.flatMap((r, i) => (r.blank ? [i] : []));

function defaultFade(m, level) {
  return level > 1 ? Math.max(0, blankRows(m).length - (level - 1)) : null;
}

export default function FdStepper({ b, ctx }) {
  const built = useMemo(() => {
    try {
      const { A, F } = relation(b.attrs, b.fds);
      return { A, F, models: (b.tasks || []).map(t => ({ task: String(t), m: stepperTask(t, A, F, b.other) })) };
    } catch (e) { return { error: e.message }; }
  }, [b]);
  if (built.error) return <div className="callout red">fd-stepper: {built.error}</div>;
  const { A, F, models } = built;
  const stem = b.title || `${relStr('R', A)} ${fdSet(F)}`;
  return (
    <div className="blk fd-stepper">
      <div className="blk-title">{b.title || 'FD stepper'}</div>
      <div className="mono small">{relStr('R', A)}</div>
      <div className="mono small">F = {fdSet(F)}</div>
      {models.map(({ task, m }) => b.mode === 'practice'
        ? <Practice key={task} m={m} qKey={qkey(`${stem} ${task}`)} stem={stem} ctx={ctx} A={A} F={F} />
        : <Worked key={task} m={m} A={A} fadeFrom={'fadeFrom' in b ? b.fadeFrom : defaultFade(m, ctx.level)} />)}
    </div>
  );
}

function Worked({ m, A, fadeFrom }) {
  const [vals, setVals] = useState({});
  const [checked, setChecked] = useState(false);
  const [shown, setShown] = useState(false);
  const good = i => checkBlank(m.rows[i].blank, vals[i] ?? '', A);
  const faded = fadeFrom == null || shown ? [] : blankRows(m).slice(fadeFrom);
  const open = faded.filter(i => !(checked && good(i)));
  return (
    <div className="fd-task">
      <div className="fd-task-title">{m.title}</div>
      {m.note && <p className="dim small">{m.note}</p>}
      <StepTable m={m} open={open} vals={vals} checked={checked}
        setVal={(i, v) => setVals(s => ({ ...s, [i]: v }))} />
      {open.length > 0 ? (
        <div className="action-row">
          <button type="button" className="reveal-btn" onClick={() => setChecked(true)}>Check steps</button>
          <button type="button" className="reveal-btn" onClick={() => setShown(true)}>Show all</button>
          <span className="dim small">{open.length} step{open.length > 1 ? 's' : ''} for you to fill</span>
        </div>
      ) : <div className="callout mono small" aria-live="polite">{m.answerText}</div>}
    </div>
  );
}

/* open = row indexes whose blank cell is still an input; cells after it (and
   blank.hide) would give the answer away, so they stay hidden too */
function StepTable({ m, open = [], vals = {}, checked, setVal }) {
  return (
    <div className="table-scroll">
      <table className="trace">
        <thead><tr>{m.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
        <tbody>{m.rows.map((r, i) => {
          const blank = open.includes(i) ? r.blank : null;
          return (
            <tr key={i}>{r.cells.map((c, j) => (
              <td key={j} className="mono">
                {blank && j === blank.col ? (
                  <span className="fd-blank">
                    <input type="text" value={vals[i] ?? ''} onChange={e => setVal(i, e.target.value)}
                      placeholder={blank.num !== undefined ? 'number' : 'attrs'}
                      aria-label={`Row ${i + 1}: ${m.columns[j]}`} />
                    {checked && vals[i] && <span className="bad-text" role="img" aria-label="wrong">✗</span>}
                  </span>
                ) : blank && (j > blank.col || blank.hide?.includes(j)) ? <span className="dim">?</span> : c}
              </td>))}
            </tr>);
        })}</tbody>
      </table>
    </div>
  );
}

function Practice({ m, qKey, stem, ctx, A, F }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const saved = ctx.store.mcq?.[qKey];
  const locked = saved !== undefined;
  const ok = locked && checkAnswer(m, saved, A, F);
  const submit = v => {
    if (locked) return;
    ctx.store.actions.recordAnswer(ctx.lessonId, qKey, v);
    if (!checkAnswer(m, v, A, F)) logMistake(ctx.lessonId, `${stem}: ${m.prompt}`, m.answerText);
  };
  const send = () => {
    const r = parseAnswer(m, text, A);
    setErr(r.error || '');
    if (!r.error) submit(r.value);
  };
  return (
    <div className="fd-task">
      <div className="fd-task-title">{m.title}</div>
      <p className="quiz-q">{m.prompt}</p>
      {m.input === 'choice' ? (
        <div role="group" aria-label={m.prompt}>
          {m.choices.map((c, i) => (
            <button key={c} type="button" aria-pressed={saved === i} aria-disabled={locked} onClick={() => submit(i)}
              className={'quiz-opt' + (locked ? (i === m.answer ? ' correct' : i === saved ? ' wrong' : '') + ' locked' : '')}>
              <span className="k">{String.fromCharCode(65 + i)}</span><span>{c}</span>
            </button>))}
        </div>
      ) : locked ? <div className="mono small">Your answer: {showValue(m, saved)}</div> : (
        <div className="fd-answer">
          <input type="text" className="mono" value={text} placeholder={m.placeholder} aria-label={m.prompt}
            onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button type="button" className="reveal-btn" onClick={send}>Check</button>
        </div>)}
      {err && <div className="bad-text small" role="alert">{err}</div>}
      <div aria-live="polite">{locked && <>
        <div className={'verdict ' + (ok ? 'ok' : 'bad')}>{ok ? 'CORRECT' : 'INCORRECT'}</div>
        <div className="small mono">{m.answerText}</div>
        {m.note && <p className="dim small">{m.note}</p>}
        <StepTable m={m} />
      </>}</div>
    </div>
  );
}
