/* query-plan: EXPLAIN (FORMAT JSON) as a collapsible cost tree.
   Per node: cost range, estimated vs actual rows with a ratio badge (misestimate
   > 10x = warn), conditions in mono; the node with the highest EXCLUSIVE cost
   (Total Cost - children's Total Cost) is highlighted. Copy JSON dumps the raw
   plan; `compareWith` (a plan wrapper, a {title, plan} pair, or a raw node)
   renders a second tree side by side, stacking under 760px. */
import { useMemo, useState } from 'react';
import './QueryPlan.css';

const CONDS = ['Filter', 'Index Cond', 'Hash Cond', 'Merge Cond', 'Join Filter', 'Recheck Cond'];
const dialectLabel = d => ({ pg: 'PostgreSQL', mysql: 'MySQL' }[String(d || 'pg').toLowerCase()] || 'ANSI');

const rootOf = p => (p && typeof p === 'object' && p.Plan) || p;
const rootsOf = plan => (Array.isArray(plan) ? plan : [plan])
  .map(rootOf)
  .filter(n => n && typeof n === 'object');

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const fmt = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

/* misestimate factor: how many times off, either direction */
function ratioInfo(est, act) {
  if (est === undefined || act === undefined) return null;
  if (est === 0) return act === 0 ? { txt: '1×', warn: false } : { txt: '∞', warn: true };
  if (act === est) return { txt: '1×', warn: false };
  const f = Math.max(act / est, est / act);
  return {
    txt: (f >= 100 ? Math.round(f) : Math.round(f * 10) / 10) + '×',
    warn: f > 10,
  };
}

/* pre-order walk recording the node with the biggest exclusive cost.
   `prefix` keeps the compare plan's paths distinct from the main plan's. */
function hottest(nodes, prefix = '') {
  let best = null;
  const walk = (node, path) => {
    const kids = Array.isArray(node.Plans) ? node.Plans : [];
    const total = num(node['Total Cost']);
    if (total !== undefined) {
      const childSum = kids.reduce((s, k) => s + (num(k['Total Cost']) ?? 0), 0);
      const excl = total - childSum;
      if (!best || excl > best.excl) best = { path, excl };
    }
    kids.forEach((k, i) => walk(k, `${path}.${i}`));
  };
  nodes.forEach((n, i) => walk(n, prefix ? `${prefix}${i}` : String(i)));
  return best;
}

function normCompare(c) {
  if (!c || typeof c !== 'object') return null;
  const plan = c.Plan ? c : c.plan ? c.plan : c;
  const nodes = rootsOf(plan);
  return nodes.length ? { title: c.title || null, nodes } : null;
}

export default function QueryPlan({ b }) {
  const [closed, setClosed] = useState(() => new Set());
  const [copied, setCopied] = useState(false);

  const nodes = useMemo(() => rootsOf(b.plan), [b.plan]);
  const cmp = useMemo(() => normCompare(b.compareWith), [b.compareWith]);
  const hotA = useMemo(() => hottest(nodes), [nodes]);
  const hotB = useMemo(() => (cmp ? hottest(cmp.nodes, 'c') : null), [cmp]);

  if (!nodes.length) return <div className="callout warn">query-plan block missing plan data</div>;

  const toggle = path => setClosed(prev => {
    const n = new Set(prev);
    n.has(path) ? n.delete(path) : n.add(path);
    return n;
  });

  const copyJSON = async () => {
    const text = JSON.stringify(b.plan, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* clipboard unavailable */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderNode = (node, path, hot) => {
    const kids = Array.isArray(node.Plans) ? node.Plans : [];
    const shut = closed.has(path);
    const isHot = !!hot && hot.path === path;
    const est = num(node['Plan Rows']);
    const act = num(node['Actual Rows']);
    const ratio = ratioInfo(est, act);
    const startup = num(node['Startup Cost']);
    const total = num(node['Total Cost']);
    const aStart = num(node['Actual Startup Time']);
    const aTotal = num(node['Actual Total Time']);
    const conds = CONDS.filter(k => typeof node[k] === 'string' && node[k].trim());
    const meta = [];
    if (startup !== undefined && total !== undefined) meta.push(`cost ${fmt(startup)}..${fmt(total)}`);
    if (est !== undefined) meta.push(`rows ${fmt(est)}`);
    if (num(node['Plan Width']) !== undefined) meta.push(`width ${fmt(node['Plan Width'])}`);
    if (aStart !== undefined && aTotal !== undefined) meta.push(`time ${fmt(aStart)}..${fmt(aTotal)} ms`);
    if (act !== undefined) meta.push(`actual rows ${fmt(act)}`);
    if (num(node['Actual Loops']) !== undefined) meta.push(`loops ${fmt(node['Actual Loops'])}`);
    return (
      <div className={'qp-node' + (isHot ? ' hot' : '')} key={path}>
        <div className="qp-head">
          {kids.length ? (
            <button type="button" className="qp-toggle" aria-expanded={!shut} aria-pressed={!shut}
              aria-label={shut ? `Expand ${node['Node Type'] || 'node'}` : `Collapse ${node['Node Type'] || 'node'}`}
              onClick={() => toggle(path)}>{shut ? '▸' : '▾'}</button>
          ) : <span className="qp-sp" aria-hidden="true" />}
          <span className="qp-type">{node['Node Type'] || 'Unknown'}</span>
          {node['Relation Name'] && <span className="qp-rel">{node['Relation Name']}</span>}
          {node['Alias'] && node['Alias'] !== node['Relation Name'] && <span className="qp-idx">as {node['Alias']}</span>}
          {node['Index Name'] && <span className="qp-idx">{node['Index Name']}</span>}
          {isHot && <span className="qp-flag">most expensive · excl {fmt(hot.excl)}</span>}
        </div>
        <div className="qp-body">
          <div className="qp-meta">
            <span>{meta.join(' · ')}</span>
            {ratio && (
              <span className={'qp-ratio' + (ratio.warn ? ' warn' : ratio.txt === '1×' ? ' ok' : '')}
                title={`estimated ${est} vs actual ${act}`}>ratio {ratio.txt}</span>
            )}
          </div>
          {conds.length > 0 && (
            <ul className="qp-conds">
              {conds.map(k => <li key={k}><span className="qp-k">{k}:</span> {node[k]}</li>)}
            </ul>
          )}
          {kids.length > 0 && !shut && (
            <div className="qp-kids">{kids.map((k, i) => renderNode(k, `${path}.${i}`, hot))}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="blk query-plan">
      <div className="row-between">
        <div className="blk-title">{b.title || 'EXPLAIN plan'}</div>
        <div className="badge-row">
          <span className="badge">{dialectLabel(b.dialect)}</span>
          <button type="button" className="reveal-btn" onClick={copyJSON}>
            {copied ? 'Copied ✓' : 'Copy JSON'}
          </button>
        </div>
      </div>
      <div className={'qp-grid' + (cmp ? ' two' : '')}>
        <div className="qp-panel">
          {cmp && <div className="qp-panel-h">{b.title || 'Plan A'}</div>}
          {nodes.map((n, i) => renderNode(n, String(i), hotA))}
        </div>
        {cmp && (
          <div className="qp-panel">
            <div className="qp-panel-h">{cmp.title || 'Compare'}</div>
            {cmp.nodes.map((n, i) => renderNode(n, `c${i}`, hotB))}
          </div>
        )}
      </div>
    </div>
  );
}
