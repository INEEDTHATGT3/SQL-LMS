import { useProgress, streak, longestStreak } from '../lib/progress.js';
import { dayStr } from '../lib/srs.js';

/* GitHub-style heatmap of study days (last 17 weeks) + streak counters. */
export default function StreakStrip() {
  const p = useProgress();
  const days = new Set(p.days || []);
  const cells = Array.from({ length: 119 }, (_, i) => dayStr(i - 118));
  return (
    <div className="card mb">
      <div className="streak">
        <div>
          <div className="big-stat-v">{streak(p)}<span className="dim small"> day streak</span></div>
          <div className="seg-desc">best {longestStreak(p)}</div>
        </div>
        <div className="heatmap" role="img" aria-label={`${days.size} study days recorded`}>
          {cells.map(d => <div key={d} title={d} className={days.has(d) ? 'on' : ''} />)}
        </div>
      </div>
    </div>
  );
}
