import { Link } from 'react-router-dom';
import { useProgress, srsActions } from '../lib/progress.js';
import { lessonPath } from '../lib/subject.js';
import { MD } from './md.jsx';

/* Wrong answers land here automatically and are re-asked in review;
   rating one Good/Easy there (or pressing Resolved) closes it. */
export default function MistakeLog() {
  const p = useProgress();
  const open = (p.mistakes || []).filter(m => !m.resolved);
  const done = (p.mistakes || []).length - open.length;
  return (
    <div className="card mb">
      <div className="card-title">MISTAKE LOG ({open.length} open)</div>
      {open.length === 0 && <p className="dim small">No open mistakes. Wrong answers land here automatically.</p>}
      {open.map(m => (
        <div key={m.id} className="mistake-row">
          <div className="row-between">
            <span><MD text={m.q} /></span>
            <button className="reveal-btn" onClick={() => srsActions.resolveMistake(m.id)}>Resolved</button>
          </div>
          <div className="dim small mono">
            correct: <MD text={m.correctAnswer} /> · <Link to={lessonPath(m.lessonId)}>revisit lesson</Link>
          </div>
        </div>
      ))}
      {done > 0 && <p className="ok small">{done} resolved ✓</p>}
    </div>
  );
}
