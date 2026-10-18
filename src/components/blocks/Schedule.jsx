/* schedule: teach serializability, recoverability and locking protocols from
   one written schedule. Renders an SVG timeline (column per transaction, time
   downward, conflict arrows), the precedence graph (circle layout, cycle edges
   red), a verdict table (✓/✗ with a one-line reason each), the lock curve and
   waits-for graph when a protocol is simulated, and a step-through of the
   simulation (or of the raw ops when no protocol is set).
   mode 'predict': the verdicts stay hidden until `ask` is answered — graded and
   stored as recordAnswer(lessonId, qkey(ask.q), value) like an mcq/msq; a wrong
   answer goes to logMistake. */
import { useId, useMemo, useState } from 'react';
import { qkey } from '../../lib/qkey.js';
import { logMistake } from '../../lib/progress.js';
import { isCorrect, answerKey, optionOrder } from '../../lib/grade.js';
import {
  parseSchedule, analyze, simulate, verdictAsk, opLabel, arrow,
  VERDICTS,
} from '../../engines/schedule.js';
import './Schedule.css';

const ALL_KEYS = Object.keys(VERDICTS);
const DEFAULT_SHOW = ['timeline', 'precedence', 'verdicts', 'lockCurve', 'waitsFor'];
const STEP_TONE = {
  wait: 'warn-text', abort: 'bad-text', violation: 'bad-text',
  ignored: 'warn-text', skip: 'dim', ok: '',
};
const markerId = id => `sa-${id}`;

export default function Schedule({ b, ctx }) {
  const [upto, setUpto] = useState(null);
  const m = useMemo(() => {
    try {
      const ops = parseSchedule(b.ops);
      const analysis = analyze(ops);
      let sim = null, simError = '';
      try { sim = simulate(ops, b.protocol, b.ts); } catch (e) { simError = e.message; }
      const steps = sim ? sim.steps : ops.map(op => ({
        op, status: 'ok',
        note: analysis.conflicts.filter(c => c.a === op.i)
          .map(c => `conflicts with ${opLabel(ops[c.b])} on ${c.item} (${c.kind[0]} → ${c.kind[1]})`)
          .join(' · '),
      }));
      const keys = (b.verdicts?.length ? b.verdicts : ALL_KEYS).filter(k => k in analysis.verdicts);
      return { ops, analysis, sim, simError, steps, keys };
    } catch (e) { return { error: e.message }; }
  }, [b]);
  if (m.error) return <div className="callout red">schedule: {m.error}</div>;
  const { ops, analysis, sim, simError, steps, keys } = m;
  const show = new Set(b.show || DEFAULT_SHOW);
  const at = Math.max(1, Math.min(upto ?? steps.length, steps.length));
  const predicting = b.mode === 'predict' && show.has('verdicts');
  let ask = null;
  if (predicting) {
    try { ask = verdictAsk(b.ask, analysis.verdicts, keys, b.ops); }
    catch (e) { return <div className="callout red">schedule ask: {e.message}</div>; }
  }
  const qKey = ask ? qkey(ask.q) : null;
  const saved = ask ? ctx.store.mcq?.[qKey] : undefined;
  const deadlocks = sim?.deadlocks || [];
  const tsNote = sim && b.ts
    ? <span> · TS: {Object.entries(sim.ts).map(([k, v]) => `${k}=${v}`).join(' ')}</span>
    : null;
  return (
    <div className="blk schedule">
      <div className="blk-title">{b.title || 'Schedule'}</div>
      <div className="mono small sch-ops">{String(b.ops ?? '').trim().replace(/\s+/g, ' ')}</div>
      {sim && <div className="mono small">Protocol: {sim.name}{tsNote}</div>}
      {simError && <div className="callout warn small">Could not simulate: {simError}</div>}
      {show.has('timeline') && <Timeline ops={ops} conflicts={analysis.conflicts} upto={at} />}
      {show.has('precedence') && (
        <>
          <div className="sch-h">Precedence graph</div>
          <CircleGraph nodes={analysis.graph.nodes} edges={analysis.graph.edges}
            caption={`Precedence graph over ${analysis.graph.nodes.map(t => 'T' + t).join(', ')}`} />
          <p className={'small sch-sum' + (analysis.graph.cycle ? ' bad-text' : ' dim')}>
            {analysis.graph.cycle
              ? `cycle: ${arrow(analysis.graph.cycle)} → not conflict serializable`
              : `acyclic → conflict-equivalent to serial ${arrow(analysis.graph.order)}`}
          </p>
        </>)}
      {show.has('lockCurve') && sim && (sim.kind === 'timestamp'
        ? <p className="dim small sch-sum">Timestamp protocols take no locks — watch R-TS / W-TS update in the step notes.</p>
        : <LockCurve sim={sim} txns={analysis.txns} />)}
      {show.has('waitsFor') && deadlocks.map((d, i) => (
        <div key={i}>
          <div className="sch-h">Waits-for graph · deadlock {deadlocks.length > 1 ? i + 1 : ''}</div>
          <CircleGraph nodes={d.nodes} edges={d.edges} victim={d.victim}
            caption={`Waits-for cycle ${arrow(d.cycle)}; ${'T' + d.victim} chosen as victim`} />
          <p className="small bad-text sch-sum">
            cycle {arrow(d.cycle)} · victim {`T${d.victim}`} (youngest in the cycle)
          </p>
        </div>))}
      <div className="sch-h">Step-through</div>
      <StepTable steps={steps} upto={at} setUpto={setUpto} />
      {sim?.summary && <p className="small dim sch-sum">{sim.summary}</p>}
      {show.has('verdicts') && ask && <Ask ask={ask} qKey={qKey} saved={saved} ctx={ctx} />}
      {show.has('verdicts') && (!predicting || saved !== undefined) && (
        <Verdicts verdicts={analysis.verdicts} keys={keys} anomalies={analysis.anomalies} />)}
    </div>
  );
}

