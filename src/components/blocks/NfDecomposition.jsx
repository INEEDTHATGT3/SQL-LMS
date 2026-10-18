/* nf-decomposition: NF check table (one row per FD, 2NF/3NF/BCNF with reason),
   decomposition tree (BCNF split or 3NF synthesis), lossless-join and
   dependency-preservation verdicts. With `ask`, the analysis stays hidden until
   the learner answers "highest NF?" - options 1NF/2NF/3NF/BCNF in that order,
   stored as recordAnswer(lessonId, qkey(q), optionIndex), graded like an mcq. */
import { useMemo } from 'react';
import { qkey } from '../../lib/qkey.js';
import { logMistake } from '../../lib/progress.js';
import { normalizeRelation, NF, fdStr, setStr, keysStr, relStr } from '../../engines/fd.js';
import './NfDecomposition.css';

const ALL = ['nfTable', 'tree', 'lossless', 'depPreserving'];

export default function NfDecomposition({ b, ctx }) {
  const r = useMemo(() => {
    try { return normalizeRelation(b.relation || {}, b.target || 'BCNF'); }
    catch (e) { return { error: e.message }; }
  }, [b]);
  if (r.error) return <div className="callout red">nf-decomposition: {r.error}</div>;
  const show = b.show || ALL;
  const rel = relStr(r.name, r.attrs), Fs = `{${r.fds.map(fdStr).join(', ')}}`;
  const q = b.ask ? b.ask.q || `Highest normal form of ${rel} with F = ${Fs}?` : null;
  const saved = q ? ctx.store.mcq?.[qkey(q)] : undefined;
  return (
    <div className="blk nf-dec">
      <div className="blk-title">{b.title || `${r.name} → ${r.target}`}</div>
      <div className="mono small">{rel}</div>
      <div className="mono small">F = {Fs}</div>
      {q && <Ask q={q} r={r} saved={saved} ctx={ctx} />}
      {(!q || saved !== undefined) && <>
        <p className="small nf-keys">
          Candidate keys <span className="mono">{keysStr(r.keys)}</span> · prime <span className="mono">{setStr(r.prime)}</span> ·
          non-prime <span className="mono">{setStr(r.nonPrime)}</span>
        </p>
        {show.includes('nfTable') && <NfTable r={r} />}
        {show.includes('tree') && <>
          <Tree r={r} />
          <ol className="small nf-steps">{r.steps.map((s, i) => <li key={i} className="mono">{s}</li>)}</ol>
        </>}
        {show.includes('lossless') && (
          <div className="nf-verdict">
            <span className={r.lossless.ok ? 'ok' : 'bad-text'}>{r.lossless.ok ? '✓ Lossless join' : '✗ Lossy join'}</span>
            <span className="dim small"> {r.lossless.reason}</span>
          </div>)}
        {show.includes('depPreserving') && (
          <div className="nf-verdict">
            <span className={r.dep.preserving ? 'ok' : 'bad-text'}>
              {r.dep.preserving ? '✓ Dependency preserving' : '✗ Not dependency preserving'}
            </span>
            {!r.dep.preserving && <span className="small"> lost: <span className="mono">{r.dep.lost.join(', ')}</span></span>}
          </div>)}
      </>}
    </div>
  );
}

function Ask({ q, r, saved, ctx }) {
  const answer = NF.indexOf(r.highest), locked = saved !== undefined;
  const pick = i => {
    if (locked) return;
    ctx.store.actions.recordAnswer(ctx.lessonId, qkey(q), i);
    if (i !== answer) logMistake(ctx.lessonId, q, `${r.highest}: ${r.why}`);
  };
  return (
    <div className="quiz-card">
      <div className="quiz-q">{q}</div>
      <div role="group" aria-label={q}>
        {NF.map((nf, i) => (
          <button key={nf} type="button" aria-pressed={saved === i} aria-disabled={locked} onClick={() => pick(i)}
            className={'quiz-opt' + (locked ? (i === answer ? ' correct' : i === saved ? ' wrong' : '') + ' locked' : '')}>
            <span className="k">{String.fromCharCode(65 + i)}</span><span>{nf}</span>
          </button>))}
      </div>
      <div aria-live="polite">{locked && <>
        <div className={'verdict ' + (saved === answer ? 'ok' : 'bad')}>{saved === answer ? 'CORRECT' : 'INCORRECT'}</div>
        <div className="small">{r.why} <span className="dim">(values assumed atomic, so at least 1NF)</span></div>
      </>}</div>
    </div>
  );
}

