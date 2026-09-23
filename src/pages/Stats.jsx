import { useMemo } from 'react';
import { MODULES, LEVEL_NUMS, TOTAL_LESSONS, SUBJECT } from '../lib/subject.js';
import { useProgress, exportAll, importAll, getSessions } from '../lib/progress.js';
import { overallAccuracy, answeredCount } from '../lib/analytics.js';

/* Stats dashboard - derived during render from the store snapshot. */
export default function Stats({ onClose }) {
  const p = useProgress();
  const overall = overallAccuracy(p);

  const rows = useMemo(() => MODULES.map(mod => {
    const per = LEVEL_NUMS.map(L => !!p.lessons[`${mod.id}_L${L}`]?.complete);
    return { mod, per, done: per.filter(Boolean).length };
  }), [p]);

  const totalDone = rows.reduce((a, r) => a + r.done, 0);
  const solved = Object.values(p.lessons).reduce((a, l) => a + Object.keys(l.solved || {}).length, 0);
  const pct = Math.round(totalDone / TOTAL_LESSONS * 100);

  return (
    <div className="card mb">
      <div className="row-between">
        <div className="card-title">STATS DASHBOARD</div>
        <button className="reveal-btn" onClick={onClose}>Close</button>
      </div>

      <div className="grid-2">
        <BigStat label="Lessons complete" value={`${totalDone} / ${TOTAL_LESSONS}`} pct={pct} />
        <BigStat label="Problems solved" value={String(solved)} />
        <BigStat label="Questions answered" value={String(answeredCount(p))}
          sub={overall !== null ? `accuracy ${overall}%` : undefined} />
        <BigStat label="Modules touched" value={`${rows.filter(r => r.done > 0).length} / ${MODULES.length}`} />
      </div>

      <div className="table-scroll"><table className="trace">
        <thead><tr><th>Module</th>{LEVEL_NUMS.map(L => <th key={L}>L{L}</th>)}</tr></thead>
        <tbody>{rows.map(({ mod, per }) => (
          <tr key={mod.id}>
            <td>{mod.num} {mod.title}</td>
            {per.map((ok, i) => <td key={i} className="center">{ok ? '✓' : '·'}</td>)}
          </tr>
        ))}</tbody>
      </table></div>

      {getSessions(p).length > 0 && <>
        <h3>Recent sessions</h3>
        {getSessions(p).slice(0, 6).map((s, i) => (
          <div key={i} className="session-row">
            <span className="dim mono">{new Date(s.at).toLocaleString()}</span>
            <span>
              {s.type === 'sprint' ? `${s.solved}/${s.attempted} solved · ${s.minutes}m`
                : s.type === 'interview' ? `interview ${s.count}q · ${s.clean} clean` : s.type}
            </span>
          </div>
        ))}
      </>}

      <div className="action-row">
        <button className="reveal-btn" onClick={() => {
          const blob = new Blob([exportAll()], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${SUBJECT.id}-progress-export.json`;
          a.click();
          URL.revokeObjectURL(a.href);
        }}>Export progress</button>
        <label className="reveal-btn">
          Import progress
          <input type="file" accept=".json" hidden onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              try { importAll(JSON.parse(String(reader.result))); alert('Progress imported.'); }
              catch { alert('Invalid export file.'); }
            };
            reader.readAsText(file);
          }} />
        </label>
      </div>
    </div>
  );
}

function BigStat({ label, value, pct, sub }) {
  return (
    <div className="mem-seg big-stat">
      <div className="big-stat-v">{value}</div>
      <div className="seg-desc">{label}</div>
      {sub && <div className="big-stat-sub">{sub}</div>}
      {pct !== undefined && <div className="meter"><div style={{ width: pct + '%' }} /></div>}
    </div>
  );
}
