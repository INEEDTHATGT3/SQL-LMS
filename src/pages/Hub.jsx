import { useState } from 'react';
import { Link } from 'react-router-dom';
import { moduleProgress } from '../lib/content.js';
import { MODULES, LEVEL_META, LEVEL_NUMS, TOTAL_LESSONS, SUBJECT, moduleById } from '../lib/subject.js';
import { useProgress, dueToday, streak } from '../lib/progress.js';
import { weakestModules } from '../lib/analytics.js';
import SearchBox from '../components/SearchBox.jsx';
import ChangelogFeed from '../components/ChangelogFeed.jsx';
import StreakStrip from '../components/StreakStrip.jsx';
import MistakeLog from '../components/MistakeLog.jsx';
import WeaknessRadar from '../components/WeaknessRadar.jsx';
import Stats from './Stats.jsx';

const done = (p, modId, L) => !!p.lessons[`${modId}_L${L}`]?.complete;

/* soft gate: a module is "ready" once every prerequisite has its L1 done */
function missingDeps(p, mod) {
  return (mod.deps || []).filter(d => !done(p, d, LEVEL_NUMS[0]));
}
function nextUp(p) {
  for (const L of LEVEL_NUMS)
    for (const mod of MODULES)
      if (!done(p, mod.id, L) && !missingDeps(p, mod).length) return { mod, L };
  return null;
}

export default function Hub() {
  document.body.dataset.level = String(LEVEL_NUMS[0]);
  const progress = useProgress();
  const [showStats, setShowStats] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);

  const totalDone = Object.values(progress.lessons).filter(l => l.complete).length;
  const dueN = dueToday(progress.srs);
  const streakN = streak(progress);
  const openMistakes = (progress.mistakes || []).filter(m => !m.resolved).length;
  const next = nextUp(progress);
  const weak = weakestModules(progress, 4, 1)[0];

  return (<>
    <div className="hero">
      <div className="badge-row">
        <span className="badge">LAYERED STUDY SYSTEM</span>
        <span className="badge green">{totalDone} / {TOTAL_LESSONS} complete</span>
        <span className="badge blue">🔥 {streakN}-day streak</span>
        {dueN > 0 && <Link to="/review" className="badge">⏰ {dueN} due for review</Link>}
        {openMistakes > 0 && (
          <button className="badge badge-red" onClick={() => setShowMistakes(s => !s)}>✗ {openMistakes} mistakes</button>
        )}
      </div>
      <h1>{SUBJECT.name} <span>Hub</span></h1>
      <div className="promise">{SUBJECT.hubPromise}</div>
    </div>

    <div className="container">
      <StreakStrip />

      <div className="card mb">
        <div className="card-title">TODAY’S PLAN</div>
        <ul className="notes">
          <li>
            {dueN > 0
              ? <><Link to="/review">Review {dueN} due card{dueN > 1 ? 's' : ''}</Link> — spaced repetition first</>
              : 'Reviews: queue clear ✓'}
          </li>
          {next && (
            <li>Next new material:{' '}
              <Link to={`/lesson/${next.mod.id}/${next.L}`}>M{next.mod.num} {next.mod.title} — L{next.L}</Link>
            </li>
          )}
          {weak && (
            <li className="warn-text">
              Weakness drill: <Link to={`/lesson/${weak.mod.id}/${weakestLevel(progress, weak.mod.id)}`}>{weak.mod.title}</Link>
              {' '}— accuracy {weak.pct}% ({weak.right}/{weak.total})
            </li>
          )}
          {openMistakes > 0 && <li className="warn-text">Clear {openMistakes} mistake{openMistakes > 1 ? 's' : ''} (they also appear in review)</li>}
        </ul>
      </div>

      <WeaknessRadar progress={progress} />

      <div className="action-row">
        <Link to="/review" className="level-pill">Review queue</Link>
        <Link to="/interview" className="level-pill">🎤 Mock interview</Link>
        <Link to="/sprint" className="level-pill">⏱ Timed sprint</Link>
        <button className="reveal-btn" aria-expanded={showStats} onClick={() => setShowStats(s => !s)}>
          {showStats ? 'Hide stats' : 'Stats dashboard'}
        </button>
        <button className="reveal-btn" aria-expanded={showMistakes} onClick={() => setShowMistakes(s => !s)}>
          {showMistakes ? 'Hide mistake log' : `Mistake log${openMistakes ? ` (${openMistakes})` : ''}`}
        </button>
      </div>

      {showStats && <Stats onClose={() => setShowStats(false)} />}
      {showMistakes && <MistakeLog />}

      <SearchBox />
      <ChangelogFeed />

      {MODULES.map(mod => {
        const prog = moduleProgress(mod.id);
        const missing = missingDeps(progress, mod);
        return (
          <div key={mod.id} className="card mb">
            <div className="card-title">
              MODULE {mod.num} · {prog.done === LEVEL_NUMS.length ? 'COMPLETE' : prog.done > 0 ? 'IN PROGRESS' : missing.length ? 'LOCKED (SOFT)' : 'READY'}
            </div>
            <div className="mod-title">{mod.title}</div>
            <div className="mod-sub">{mod.subtitle}</div>
            {missing.length > 0 && prog.done === 0 && (
              <div className="mod-sub warn-text">
                Finish L1 of {missing.map(d => moduleById(d)?.title || d).join(', ')} first (you can still open it).
              </div>
            )}
            <div className="level-strip">
              {LEVEL_NUMS.map(L => (
                <Link key={L} to={`/lesson/${mod.id}/${L}`} className={'level-pill' + (prog.perLevel[L] ? ' done' : '')}>
                  L{L} {LEVEL_META[L].name.split(' ')[0]}
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      <p className="fineprint">PROGRESS STORED LOCALLY · EXPORT FROM STATS TO BACK UP</p>
    </div>
  </>);
}

/* lowest level the learner has actually answered questions in, else L1 */
function weakestLevel(p, modId) {
  return LEVEL_NUMS.find(L => Object.keys(p.lessons[`${modId}_L${L}`]?.mcq || {}).length) || LEVEL_NUMS[0];
}