function NfTable({ r }) {
  return (<>
    <div className="table-scroll">
      <table className="trace nf-table">
        <thead><tr><th scope="col">FD</th><th scope="col">2NF</th><th scope="col">3NF</th><th scope="col">BCNF</th></tr></thead>
        <tbody>{r.rows.map((row, i) => (
          <tr key={i}>
            <td className="mono">{row.fd}</td>
            {['nf2', 'nf3', 'bcnf'].map(k => (
              <td key={k} className={row[k].ok ? 'ok' : 'bad-text'}>
                <span aria-hidden="true">{row[k].ok ? '✓' : '✗'}</span>
                <span className="sr-only">{row[k].ok ? 'holds' : 'violated'}</span>{' '}
                <span className="small nf-why">{row[k].why}</span>
              </td>))}
          </tr>))}</tbody>
      </table>
    </div>
    <p className="small">Highest normal form: <strong className="lvl-text">{r.highest}</strong>. {r.why}</p>
  </>);
}

/* Indented tree (one node per row) so it stays legible at 360px instead of
   shrinking a wide top-down tree. ponytail: text width estimated from a
   monospace advance, not measured. */
const W = 360, IND = 24, LH = 15, CH = 7.3;
function wrap(s, max) {
  const out = [];
  let cur = '';
  for (const tok of s.match(/[^,(]*[,(]?/g).filter(Boolean)) {
    if (cur && (cur + tok).length > max) { out.push(cur); cur = tok.trimStart(); } else cur += tok;
  }
  if (cur) out.push(cur);
  return out.flatMap(l => l.match(new RegExp(`.{1,${max}}`, 'g')));
}
function layout(r) {
  const rows = [], meets = nf => NF.indexOf(nf) >= NF.indexOf(r.target);
  let y = 4;
  const walk = (n, depth, parent, edge) => {
    const x = 4 + depth * IND, w = W - x - 4, max = Math.max(8, Math.floor((w - 16) / CH));
    const leaf = !n.children?.length, ok = leaf && meets(n.nf);
    const tail = leaf ? `${n.nf} ${ok ? '✓' : '✗'}` : `${n.nf ? n.nf + ', ' : ''}not ${r.target}`;
    const lines = wrap(relStr(n.name, n.attrs), max), meta = wrap(`key ${keysStr(n.keys)} · ${tail}`, max);
    const lab = edge ? 14 : 0, h = 8 + (lines.length + meta.length) * LH;
    const o = { x, y, w, lab, h, lines, meta, edge, parent, cls: ok ? 'ok' : leaf ? 'bad' : 'warn' };
    rows.push(o);
    y += lab + h + 8;
    (n.children || []).forEach((c, i) => walk(c, depth + 1, o,
      n.split ? (i === 0 ? `split on ${n.split}` : `${n.name} − ${setStr(n.attrs.filter(a => !c.attrs.includes(a)))}`)
        : c.edge === 'key' ? 'key schema' : `from ${c.edge}`));
  };
  walk(r.tree, 0, null, null);
  return { rows, H: y - 4 };
}
function Tree({ r }) {
  const { rows, H } = layout(r);
  const label = r.leaves.length > 1
    ? `${relStr(r.name, r.attrs)} decomposed into ${r.leaves.map(l => relStr(l.name, l.attrs)).join(', ')}`
    : `${relStr(r.name, r.attrs)} needs no decomposition`;
  return (
    <svg className="nf-tree" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <title>{label}</title>
      {rows.map((o, i) => {
        const top = o.y + o.lab, p = o.parent;
        return (
          <g key={i} className={`nf-node ${o.cls}${i === 0 ? ' root' : ''}`}>
            {p && <path className="nf-edge" d={`M${p.x + 12} ${p.y + p.lab + p.h} V${top + o.h / 2} H${o.x}`} />}
            {o.edge && <text className="nf-edge-label" x={o.x + 4} y={o.y + 10}>{o.edge}</text>}
            <rect x={o.x} y={top} width={o.w} height={o.h} rx="6" />
            {o.lines.map((l, k) => <text key={k} x={o.x + 8} y={top + 4 + LH * (k + 1) - 3}>{l}</text>)}
            {o.meta.map((l, k) => (
              <text key={'m' + k} className="nf-meta" x={o.x + 8} y={top + 4 + LH * (o.lines.length + k + 1) - 3}>{l}</text>))}
          </g>);
      })}
    </svg>
  );
}
