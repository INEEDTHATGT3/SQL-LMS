/* Block renderers + registry. Core blocks live here; heavier or newer block
   types are lazy components under ./blocks/ so they only load when a lesson
   uses them (PGlite, mermaid, diagram engines stay out of the main chunk). */
import { Component, lazy, Suspense, useState } from 'react';
import { qkey } from '../lib/qkey.js';
import { optionOrder } from '../lib/grade.js';
import { logMistake } from '../lib/progress.js';
import { LANGS } from '../lib/subject.js';
import { useLang, setLang } from '../lib/lang.js';
import { MD, Code } from './md.jsx';
import './blocks/Problem.css';

export function Prose({ b }) { return <p><MD text={b.md} /></p>; }
export function Heading({ b }) { return <h3><MD text={b.text} /></h3>; }
export function Mantra({ b }) { return <div className="mantra"><MD text={b.md} /></div>; }
export function Callout({ b }) { return <div className={`callout ${b.tone || ''}`}><MD text={b.md} /></div>; }
export function ListB({ b }) { return <ul className="notes">{b.items.map((x, i) => <li key={i}><MD text={x} /></li>)}</ul>; }

/* ---------- code: one tab per language the block actually provides ---------- */
export function CodeBlock({ b }) {
  const lang = useLang();
  const [open, setOpen] = useState(!b.reveal);
  const avail = LANGS.filter(l => typeof b[l.field] === 'string' && b[l.field].trim());
  const active = avail.find(l => l.id === lang) || avail[0];
  if (!active) return null;
  return (
    <div>
      <div className="code-label">
        <span>{b.label || ''}</span>
        {avail.length > 1 && (
          <span className="lang-switch" role="group" aria-label="Code language">
            {avail.map(l => (
              <button key={l.id} type="button" className={l.id === active.id ? 'on' : ''}
                aria-pressed={l.id === active.id} onClick={() => setLang(l.id)}>{l.label}</button>
            ))}
          </span>
        )}
      </div>
      {open
        ? <Code code={b[active.field]} lang={active.highlight} />
        : <button className="reveal-btn" onClick={() => setOpen(true)}>Reveal solution</button>}
    </div>
  );
}

