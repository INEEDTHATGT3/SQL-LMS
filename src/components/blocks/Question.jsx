/* question: one graded item (mcq | msq | nat | order | match), one attempt.
   Stored as recordAnswer(lessonId, qkey(q), value) in the shape grade.js
   isCorrect expects, so scripts/gen.mjs answer keys grade it identically. */
import { useId, useState } from 'react';
import { qkey } from '../../lib/qkey.js';
import { optionOrder, shuffledOrder } from '../../lib/grade.js';
import { logMistake } from '../../lib/progress.js';
import { checkAnswer, correctText, parseNum, sourceText } from '../../engines/recall.js';
import { MD } from '../md.jsx';
import './Question.css';

const KIND = { mcq: 'MCQ', msq: 'MSQ · select all that apply', nat: 'NAT · numerical', order: 'ORDER', match: 'MATCH' };
const plain = s => String(s ?? '').replace(/[`*]/g, '');

export default function Question({ b, ctx }) {
  const qKey = qkey(b.q);
  const saved = ctx.store.mcq?.[qKey];
  const locked = saved !== undefined;
  const ok = locked && checkAnswer(b, saved);
  const stemId = useId();
  const submit = v => {
    if (locked) return;
    ctx.store.actions.recordAnswer(ctx.lessonId, qKey, v);
    if (!checkAnswer(b, v)) logMistake(ctx.lessonId, b.q, correctText(b));
  };
  const earned = !locked || b.marks == null ? '' : ok ? ` · +${b.marks}` : b.negative ? ` · −${b.negative}` : ' · 0';
  return (
    <div className="quiz-card">
      <div className="badge-row">
        <span className="badge">{KIND[b.kind] || b.kind}</span>
        {b.marks != null && <span className="badge blue">+{b.marks}{b.negative ? ` / −${b.negative}` : ''}</span>}
        {(b.tags || []).map(t => <span key={t} className="dim small mono">#{t}</span>)}
      </div>
      <div className="quiz-q" id={stemId}><MD text={b.q} /></div>
      <AnswerInput item={b} seed={qKey} saved={saved} onSubmit={submit} labelId={stemId} />
      <div aria-live="polite">
        {locked && <>
          <div className={'verdict ' + (ok ? 'ok' : 'bad')}>{ok ? 'CORRECT' : 'INCORRECT'}{earned}</div>
          {!ok && b.kind !== 'mcq' && b.kind !== 'msq' && <div className="small">Correct answer: <MD text={correctText(b)} /></div>}
          {b.explain && <div className="quiz-explain"><MD text={b.explain} /></div>}
        </>}
      </div>
      <Source src={b.source} />
    </div>
  );
}

export function Source({ src }) {
  const text = sourceText(src);
  if (!text) return null;
  const url = /^https?:\/\//.test(src.url || '') ? src.url : null;
  return (
    <div className="dim small mono q-src">
      {url ? <a href={url} target="_blank" rel="noopener noreferrer">{text} ↗</a> : text}
    </div>
  );
}

/* input for one item; also used by predict (which adds kind 'text'). A stored
   `saved` value means locked: the input then shows what was submitted. */
export function AnswerInput({ item, seed, saved, onSubmit, labelId }) {
  const p = { item, seed, saved, locked: saved !== undefined, onSubmit, labelId };
  switch (item.kind || 'mcq') {
    case 'mcq': return <Mcq {...p} />;
    case 'msq': return <Msq {...p} />;
    case 'nat': case 'text': return <Free {...p} />;
    case 'order': return <Order {...p} />;
    case 'match': return <Match {...p} />;
    default: return <div className="callout warn">Unknown question kind “{item.kind}”.</div>;
  }
}

function Mcq({ item, seed, saved, locked, onSubmit, labelId }) {
  const order = optionOrder(item.options, seed);
  return (
    <div role="group" aria-labelledby={labelId}>
      {order.map((oi, pos) => {
        const cls = !locked ? '' : oi === item.answer ? ' correct' : oi === saved ? ' wrong' : '';
        return (
          <button key={oi} type="button" className={'quiz-opt' + cls + (locked ? ' locked' : '')}
            onClick={() => !locked && onSubmit(oi)} aria-disabled={locked} aria-pressed={saved === oi}>
            <span className="k">{String.fromCharCode(65 + pos)}</span><span><MD text={item.options[oi]} /></span>
            {locked && oi === item.answer && <span className="sr-only"> (correct answer)</span>}
          </button>);
      })}
    </div>
  );
}

function Msq({ item, seed, saved, locked, onSubmit, labelId }) {
  const [pick, setPick] = useState([]);
  const chosen = locked ? [].concat(saved) : pick;
  const toggle = oi => setPick(p => (p.includes(oi) ? p.filter(x => x !== oi) : [...p, oi]));
  return (<>
    <div role="group" aria-labelledby={labelId}>
      {optionOrder(item.options, seed).map(oi => {
        const on = chosen.includes(oi), right = item.answer.includes(oi);
        const cls = locked ? (right ? ' correct' : on ? ' wrong' : '') : on ? ' on' : '';
        return (
          <label key={oi} className={'quiz-opt' + cls + (locked ? ' locked' : '')}>
            <input type="checkbox" checked={on} disabled={locked} onChange={() => toggle(oi)} />
            <span className="grow"><MD text={item.options[oi]} /></span>
            {locked && right && !on && <span className="small mono">missed</span>}
            {locked && on && !right && <span className="small mono">wrong pick</span>}
          </label>);
      })}
    </div>
    {!locked && (
      <div className="action-row">
        <button type="button" className="reveal-btn" disabled={!pick.length}
          onClick={() => onSubmit([...pick].sort((x, y) => x - y))}>Submit</button>
        <span className="dim small">all-or-nothing</span>
      </div>)}
  </>);
}

function Free({ item, saved, locked, onSubmit, labelId }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const nat = item.kind === 'nat';
  const go = e => {
    e.preventDefault();
    if (locked || !v.trim()) return;
    if (!nat) return onSubmit(v.trim());
    const n = parseNum(v);
    if (!Number.isFinite(n)) return setErr('Enter a number, e.g. 42 or 0.25');
    onSubmit(n);
  };
  return (
    <form className="action-row" onSubmit={go}>
      <input type="text" inputMode={nat ? 'decimal' : 'text'} autoComplete="off" spellCheck={!nat}
        className={nat ? 'q-input' : 'q-input wide'} aria-labelledby={labelId} aria-invalid={!!err}
        value={locked ? String(saved) : v} readOnly={locked}
        onChange={e => { setV(e.target.value); setErr(''); }}
        placeholder={nat ? 'number' : 'your answer'} />
      {item.unit && <span className="dim mono small">{item.unit}</span>}
      {!locked && <button type="submit" className="reveal-btn" disabled={!v.trim()}>Submit</button>}
      {err && <span className="bad-text small" role="alert">{err}</span>}
    </form>
  );
}

function Order({ item, seed, saved, locked, onSubmit, labelId }) {
  const n = item.options.length;
  const [arr, setArr] = useState(() => {
    const o = shuffledOrder(n, seed);   // never start already solved
    return o.every((x, i) => x === item.answer[i]) ? [...o.slice(1), o[0]] : o;
  });
  const [msg, setMsg] = useState('');
  const cur = locked ? saved : arr;
  const move = (i, d) => {
    const j = i + d;
    if (locked || j < 0 || j >= n) return;
    const x = [...arr];
    [x[i], x[j]] = [x[j], x[i]];
    setArr(x);
    setMsg(`${plain(item.options[arr[i]])} moved to position ${j + 1} of ${n}`);
  };
  return (<>
    <ol className="q-order" aria-labelledby={labelId}>
      {cur.map((oi, i) => {
        const cls = locked ? (oi === item.answer[i] ? ' correct' : ' wrong') : '';
        const name = plain(item.options[oi]);
        return (
          <li key={oi} className={'quiz-opt locked' + cls}>
            <span className="k">{i + 1}</span>
            <span className="grow"><MD text={item.options[oi]} /></span>
            {!locked && <span className="q-move">
              <button type="button" className="reveal-btn" aria-label={`Move ${name} up`}
                aria-disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="reveal-btn" aria-label={`Move ${name} down`}
                aria-disabled={i === n - 1} onClick={() => move(i, 1)}>↓</button>
            </span>}
          </li>);
      })}
    </ol>
    <div className="sr-only" aria-live="polite">{msg}</div>
    {!locked && <div className="action-row">
      <button type="button" className="reveal-btn" onClick={() => onSubmit(arr)}>Submit order</button>
    </div>}
  </>);
}

function Match({ item, seed, saved, locked, onSubmit, labelId }) {
  const L = item.left || [], R = item.right || [];
  const [sel, setSel] = useState(() => L.map(() => -1));
  const cur = locked ? saved : sel;
  const rOrder = shuffledOrder(R.length, seed);
  const base = useId();
  return (<>
    <div role="group" aria-labelledby={labelId}>
      {L.map((l, i) => {
        const right = cur[i] === item.answer[i];
        return (
          <div key={i} className="q-match-row">
            <label htmlFor={`${base}-${i}`}><MD text={l} /></label>
            <select id={`${base}-${i}`} value={cur[i] ?? -1} disabled={locked}
              onChange={e => { const v = Number(e.target.value); setSel(s => s.map((x, k) => (k === i ? v : x))); }}>
              <option value={-1}>— choose —</option>
              {rOrder.map(ri => <option key={ri} value={ri}>{plain(R[ri])}</option>)}
            </select>
            {locked && <span className={'q-mark ' + (right ? 'ok' : 'bad-text')}>
              {right ? '✓ correct' : `✗ should be ${plain(R[item.answer[i]])}`}
            </span>}
          </div>);
      })}
    </div>
    {!locked && <div className="action-row">
      <button type="button" className="reveal-btn" disabled={sel.includes(-1)} onClick={() => onSubmit(sel)}>Submit</button>
    </div>}
  </>);
}
