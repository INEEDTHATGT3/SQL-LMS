import { Link } from 'react-router-dom';
import { weakestModules, overallAccuracy, answeredCount } from '../lib/analytics.js';

/* Quiz accuracy per module, weakest first (min 4 attempts). Derived during render. */
export default function WeaknessRadar({ progress }) {
  const weak = weakestModules(progress, 4, 3);
  const overall = overallAccuracy(progress);
  if (!weak.length) return (
    <div className="card mb">
      <div className="card-title">WEAKNESS RADAR</div>
      <p className="dim small">Answer {Math.max(0, 4 - answeredCount(progress))}+ more questions to activate the radar (needs ≥4 attempts per module).</p>
    </div>
  );
  const tone = pct => pct < 50 ? 'bad' : pct < 75 ? 'warn' : 'ok';
  return (
    <div className="card mb">
      <div className="row-between">
        <div className="card-title">WEAKNESS RADAR</div>
        {overall !== null && <span className="dim small mono">overall accuracy {overall}%</span>}
      </div>
      {weak.map(w => (
        <div key={w.mod.id} className="radar-row">
          <div className="row-between small">
            <Link to={`/lesson/${w.mod.id}/1`}>M{w.mod.num} {w.mod.title}</Link>
            <span className={'mono ' + tone(w.pct) + '-text'}>{w.pct}% ({w.right}/{w.total})</span>
          </div>
          <div className={'meter ' + tone(w.pct)}><div style={{ width: w.pct + '%' }} /></div>
        </div>
      ))}
      <p className="dim small">Re-drill the weakest module, then clear its mistakes in review.</p>
    </div>
  );
}