/* ---------- trace / visual / compare ---------- */
export function Trace({ b }) {
  return (<>
    <h3><MD text={b.title} /></h3>
    <div className="table-scroll">
      <table className="trace">
        <thead><tr>{b.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>{b.steps.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}><MD text={String(cell)} /></td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  </>);
}
export function Visual({ b, ctx }) {
  const s = b.spec || {};
  if (b.kind === 'boxes-array')
    return <div className="arr-vis">{(s.values || []).map((v, i) => (
      <div key={i} className={'arr-cell' + ((s.highlight || []).includes(i) ? ' hi' : '')}>
        <div className="arr-val">{String(v)}</div>
        <div className="arr-idx">{s.labels ? s.labels[i] : '[' + i + ']'}</div>
      </div>))}</div>;
  if (b.kind === 'mem-map')
    return <div className="mem-map">{(s.segments || []).map((g, i) => (
      <div key={i} className="mem-seg"><div className="seg-name">{g.name}</div><div className="seg-desc">{g.desc}</div></div>))}</div>;
  if (b.kind === 'flow')
    return <div className="flow-steps">{(s.steps || []).map((st, i) => <div key={i} className="flow-step"><MD text={st} /></div>)}</div>;
  // diagram kinds are full block types; `visual` is just an older spelling
  if (LAZY[b.kind]) return <Block b={{ ...s, ...b, type: b.kind }} ctx={ctx} />;
  return <Unknown what={`visual kind "${b.kind}"`} />;
}
export function Compare({ b }) {
  return <div className="table-scroll"><table className="trace"><thead><tr><th></th><th>{b.leftTitle}</th><th>{b.rightTitle}</th></tr></thead>
    <tbody>{b.rows.map((r, i) => <tr key={i}><td className="row-label">{r.label}</td><td><MD text={r.left} /></td><td><MD text={r.right} /></td></tr>)}</tbody></table></div>;
}

/* ---------- quiz (scored, persisted, options shuffled per question) ---------- */
export function QuizBlock({ lessonId, b, store }) {
  return (b.items || []).map((it, qi) => (
    <Mcq key={qi} lessonId={lessonId} item={it} store={store} />
  ));
}
export function Mcq({ lessonId, item, store, logWrong = true }) {
  const qKey = qkey(item.q);
  const saved = store.mcq?.[qKey];
  const locked = saved !== undefined;
  const order = optionOrder(item.options, qKey);
  const stemId = `qstem-${lessonId}-${qKey}`;
  const pick = i => {
    if (locked) return;
    store.actions.recordAnswer(lessonId, qKey, i);
    if (logWrong && i !== item.answer) logMistake(lessonId, item.q, item.options[item.answer]);
  };
  return (
    <div className="quiz-card">
      <div className="quiz-q" id={stemId}><MD text={item.q} /></div>
      <div role="group" aria-labelledby={stemId}>
        {order.map((oi, pos) => {
          const cls = !locked ? '' : oi === item.answer ? 'correct' : (oi === saved ? 'wrong' : '');
          return (
            <button key={oi} type="button"
              className={'quiz-opt ' + cls + (locked ? ' locked' : '')}
              onClick={() => pick(oi)} aria-disabled={locked} aria-pressed={saved === oi}>
              <span className="k">{String.fromCharCode(65 + pos)}</span><span><MD text={item.options[oi]} /></span>
              {locked && oi === item.answer && <span className="sr-only"> (correct answer)</span>}
            </button>);
        })}
      </div>
      <div aria-live="polite">
        {locked && <>
          <div className="quiz-explain"><MD text={item.explain} /></div>
          <div className={'verdict ' + (saved === item.answer ? 'ok' : 'bad')}>
            {saved === item.answer ? 'CORRECT' : 'INCORRECT'}
          </div>
        </>}
      </div>
    </div>
  );
}

/* ---------- problems ---------- */
export function Problems({ items, lessonId, store }) {
  return <ul className="prob-list">{items.map(p => <Problem key={p.id} p={p} lessonId={lessonId} store={store} />)}</ul>;
}
function Problem({ p, lessonId, store }) {
  const solved = !!store.solved?.[p.id];
  const [hintIdx, setHintIdx] = useState(-1);
  const [solOpen, setSolOpen] = useState(false);
  const [approachShown, setApproachShown] = useState(0);
  const meta = [
    p.platform === 'drill' ? 'drill' : p.platform,
    p.ref && `#${p.ref}`, p.lc && `LC ${p.lc}`, p.difficulty, p.company,
    p.patterns?.length && p.patterns.join(', ')
  ].filter(Boolean).join(' · ');
  return (
    <li className="problem-item" id={`p-${p.id}`}>
      <div className="prob-head">
        <span className={'diff t' + p.tier}>L{p.tier}</span>
        <div>
          <div className="prob-name">
            {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer"><MD text={p.title} /> ↗</a> : <MD text={p.title} />}
          </div>
          <div className="prob-meta">{meta}</div>
        </div>
        <label className="solved-check">
          <input type="checkbox" checked={solved}
            onChange={() => store.actions.toggleSolved(lessonId, p.id)} />
          <span>SOLVED</span>
        </label>
      </div>
      <div className="prob-body">
        {p.statement && <p><MD text={p.statement} /></p>}
        {(p.hints || []).map((h, i) => i <= hintIdx && (
          <div key={i} className="callout blue">Hint {i + 1}: <MD text={h} /></div>
        ))}
        {hintIdx < (p.hints?.length || 0) - 1 && (
          <button className="reveal-btn" onClick={() => setHintIdx(i => i + 1)}>Hint {hintIdx + 2}</button>
        )}
        {p.exercise && (
          <Block b={{ ...p.exercise, type: 'sql-exercise', id: p.id, embedded: true }}
            ctx={{ lessonId, store }} />
        )}
        {p.approaches?.length > 0 && (
          <div className="approach-ladder">
            <div className="card-title">APPROACH LADDER</div>
            {p.approaches.slice(0, approachShown).map((ap, i) => (
              <div key={i} className="approach-step">
                <div className="approach-name">{ap.name}</div>
                {ap.idea && <p><MD text={ap.idea} /></p>}
                {ap.code && <CodeBlock b={ap.code} />}
                {ap.cost && <p className="prob-meta">Cost: {ap.cost}</p>}
                {ap.pitfalls && <div className="callout warn">Pitfalls: <MD text={ap.pitfalls} /></div>}
              </div>
            ))}
            {approachShown < p.approaches.length && (
              <button className="reveal-btn" onClick={() => setApproachShown(n => n + 1)}>
                Reveal {p.approaches[approachShown].name} approach
              </button>
            )}
            {approachShown === p.approaches.length && p.complexity && <p className="prob-meta">{p.complexity}</p>}
          </div>
        )}
        {(!p.approaches || p.approaches.length === 0) && p.solutionCode && !solOpen && (
          <div><button className="reveal-btn" onClick={() => setSolOpen(true)}>Reveal solution</button></div>
        )}
        {(!p.approaches || p.approaches.length === 0) && p.solutionCode && solOpen && <CodeBlock b={p.solutionCode} />}
        {(!p.approaches || p.approaches.length === 0) && p.complexity && solOpen && <p className="prob-meta">{p.complexity}</p>}
        {p.followups?.length > 0 && <Followup chain={p.followups} />}
      </div>
    </li>
  );
}
export function Followup({ chain }) {
  const [openIdx, setOpenIdx] = useState(new Set());
  const toggle = i => setOpenIdx(prev => {
    const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n;
  });
  return (
    <div className="followup-chain">
      <div className="followup-title">INTERVIEWER FOLLOW-UPS</div>
      {chain.map((f, i) => (
        <div key={i} className="followup-item">
          <button type="button" className="followup-q" aria-expanded={openIdx.has(i)} onClick={() => toggle(i)}>↳ <MD text={f.q} /></button>
          {openIdx.has(i) && <div className="followup-a"><MD text={f.a} /></div>}
        </div>
      ))}
    </div>
  );
}

/* one broken block (bad JSON spec, failed chunk load) must not take the whole lesson down */
class BlockBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="callout warn">The {this.props.type} block failed to render ({String(this.state.error.message || this.state.error).slice(0, 120)}). The rest of the lesson still works.</div>;
  }
}

