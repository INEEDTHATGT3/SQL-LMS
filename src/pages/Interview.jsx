import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { actionsExt, logMistake, actions } from '../lib/progress.js';
import { buildPool, shuffle, fmtClock } from '../lib/pool.js';
import { Block, CodeBlock } from '../components/blocks.jsx';
import { MD } from '../components/md.jsx';
import PoolFilters from '../components/PoolFilters.jsx';

/* Mock interview room: statement (clock running, hints on request)
   -> reference solution + follow-up chain one at a time -> self-rate -> next.
   "Solved clean" means no hints, which the UI checks. */
const RATES = [['Solved clean', 'clean', 'ok'], ['Solved w/ hints', 'hinted', 'warn'], ['Failed', 'failed', 'bad']];

export default function Interview() {
  useEffect(() => {
    const prev = document.body.dataset.level;
    document.body.dataset.level = '3';
    return () => { document.body.dataset.level = prev || '1'; };
  }, []);

  const [mod, setMod] = useState('all');
  const [tier, setTier] = useState('any');
  const [count, setCount] = useState(3);
  const [poolSize, setPoolSize] = useState(null);
  const [building, setBuilding] = useState(false);
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('statement');   // statement | solution
  const [fuStep, setFu] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [results, setResults] = useState([]);
  const [report, setReport] = useState(null);
  const [secs, setSecs] = useState(0);
  const startedAt = useRef(0);

  const cur = queue?.[idx];
  const live = !!cur && !report;

  useEffect(() => {
    if (!live) return;
    setSecs(0);
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [live, idx]);

  async function start() {
    setBuilding(true);
    const pool = await buildPool(mod, tier);
    setPoolSize(pool.length);
    if (pool.length) {
      setQueue(shuffle(pool).slice(0, count));
      setIdx(0); setPhase('statement'); setFu(0); setHintsUsed(0);
      setResults([]); setReport(null); startedAt.current = Date.now();
    }
    setBuilding(false);
  }

  function rate(outcome) {
    if (outcome === 'failed') logMistake(cur.lessonRef, `Interview: ${cur.title}`, cur.url || 'see lesson');
    if (outcome !== 'failed') actions.setSolved(cur.lessonRef, cur.id, true);
    // build the report from `next`, not `results` - the state update has not applied yet
    const next = [...results, { title: cur.title, outcome, secs, hints: hintsUsed }];
    setResults(next);
    if (idx + 1 < queue.length) { setIdx(i => i + 1); setPhase('statement'); setFu(0); setHintsUsed(0); return; }
    const clean = next.filter(r => r.outcome === 'clean').length;
    const minutes = Math.round((Date.now() - startedAt.current) / 60000);
    actionsExt.addSession({ type: 'interview', at: Date.now(), count: next.length, clean, minutes,
      results: next.map(r => ({ title: r.title, outcome: r.outcome })) });
    setReport({ rows: next, clean, minutes });
  }

  if (report) return (
    <div className="container narrow pt">
      <div className="center">
        <span className="badge">DEBRIEF</span>
        <h1 className={report.clean === report.rows.length ? 'ok' : 'warn-text'}>{report.clean}/{report.rows.length} solved clean</h1>
        <p className="dim mono small">{report.minutes} min · {report.rows.reduce((a, r) => a + r.hints, 0)} hints taken</p>
      </div>
      <div className="card mb">
        {report.rows.map((r, i) => (
          <div key={i} className="session-row">
            <span className="grow"><MD text={r.title} /></span>
            <span className="prob-meta">{fmtClock(r.secs)}{r.hints ? ` · ${r.hints}h` : ''}</span>
            <span className={'mono small ' + (r.outcome === 'clean' ? 'ok' : r.outcome === 'hinted' ? 'warn-text' : 'bad-text')}>{r.outcome}</span>
          </div>
        ))}
      </div>
      <div className="action-row center-row">
        <button className="reveal-btn" onClick={() => { setReport(null); setQueue(null); }}>New interview</button>
        <Link to="/" className="level-pill">← Hub</Link>
      </div>
    </div>
  );

  if (!queue) return (
    <div className="container narrow pt">
      <Link to="/" className="badge">← HUB</Link> <span className="badge">MOCK INTERVIEW</span>
      <h1 className="page-title">Simulate the room</h1>
      <p className="dim">Statement first, clock running. Hints cost you the “clean” rating. Then compare against
        the reference solution and walk the follow-up chain. Failed problems land in your mistake log.</p>
      <div className="card form-grid">
        <PoolFilters mod={mod} setMod={setMod} tier={tier} setTier={setTier} />
        <label className="field">
          <span className="card-title">PROBLEMS: {count}</span>
          <input type="range" min="1" max="8" value={count} aria-label={`Number of problems: ${count}`}
            onChange={e => setCount(+e.target.value)} />
        </label>
        <button className="reveal-btn big-btn" disabled={building} onClick={start}>
          {building ? 'Loading pool…' : 'Start interview'}
        </button>
        <div aria-live="polite" className="dim small">
          {poolSize === 0 && !building && 'No problems match these filters — widen the module or tier.'}
        </div>
      </div>
    </div>
  );

  const followups = cur.followups || [];
  const hints = cur.hints || [];
  return (
    <div className="container pt">
      <div className="row-between mb">
        <span className="badge">INTERVIEW · Q{idx + 1}/{queue.length}</span>
        <span className={'clock' + (secs > 1800 ? ' bad-text' : '')}><span className="sr-only">Elapsed </span>{fmtClock(secs)}</span>
        <span className="badge blue">L{cur.tier ?? cur.level}</span>
      </div>
      <h2 className="page-title"><MD text={cur.title} /></h2>
      <div className="prob-meta mb">
        {cur.moduleTitle}{cur.platform ? ' · ' + cur.platform : ''}{cur.patterns?.length ? ' · ' + cur.patterns.join(', ') : ''}
        {cur.url && <> · <a href={cur.url} target="_blank" rel="noopener noreferrer">open ↗</a></>}
      </div>
      {cur.statement && <p><MD text={cur.statement} /></p>}
      {cur.exercise && <Block b={{ ...cur.exercise, type: 'sql-exercise', id: cur.id, embedded: true }}
        ctx={{ lessonId: cur.lessonRef, store: { mcq: {}, solved: {}, blocks: {}, actions } }} />}

      {phase === 'statement' && <>
        {hints.slice(0, hintsUsed).map((h, i) => <div key={i} className="callout blue">Hint {i + 1}: <MD text={h} /></div>)}
        <div className="action-row">
          {hintsUsed < hints.length && (
            <button className="reveal-btn" onClick={() => setHintsUsed(n => n + 1)}>Request hint ({hintsUsed + 1}/{hints.length})</button>
          )}
          <button className="reveal-btn" onClick={() => setPhase('solution')}>Attempt done — show solution</button>
          <button className="reveal-btn rate-bad" onClick={() => setPhase('solution')}>Give up</button>
        </div>
      </>}

      {phase === 'solution' && <>
        <p className="card-title">REFERENCE SOLUTION</p>
        {cur.solutionCode ? <CodeBlock b={cur.solutionCode} />
          : cur.exercise?.solution ? <CodeBlock b={{ code: cur.exercise.solution }} />
          : <div className="callout warn">No reference solution authored yet{cur.url ? ' — check the platform’s discussion tab.' : '.'}</div>}
        {cur.complexity && <p className="prob-meta">{cur.complexity}</p>}

        {followups.length > 0 && <>
          <p className="card-title">FOLLOW-UP CHAIN</p>
          {followups.slice(0, fuStep).map((f, i) => (
            <div key={i} className="followup-chain">
              <div className="followup-q"><MD text={f.q} /></div>
              <div className="followup-a"><MD text={f.a} /></div>
            </div>
          ))}
          {fuStep < followups.length && (
            <button className="reveal-btn" onClick={() => setFu(s => s + 1)}>Next follow-up ({fuStep + 1}/{followups.length})</button>
          )}
        </>}

        {fuStep >= followups.length && (
          <div className="mt">
            <p className="card-title">SELF-RATE THIS PROBLEM</p>
            {hintsUsed > 0 && <p className="dim small">You took {hintsUsed} hint{hintsUsed > 1 ? 's' : ''} — that is not a clean solve.</p>}
            <div className="action-row">
              {RATES.map(([label, val, cls]) => (
                <button key={val} className={'reveal-btn rate-' + cls + (val === 'clean' && hintsUsed ? ' faded' : '')}
                  onClick={() => rate(val)}>{label}</button>
              ))}
            </div>
          </div>
        )}
      </>}
    </div>
  );
}