/* predict-mode ask: checkboxes (msq) or buttons (mcq), one attempt, shuffled */
function Ask({ ask, qKey, saved, ctx }) {
  const [pick, setPick] = useState([]);
  const msq = ask.kind === 'msq';
  const locked = saved !== undefined;
  const answer = [].concat(ask.answer);
  const ok = locked && isCorrect(answerKey(ask), saved);
  const text = answer.map(i => ask.options[i]).join(msq ? ', ' : ' — ')
    + (ask.explain ? ` — ${ask.explain}` : '');
  const submit = v => {
    if (locked) return;
    ctx.store.actions.recordAnswer(ctx.lessonId, qKey, v);
    if (!isCorrect(answerKey(ask), v)) logMistake(ctx.lessonId, ask.q, text);
  };
  const order = optionOrder(ask.options, qKey);
  const chosen = locked ? [].concat(saved) : pick;
  return (
    <div className="quiz-card sch-ask">
      <div className="quiz-q">{ask.q}</div>
      {msq ? (
        <div role="group" aria-label={ask.q}>
          {order.map(oi => {
            const on = chosen.includes(oi), right = answer.includes(oi);
            const cls = locked ? (right ? ' correct' : on ? ' wrong' : '') : on ? ' on' : '';
            return (
              <label key={oi} className={'quiz-opt' + cls + (locked ? ' locked' : '')}>
                <input type="checkbox" checked={on} disabled={locked}
                  onChange={() => setPick(p => (p.includes(oi) ? p.filter(x => x !== oi) : [...p, oi]))} />
                <span>{ask.options[oi]}</span>
                {locked && right && !on && <span className="small mono">missed</span>}
                {locked && on && !right && <span className="small mono">wrong pick</span>}
              </label>);
          })}
        </div>
      ) : (
        <div role="group" aria-label={ask.q}>
          {order.map(oi => (
            <button key={oi} type="button" aria-pressed={saved === oi} aria-disabled={locked}
              onClick={() => submit(oi)}
              className={'quiz-opt' + (locked
                ? (oi === answer[0] ? ' correct' : oi === saved ? ' wrong' : '') + ' locked' : '')}>
              <span className="k">{String.fromCharCode(65 + oi)}</span><span>{ask.options[oi]}</span>
            </button>))}
        </div>)}
      {!locked && msq && (
        <div className="action-row">
          <button type="button" className="reveal-btn" disabled={!pick.length}
            onClick={() => submit([...pick].sort((x, y) => x - y))}>Submit</button>
          <span className="dim small">all-or-nothing</span>
        </div>)}
      <div aria-live="polite">{locked && <>
        <div className={'verdict ' + (ok ? 'ok' : 'bad')}>{ok ? 'CORRECT' : 'INCORRECT'}</div>
        <div className="small">{text}</div>
      </>}</div>
    </div>
  );
}

