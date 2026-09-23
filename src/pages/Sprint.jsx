import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProgress, actionsExt, actions, getSessions } from '../lib/progress.js';
import { buildPool, shuffle, fmtClock } from '../lib/pool.js';
import { Block } from '../components/blocks.jsx';
import { MD } from '../components/md.jsx';
import PoolFilters from '../components/PoolFilters.jsx';

/* Timed sprint: pick pool -> countdown -> solve (in-page for runnable
   problems, else via the platform link) -> mark outcome -> report. */
const DURATIONS = [15, 30, 45];

export default function Sprint() {
  const p = useProgress();
  const [mod, setMod] = useState('all');
  const [tier, setTier] = useState('any');
  const [minutes, setMinutes] = useState(30);
  const [poolSize, setPoolSize] = useState(null);
  const [queue, setQueue] = useState(null);
  const [building, setBuilding] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [outcomes, setOutcomes] = useState({});   // pid -> solved|failed
  const outcomesLive = useRef(outcomes);
  outcomesLive.current = outcomes;
  const [active, setActive] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const prev = document.body.dataset.level;
    document.body.dataset.level = '3';
    return () => { document.body.dataset.level = prev || '1'; };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining(r => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (running && remaining === 0) finish(); }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setBuilding(true);
    const pool = await buildPool(mod, tier);
    setPoolSize(pool.length);
    setBuilding(false);
    if (!pool.length) return;
    setQueue(shuffle(pool).slice(0, Math.max(4, Math.floor(minutes / 6))));
    setOutcomes({}); setActive(0); setFinished(false);
    setRemaining(minutes * 60); setRunning(true);
  }

  function mark(pr, outcome) {
    const next = { ...outcomesLive.current, [pr.id]: outcome };
    setOutcomes(next);
    if (outcome === 'solved') actions.setSolved(pr.lessonRef, pr.id, true);
    // advance to the next problem without an outcome
    for (let step = 1; step <= queue.length; step++) {
      const j = (active + step) % queue.length;
      if (!next[queue[j].id]) { setActive(j); return; }
    }
  }

  function finish() {
    setRunning(false); setFinished(true);
    const live = outcomesLive.current;
    actionsExt.addSession({ type: 'sprint', at: Date.now(), minutes,
      attempted: Object.keys(live).length, solved: Object.values(live).filter(o => o === 'solved').length });
  }

  if (!queue) return (
    <div className="container narrow pt">
      <Link to="/" className="badge">← HUB</Link> <span className="badge">TIMED SPRINT</span>
      <h1 className="page-title">Pressure training</h1>
      <p className="dim">Countdown runs. Runnable problems are graded in-page; others link to their platform — mark the outcome yourself.</p>
      {getSessions(p).some(s => s.type === 'sprint') && (
        <div className="card mb">
          <div className="card-title">RECENT SPRINTS</div>
          {getSessions(p).filter(s => s.type === 'sprint').slice(0, 5).map((s, i) => (
            <div key={i} className="session-row">
              <span>{new Date(s.at).toLocaleDateString()}</span>
              <span className="mono">{s.solved}/{s.attempted} in {s.minutes}m</span>
            </div>
          ))}
        </div>
      )}
      <div className="card form-grid">
        <PoolFilters mod={mod} setMod={setMod} tier={tier} setTier={setTier} />
        <div className="field">
          <span className="card-title">DURATION</span>
          <div className="action-row">
            {DURATIONS.map(d => (
              <button key={d} className={'reveal-btn' + (minutes === d ? ' on' : '')} aria-pressed={minutes === d}
                onClick={() => setMinutes(d)}>{d} min</button>
            ))}
          </div>
        </div>
        <button className="reveal-btn big-btn" disabled={building} onClick={start}>{building ? 'Building pool…' : 'Start sprint'}</button>
        <div aria-live="polite" className="dim small">{poolSize === 0 && 'No problems match these filters.'}</div>
      </div>
    </div>
  );

  if (finished) {
    const solved = Object.values(outcomes).filter(o => o === 'solved').length;
    return (
      <div className="container narrow pt center">
        <h1 className={solved >= queue.length / 2 ? 'ok' : 'warn-text'}>{solved} solved / {queue.length}</h1>
        <p className="dim">{minutes} minute sprint</p>
        <div className="card mb left">
          {queue.map(pr => (
            <div key={pr.id} className="session-row">
              <span><MD text={pr.title} /></span>
              <span className={'mono small ' + (outcomes[pr.id] === 'solved' ? 'ok' : outcomes[pr.id] === 'failed' ? 'bad-text' : 'dim')}>
                {outcomes[pr.id] || 'unattempted'}
              </span>
            </div>
          ))}
        </div>
        <div className="action-row center-row">
          <button className="reveal-btn" onClick={() => setQueue(null)}>New sprint</button>
          <Link to="/" className="level-pill">← Hub</Link>
        </div>
      </div>
    );
  }

  const cur = queue[active];
  return (
    <div className="container pt">
      <div className="row-between mb">
        <span className="badge">SPRINT · {active + 1}/{queue.length}</span>
        <span className={'clock' + (remaining < 120 ? ' bad-text' : '')}>{fmtClock(remaining)}</span>
      </div>
      <div className="action-row">
        {queue.map((pr, i) => (
          <button key={pr.id} onClick={() => setActive(i)}
            className={'level-pill' + (i === active ? ' current' : '') + (outcomes[pr.id] ? ' faded' : '')}>
            {i + 1}{outcomes[pr.id] === 'solved' ? ' ✓' : outcomes[pr.id] === 'failed' ? ' ✗' : ''}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="prob-name"><MD text={cur.title} /></div>
        <div className="prob-meta">{[cur.platform, cur.moduleTitle, cur.patterns?.join(', ')].filter(Boolean).join(' · ')}</div>
        {cur.statement && <p><MD text={cur.statement} /></p>}
        {(cur.hints || []).slice(0, 1).map((h, i) => <div key={i} className="callout blue">Hint: <MD text={h} /></div>)}
        {cur.exercise && <Block key={cur.id} b={{ ...cur.exercise, type: 'sql-exercise', id: cur.id, embedded: true }}
          ctx={{ lessonId: cur.lessonRef, store: { mcq: {}, solved: {}, blocks: {}, actions: { ...actions, setSolved: () => mark(cur, 'solved') } } }} />}
        <div className="action-row">
          <button className="reveal-btn rate-ok" onClick={() => mark(cur, 'solved')}>✓ Solved</button>
          <button className="reveal-btn rate-bad" onClick={() => mark(cur, 'failed')}>✗ Failed</button>
          {cur.url && <a className="level-pill" target="_blank" rel="noopener noreferrer" href={cur.url}>Open on {cur.platform} ↗</a>}
          {active < queue.length - 1 && <button className="reveal-btn" onClick={() => setActive(i => i + 1)}>Skip →</button>}
        </div>
      </div>
      <button className="reveal-btn mt" onClick={finish}>End sprint &amp; see report</button>
    </div>
  );
}