function Unknown({ what }) {
  return <div className="callout warn">Unsupported {what} — update the app or fix the lesson JSON.</div>;
}

/* ---------- lazy block registry ----------
   Each file default-exports a component receiving ({ b, ctx }), where
   ctx = { lessonId, store: { mcq, solved, blocks, actions }, level }. */
const LAZY = {
  'question':         lazy(() => import('./blocks/Question.jsx')),
  'flashcards':       lazy(() => import('./blocks/Flashcards.jsx')),
  'sql-exercise':     lazy(() => import('./blocks/SqlExercise.jsx')),
  'query-trace':      lazy(() => import('./blocks/QueryTrace.jsx')),
  'schedule':         lazy(() => import('./blocks/Schedule.jsx')),
  'fd-stepper':       lazy(() => import('./blocks/FdStepper.jsx')),
  'nf-decomposition': lazy(() => import('./blocks/NfDecomposition.jsx')),
  'er-diagram':       lazy(() => import('./blocks/ErDiagram.jsx')),
  'misconception':    lazy(() => import('./blocks/Misconception.jsx')),
  'predict':          lazy(() => import('./blocks/Predict.jsx')),
  'explain-back':     lazy(() => import('./blocks/ExplainBack.jsx')),
  'table-diff':       lazy(() => import('./blocks/TableDiff.jsx')),
  'schema-diagram':   lazy(() => import('./blocks/SchemaDiagram.jsx')),
  'query-plan':       lazy(() => import('./blocks/QueryPlan.jsx')),
  'dialect-diff':     lazy(() => import('./blocks/DialectDiff.jsx')),
};
export function Block({ b, ctx }) {
  switch (b.type) {
    case 'prose': return <Prose b={b} />;
    case 'heading': return <Heading b={b} />;
    case 'list': return <ListB b={b} />;
    case 'mantra': return <Mantra b={b} />;
    case 'callout': return <Callout b={b} />;
    case 'code': return <CodeBlock b={b} />;
    case 'trace': return <Trace b={b} />;
    case 'visual': return <Visual b={b} ctx={ctx} />;
    case 'compare': return <Compare b={b} />;
    case 'quiz': return <QuizBlock lessonId={ctx.lessonId} b={b} store={ctx.store} />;
    case 'problems': return <Problems items={b.items} lessonId={ctx.lessonId} store={ctx.store} />;
    case 'problem': return <Problems items={[b]} lessonId={ctx.lessonId} store={ctx.store} />;
    case 'followup': return <Followup chain={b.chain} />;
  }
  const C = LAZY[b.type];
  if (!C) return <Unknown what={`block type "${b.type}"`} />;
  return (
    <BlockBoundary type={b.type}>
      <Suspense fallback={<div className="block-loading">loading {b.type}…</div>}>
        <C b={b} ctx={ctx} />
      </Suspense>
    </BlockBoundary>
  );
}