/* one column per transaction, one row per op, conflict arrows a → b */
function Timeline({ ops, conflicts, upto }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const txns = [...new Set(ops.map(o => o.tx))].sort((a, b) => a - b);
  const col = 76, rowH = 26, top = 24, left = 22;
  const W = Math.max(140, left + txns.length * col + 10);
  const H = top + Math.max(1, ops.length) * rowH + 8;
  const x = t => left + txns.indexOf(t) * col + (col - 10) / 2;
  const y = i => top + i * rowH + rowH / 2;
  const arrows = conflicts.filter(c => c.a < upto && c.b < upto);
  return (
    <svg className="sch-tl" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Timeline of ${ops.map(opLabel).join(' ')}${arrows.length ? ` with ${arrows.length} conflict arrows` : ''}`}>
      <defs>
        <marker id={markerId(uid)} viewBox="0 0 8 8" refX="7" refY="4"
          markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M0 0L8 4L0 8z" className="sch-arr" />
        </marker>
        <marker id={markerId('r' + uid)} viewBox="0 0 8 8" refX="7" refY="4"
          markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M0 0L8 4L0 8z" className="sch-arr-r" />
        </marker>
      </defs>
      {txns.map(t => (
        <text key={t} className="hdr" x={x(t)} y={14} textAnchor="middle">T{t}</text>))}
      {ops.map((o, i) => {
        const label = o.item != null ? `${o.kind}(${o.item})` : o.kind;
        const w = Math.max(30, label.length * 6.4 + 12);
        const end = o.kind === 'C' || o.kind === 'A';
        return (
          <g key={i} className={(i === upto - 1 ? 'cur ' : '') + (end ? 'end' : '')}
            opacity={i >= upto ? 0.25 : 1}>
            <text className="stepno" x={10} y={y(i) + 3} textAnchor="middle">{i + 1}</text>
            <rect className="pill" x={x(o.tx) - w / 2} y={y(i) - 9} width={w} height="18" rx="5" />
            <text x={x(o.tx)} y={y(i) + 3.5} textAnchor="middle">{label}</text>
          </g>);
      })}
      {arrows.map((c, i) => {
        const x1 = x(c.from), y1 = y(c.a) + 9, x2 = x(c.to), y2 = y(c.b) - 9;
        const bend = x2 >= x1 ? 18 : -18;
        const d = `M${x1} ${y1} C ${x1 + bend} ${y1 + 14}, ${x2 - bend} ${y2 - 14}, ${x2} ${y2}`;
        return (
          <g key={i}>
            <path className="cf" d={d} markerEnd={`url(#${markerId(uid)})`} />
            <text className="cflab" x={(x1 + x2) / 2 + (x2 >= x1 ? 7 : -7)}
              y={(y1 + y2) / 2} textAnchor="middle">{c.item}</text>
          </g>);
      })}
    </svg>
  );
}

/* nodes on a circle; each edge bows left of its own chord so A→B and B→A
   never overlap; onCycle edges (and the victim node) render red */
function CircleGraph({ nodes, edges, victim, caption }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const n = nodes.length;
  if (!n) return null;
  const R = n === 1 ? 0 : 76, W = 250, H = n === 1 ? 72 : 200;
  const cx = W / 2, cy = H / 2;
  const pos = t => {
    const a = -Math.PI / 2 + (n > 1 ? (2 * Math.PI * nodes.indexOf(t)) / n : 0);
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  };
  return (
    <svg className="sch-graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
      <defs>
        <marker id={markerId(uid)} viewBox="0 0 8 8" refX="7" refY="4"
          markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M0 0L8 4L0 8z" className="sch-arr" />
        </marker>
        <marker id={markerId('r' + uid)} viewBox="0 0 8 8" refX="7" refY="4"
          markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M0 0L8 4L0 8z" className="sch-arr-r" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const [ax, ay] = pos(e.from), [bx, by] = pos(e.to);
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
        const r = 17, ux = dx / len, uy = dy / len;
        const x1 = ax + ux * r, y1 = ay + uy * r, x2 = bx - ux * r, y2 = by - uy * r;
        const mx = (x1 + x2) / 2 + (-dy / len) * 16, my = (y1 + y2) / 2 + (dx / len) * 16;
        const d = `M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
        // label at the quadratic's midpoint: (p0 + 2·ctrl + p2) / 4
        const lx = (x1 + 2 * mx + x2) / 4, ly = (y1 + 2 * my + y2) / 4;
        return (
          <g key={i}>
            <path className={'ed' + (e.onCycle ? ' cycle' : '')} d={d}
              markerEnd={`url(#${markerId((e.onCycle ? 'r' : '') + uid)})`} />
            <text className={'el' + (e.onCycle ? ' cycle' : '')}
              x={lx} y={ly - 4} textAnchor="middle">
              {e.items?.join(',')}
            </text>
          </g>);
      })}
      {nodes.map(t => {
        const [nx, ny] = pos(t), vic = victim === t;
        return (
          <g key={t}>
            <circle className={'node' + (vic ? ' victim' : '')} cx={nx} cy={ny} r="16" />
            <text className="nt" x={nx} y={ny + 4} textAnchor="middle">T{t}</text>
            {vic && <text className="vlab" x={nx} y={ny + 30} textAnchor="middle">victim</text>}
          </g>);
      })}
    </svg>
  );
}

/* locks held by each transaction per step; ● marks each lock point */
function LockCurve({ sim, txns }) {
  const vals = sim.steps.map(s => s.held || null);
  if (!vals.some(Boolean)) return null;
  const n = sim.steps.length;
  const maxH = Math.max(1, ...vals.map(h => (h ? Math.max(0, ...Object.values(h)) : 0)));
  const W = 340, H = 132, L = 24, R = 10, T = 10, B = 22;
  const X = i => (n <= 1 ? (L + W - R) / 2 : (L + (W - L - R) * i) / (n - 1));
  const Y = v => H - B - ((H - T - B) * v) / maxH;
  return (
    <div>
      <svg className="sch-curve" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Locks held per step for ${txns.map(t => 'T' + t).join(', ')}`}>
        {Array.from({ length: maxH + 1 }, (_, v) => v).map(v => (
          <g key={v}>
            <line className="grid" x1={L} y1={Y(v)} x2={W - R} y2={Y(v)} />
            <text x={L - 5} y={Y(v) + 3} textAnchor="end">{v}</text>
          </g>))}
        <line className="grid" x1={L} y1={Y(0)} x2={L} y2={Y(maxH)} />
        {txns.map((t, k) => {
          const pts = [];
          vals.forEach((h, i) => {
            if (!h) return;
            const v = h[t] ?? 0;
            pts.push(`${X(i)},${Y(v)}`);
            if (i + 1 < n && vals[i + 1]) pts.push(`${X(i + 1)},${Y(v)}`);
          });
          return pts.length < 2 ? null
            : <polyline key={t} className={`sch-st${k % 5}`} points={pts.join(' ')} />;
        })}
        {txns.map((t, k) => sim.lockPoint[t] != null && vals[sim.lockPoint[t]] && (
          <circle key={'lp' + t} className={`sch-fl${k % 5}`}
            cx={X(sim.lockPoint[t])} cy={Y(vals[sim.lockPoint[t]][t] ?? 0)} r="3.5" />))}
        <text x={W - R} y={H - 6} textAnchor="end">step →</text>
      </svg>
      <div className="small sch-legend">
        {txns.map((t, k) => (
          <span key={t} className="sch-leg"><span className={`sch-sw sch-fl${k % 5}`} />T{t}</span>))}
        {txns.some(t => sim.lockPoint[t] != null) && (
          <span className="sch-leg sch-dotkey">● lock point</span>)}
      </div>
    </div>
  );
}

/* step list of the simulation (or the raw ops with their conflicts); the
   timeline dims everything past `upto` so the schedule plays one op at a time */
function StepTable({ steps, upto, setUpto }) {
  const n = steps.length;
  return (
    <div className="sch-steps">
      <div className="row-between">
        <span className="small dim">step {upto} / {n}</span>
        <span className="action-row">
          <button type="button" className="reveal-btn" disabled={upto <= 1}
            onClick={() => setUpto(upto - 1)} aria-label="Previous step">◀</button>
          <button type="button" className="reveal-btn" disabled={upto >= n}
            onClick={() => setUpto(upto + 1)} aria-label="Next step">Next ▶</button>
          <button type="button" className="reveal-btn" onClick={() => setUpto(n)}>All</button>
        </span>
      </div>
      <div className="table-scroll">
        <table className="trace">
          <thead><tr><th scope="col">#</th><th scope="col">Op</th><th scope="col">What happens</th></tr></thead>
          <tbody>{steps.slice(0, upto).map((s, i) => (
            <tr key={i} className={i === upto - 1 && upto < n ? 'sch-cur' : ''}>
              <td className="mono small">{i + 1}</td>
              <td className="mono">{opLabel(s.op)}{s.op.implicit && <span className="dim small"> (implied)</span>}</td>
              <td className={`small ${STEP_TONE[s.status] ?? ''}`}>{s.note || '—'}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

function Verdicts({ verdicts, keys, anomalies }) {
  return (
    <div className="sch-verdicts">
      <div className="sch-h">Verdicts</div>
      <div className="table-scroll">
        <table className="trace">
          <thead><tr><th scope="col">Property</th><th scope="col">Holds</th><th scope="col">Why</th></tr></thead>
          <tbody>{keys.map(k => {
            const v = verdicts[k];
            return (
              <tr key={k}>
                <td>{VERDICTS[k]}</td>
                <td>{v.value == null ? <span className="dim">?</span>
                  : v.value ? <span className="ok" role="img" aria-label="holds">✓</span>
                    : <span className="bad-text" role="img" aria-label="does not hold">✗</span>}</td>
                <td className="small dim">{v.reason}</td>
              </tr>);
          })}</tbody>
        </table>
      </div>
      {anomalies.length > 0 && (
        <p className="small sch-anom">Anomalies:{' '}
          {anomalies.map((a, i) => (
            <span key={i}>{i > 0 ? ' · ' : ' '}<strong>{a.kind}</strong> {a.text}</span>))}
        </p>)}
    </div>
  );
}
