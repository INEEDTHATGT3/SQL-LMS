/* Transaction schedule engine (pure, no DOM): parse "R1(A) W2(A) C1",
   conflict + view serializability, recoverable / cascadeless / strict,
   anomaly detection, and protocol simulation (2PL family with auto-inserted
   locks or validation of explicit S/X/U locks, basic timestamp ordering,
   Thomas' write rule, wait-die, wound-wait). Every simulation returns one
   step per event so the UI can step through it. */

export const VERDICTS = {
  conflictSerializable: 'Conflict serializable',
  viewSerializable: 'View serializable',
  recoverable: 'Recoverable',
  cascadeless: 'Cascadeless',
  strict: 'Strict',
};
export const PROTOCOL_NAMES = {
  none: 'No protocol', '2PL': 'Basic 2PL', strict2PL: 'Strict 2PL', rigorous: 'Rigorous 2PL',
  conservative2PL: 'Conservative 2PL', TO: 'Basic timestamp ordering', thomas: "Thomas' write rule",
  waitDie: 'Wait-die', woundWait: 'Wound-wait',
};

const DATA = new Set(['R', 'W']), LOCK = new Set(['S', 'X', 'U']), END = new Set(['C', 'A']);
const T = t => 'T' + t;
export const arrow = list => (list || []).map(T).join(' → ');
export const opLabel = o => `${o.kind}${o.tx}${o.item != null ? `(${o.item})` : ''}`;
export const txnsOf = ops => [...new Set(ops.map(o => o.tx))].sort((a, b) => a - b);
const abortedIn = ops => new Set(ops.filter(o => o.kind === 'A').map(o => o.tx));
const join = (...s) => s.filter(Boolean).join(' · ');

/* R/W/S/X/U need an item in parentheses; C/A take none. U may follow a
   commit (textbooks write "C1 U1(A)" for strict 2PL); nothing else may. */
export function parseSchedule(src) {
  const ops = [], ended = {};
  for (const tok of String(src ?? '').trim().split(/[\s,;]+/).filter(Boolean)) {
    const m = /^([RWCASXU])(\d+)(?:\(([^()\s]*)\))?$/i.exec(tok);
    if (!m) throw new Error(`Can't read "${tok}": write ops like R1(A), W2(B), C1, A2, S1(A), X1(A), U1(A)`);
    const kind = m[1].toUpperCase(), tx = Number(m[2]), item = m[3] || null;
    if (END.has(kind) && item) throw new Error(`"${tok}": commit/abort take no item`);
    if (!END.has(kind) && !item) throw new Error(`"${tok}" needs an item, e.g. ${kind}${tx}(A)`);
    if (ended[tx] && kind !== 'U') throw new Error(`"${tok}": T${tx} already ${ended[tx]}`);
    if (END.has(kind)) ended[tx] = kind === 'C' ? 'committed' : 'aborted';
    ops.push({ i: ops.length, kind, tx, item });
  }
  return ops;
}

/* conflicting pairs (different txns, same item, at least one write) over the
   committed projection: ops of aborted transactions are dropped */
export function conflicts(ops) {
  const ab = abortedIn(ops), d = ops.filter(o => DATA.has(o.kind) && !ab.has(o.tx)), out = [];
  for (let x = 0; x < d.length; x++) for (let y = x + 1; y < d.length; y++) {
    const a = d[x], b = d[y];
    if (a.tx !== b.tx && a.item === b.item && (a.kind === 'W' || b.kind === 'W'))
      out.push({ a: a.i, b: b.i, from: a.tx, to: b.tx, item: a.item, kind: a.kind + b.kind });
  }
  return out;
}

function findCycle(nodes, next) {
  const color = {}, stack = [];
  const dfs = u => {
    color[u] = 1; stack.push(u);
    for (const v of next(u)) {
      if (color[v] === 1) return [...stack.slice(stack.indexOf(v)), v];
      if (!color[v]) { const c = dfs(v); if (c) return c; }
    }
    color[u] = 2; stack.pop();
    return null;
  };
  for (const n of nodes) if (!color[n]) { const c = dfs(n); if (c) return c; }
  return null;
}

/* every topological order, capped (n <= 5 gives at most 120) */
function topoOrders(nodes, edges, cap = 120) {
  const out = [], indeg = Object.fromEntries(nodes.map(n => [n, 0])), pick = [];
  edges.forEach(e => indeg[e.to]++);
  const go = () => {
    if (out.length >= cap) return;
    if (pick.length === nodes.length) { out.push([...pick]); return; }
    for (const n of nodes) if (indeg[n] === 0 && !pick.includes(n)) {
      pick.push(n); edges.forEach(e => { if (e.from === n) indeg[e.to]--; });
      go();
      pick.pop(); edges.forEach(e => { if (e.from === n) indeg[e.to]++; });
    }
  };
  go();
  return out;
}

export function precedence(ops) {
  const ab = abortedIn(ops);
  const nodes = txnsOf(ops.filter(o => !ab.has(o.tx)));
  const byKey = new Map();
  for (const c of conflicts(ops)) {
    const k = c.from + '>' + c.to;
    if (!byKey.has(k)) byKey.set(k, { from: c.from, to: c.to, items: [] });
    const e = byKey.get(k);
    if (!e.items.includes(c.item)) e.items.push(c.item);
  }
  const edges = [...byKey.values()];
  const next = u => edges.filter(e => e.from === u).map(e => e.to);
  const reaches = (s, t) => {
    const seen = new Set([s]), st = [s];
    while (st.length) {
      const u = st.pop();
      if (u === t) return true;
      for (const v of next(u)) if (!seen.has(v)) { seen.add(v); st.push(v); }
    }
    return false;
  };
  edges.forEach(e => { e.onCycle = reaches(e.to, e.from); });
  const cycle = findCycle(nodes, next);
  const orders = cycle ? [] : topoOrders(nodes, edges);
  return { nodes, edges, cycle, order: orders[0] || null, orders };
}

/* reads-from (op index -> writer txn, 0 = initial value) + final writer per item */
function viewInfo(data) {
  const last = {}, rf = {};
  for (const o of data) {
    if (o.kind === 'R') rf[o.i] = last[o.item] ?? 0;
    else last[o.item] = o.tx;
  }
  return { rf, final: last };
}
const sameMap = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => a[k] === b[k]);
function* permutations(xs) {
  if (xs.length <= 1) { yield xs; return; }
  for (let j = 0; j < xs.length; j++)
    for (const p of permutations([...xs.slice(0, j), ...xs.slice(j + 1)])) yield [xs[j], ...p];
}

export function viewSerializable(ops, graph = precedence(ops)) {
  const ab = abortedIn(ops), data = ops.filter(o => DATA.has(o.kind) && !ab.has(o.tx)), txns = txnsOf(data);
  const blind = data.filter(o => o.kind === 'W'
    && !data.some(p => p.tx === o.tx && p.kind === 'R' && p.item === o.item && p.i < o.i));
  if (!graph.cycle) return { value: true, order: graph.order, blind, reason: 'Conflict serializable ⇒ view serializable' };
  if (!blind.length) return { value: false, blind, reason: 'Not conflict serializable and has no blind write ⇒ not view serializable' };
  // ponytail: brute force over n! serial orders; n > 5 reported unknown (view serializability is NP-complete)
  if (txns.length > 5) return { value: null, blind, reason: `Unknown: ${txns.length} transactions with blind writes (brute force stops at 5)` };
  const want = viewInfo(data);
  for (const perm of permutations(txns)) {
    const got = viewInfo(perm.flatMap(t => data.filter(o => o.tx === t)));
    if (sameMap(got.rf, want.rf) && sameMap(got.final, want.final))
      return { value: true, order: perm, blind, reason: `View-equivalent to serial ${arrow(perm)} (blind write ${blind.map(opLabel).join(', ')})` };
  }
  return { value: false, blind, reason: 'No serial order reproduces its reads-from and final writes' };
}

function ends(ops) {
  const e = {};
  for (const o of ops) if (END.has(o.kind)) e[o.tx] = { at: o.i, kind: o.kind };
  return e;
}
/* the write a read actually sees: latest earlier write on the item, skipping
   writers already rolled back at that point */
function writerSeen(ops, r, end) {
  for (let j = r.i - 1; j >= 0; j--) {
    const w = ops[j];
    if (w.kind !== 'W' || w.item !== r.item) continue;
    if (end[w.tx]?.kind === 'A' && end[w.tx].at < r.i) continue;
    return w;
  }
  return null;
}

export function recoverability(ops) {
  const end = ends(ops), commitAt = t => (end[t]?.kind === 'C' ? end[t].at : Infinity);
  let rec = '', casc = '', strict = '', cross = 0, crossCommitted = 0;
  for (const o of ops) {
    if (!DATA.has(o.kind)) continue;
    if (o.kind === 'R') {
      const w = writerSeen(ops, o, end);
      if (w && w.tx !== o.tx) {
        cross++;
        if (commitAt(o.tx) < Infinity) crossCommitted++;
        if (!casc && !(commitAt(w.tx) < o.i)) casc = `${T(o.tx)} reads ${o.item} written by uncommitted ${T(w.tx)}`;
        if (!rec && commitAt(o.tx) < Infinity && !(commitAt(w.tx) < commitAt(o.tx)))
          rec = end[w.tx]?.kind === 'A'
            ? `${T(o.tx)} commits after reading ${o.item} from ${T(w.tx)}, which aborts`
            : `${T(o.tx)} reads ${o.item} from ${T(w.tx)} but commits before ${T(w.tx)} does`;
      }
    }
    if (!strict) for (let j = o.i - 1; j >= 0; j--) {
      const w = ops[j];
      if (w.kind === 'W' && w.item === o.item && w.tx !== o.tx && !(end[w.tx] && end[w.tx].at < o.i)) {
        strict = `${T(o.tx)} ${o.kind === 'R' ? 'reads' : 'writes'} ${o.item} written by uncommitted ${T(w.tx)}`;
        break;
      }
    }
  }
  const recOk = !cross ? 'No transaction reads a value written by another'
    : !crossCommitted ? 'No transaction that read another\'s write commits, so none commits too early'
    : 'Every reader commits only after the transaction it read from';
  return {
    recoverable: { value: !rec, reason: rec || recOk },
    cascadeless: { value: !casc, reason: casc || (cross ? 'Every read sees committed data only' : 'No transaction reads another\'s write') },
    strict: { value: !strict, reason: strict || 'No read or write touches an item while another transaction\'s write to it is uncommitted' },
  };
}

export function anomalies(ops) {
  const end = ends(ops), out = [], seen = new Set();
  const add = (kind, text) => { if (!seen.has(text)) { seen.add(text); out.push({ kind, text }); } };
  for (const r of ops) if (r.kind === 'R') {
    const w = writerSeen(ops, r, end);
    if (w && w.tx !== r.tx && !(end[w.tx]?.kind === 'C' && end[w.tx].at < r.i))
      add('dirty read', `${opLabel(r)} reads ${r.item} written by ${opLabel(w)} before ${T(w.tx)} commits`
        + (end[w.tx]?.kind === 'A' ? ` (and ${T(w.tx)} later aborts)` : ''));
  }
  const ab = abortedIn(ops), data = ops.filter(o => DATA.has(o.kind) && !ab.has(o.tx));
  for (const b of data) if (b.kind === 'W') for (const ti of txnsOf(data)) if (ti !== b.tx) {
    const mine = data.filter(o => o.tx === ti && o.item === b.item);
    const a = mine.filter(o => o.i < b.i).pop(), c = mine.find(o => o.i > b.i);
    if (!a || !c || a.kind !== 'R') continue;
    if (c.kind === 'W')
      add('lost update', `${T(b.tx)}'s ${opLabel(b)} is lost: ${T(ti)} overwrites ${b.item} with ${opLabel(c)}, computed from its earlier ${opLabel(a)}`);
    else
      add('unrepeatable read', `${T(ti)} reads ${b.item} twice (${opLabel(a)}, ${opLabel(c)}) and ${T(b.tx)}'s ${opLabel(b)} changes it in between`);
  }
  return out;
}

export function analyze(ops) {
  const graph = precedence(ops);
  const cs = graph.cycle
    ? { value: false, reason: `Cycle ${arrow(graph.cycle)} in the precedence graph` }
    : { value: true, reason: `Precedence graph is acyclic → serial order ${arrow(graph.order)}`
        + (graph.orders.length > 1 ? ` (${graph.orders.length} serial orders work)` : '') };
  return {
    txns: txnsOf(ops), conflicts: conflicts(ops), graph, anomalies: anomalies(ops),
    verdicts: { conflictSerializable: cs, viewSerializable: viewSerializable(ops, graph), ...recoverability(ops) },
  };
}

/* ---------------- protocol simulation ---------------- */

export function simulate(ops, protocol = 'none', tsIn = {}) {
  if (!protocol || protocol === 'none') return null;
  if (!PROTOCOL_NAMES[protocol]) throw new Error(`Unknown protocol "${protocol}" (use ${Object.keys(PROTOCOL_NAMES).join(', ')})`);
  // default timestamp = transaction number (T1 oldest), the textbook convention
  const ts = Object.fromEntries(txnsOf(ops).map(t => [t, Number(tsIn?.[T(t)] ?? tsIn?.[t] ?? t)]));
  const base = { protocol, name: PROTOCOL_NAMES[protocol], ts };
  if (protocol === 'TO' || protocol === 'thomas') return { ...base, ...timestamp(ops, ts, protocol === 'thomas') };
  if (ops.some(o => LOCK.has(o.kind)) && protocol !== 'waitDie' && protocol !== 'woundWait')
    return { ...base, ...validateLocks(ops, protocol) };
  return { ...base, ...autoLock(ops.filter(o => !LOCK.has(o.kind)), protocol, ts) };
}

function lockTable(txns) {
  const locks = {};
  const holds = t => Object.keys(locks).filter(it => locks[it].has(t));
  const counts = () => Object.fromEntries(txns.map(t => [t, holds(t).length]));
  return { locks, holds, counts, at: it => (locks[it] ||= new Map()) };
}

/* schedule already carries S/X/U: check it against the protocol's rules */
function validateLocks(ops, protocol) {
  const txns = txnsOf(ops), L = lockTable(txns), steps = [], lockPoint = {}, firstUnlock = {}, started = new Set(), viol = [];
  for (const o of ops) {
    const t = o.tx, before = L.counts();
    let bad = '', note = '';
    if (o.kind === 'S' || o.kind === 'X') {
      const m = L.at(o.item), other = [...m].find(([u, md]) => u !== t && (o.kind === 'X' || md === 'X'));
      if (other) bad = `${T(other[0])} still holds ${other[1]}(${o.item}), so ${opLabel(o)} can't be granted here`;
      else if (firstUnlock[t]) bad = `${T(t)} locks after its unlock ${opLabel(firstUnlock[t])}: the growing phase is over`;
      else if (protocol === 'conservative2PL' && started.has(t)) bad = `Conservative 2PL: ${T(t)} must hold every lock before its first read/write`;
      note = m.get(t) === 'S' && o.kind === 'X' ? 'upgrade S → X' : `${o.kind}-lock granted`;
      if (m.get(t) !== 'X') m.set(t, o.kind);
      if (!firstUnlock[t]) lockPoint[t] = steps.length;
    } else if (o.kind === 'U') {
      const m = L.at(o.item), md = m.get(t);
      if (!md) bad = `${T(t)} unlocks ${o.item} without holding it`;
      else {
        const ended = ops.some(p => p.i < o.i && p.tx === t && END.has(p.kind));
        if (!ended && (protocol === 'rigorous' || (protocol === 'strict2PL' && md === 'X')))
          bad = `${PROTOCOL_NAMES[protocol]} keeps ${protocol === 'rigorous' ? 'every' : 'each exclusive'} lock until commit, but ${T(t)} releases ${md}(${o.item}) first`;
        note = join(`release ${md}(${o.item})`, !firstUnlock[t] && 'shrinking phase starts');
        firstUnlock[t] ||= o;
        m.delete(t);
      }
    } else if (DATA.has(o.kind)) {
      started.add(t);
      const md = L.at(o.item).get(t);
      if (o.kind === 'R' ? !md : md !== 'X') bad = `${opLabel(o)} without ${o.kind === 'R' ? 'an S or X' : 'an X'} lock on ${o.item}`;
    } else {
      const rel = L.holds(t).filter(it => !ops.some(p => p.i > o.i && p.tx === t && p.kind === 'U' && p.item === it));
      rel.forEach(it => L.locks[it].delete(t));
      note = join(o.kind === 'C' ? 'commit' : 'abort', rel.length && 'releases remaining locks');
    }
    if (bad) viol.push({ at: steps.length, text: bad });
    const held = L.counts();
    steps.push({ op: o, status: bad ? 'violation' : 'ok', note: bad || note, held,
      peak: Object.fromEntries(txns.map(u => [u, Math.max(before[u], held[u])])) });
  }
  const name = PROTOCOL_NAMES[protocol];
  return {
    kind: 'validate', steps, lockPoint, violations: viol, deadlocks: [], aborted: [], ok: !viol.length,
    summary: viol.length ? `Violates ${name} at step ${viol[0].at + 1}: ${viol[0].text}` + (viol.length > 1 ? ` (+${viol.length - 1} more)` : '')
      : `Obeys ${name}. Lock points: ${txns.filter(t => lockPoint[t] != null).map(t => `${T(t)} at step ${lockPoint[t] + 1}`).join(', ')}`,
  };
}

/* plain R/W schedule: insert locks per protocol, run the given interleaving as
   a request order, block on conflicts, detect deadlock via waits-for graph */
function autoLock(input, protocol, ts) {
  const txns = txnsOf(input);
  const work = input.map(o => ({ ...o }));
  for (const t of txns) if (!work.some(o => o.tx === t && END.has(o.kind))) {
    let at = -1;
    work.forEach((o, j) => { if (o.tx === t) at = j; });
    work.splice(at + 1, 0, { i: -1, kind: 'C', tx: t, item: null, implicit: true });
  }
  work.forEach((o, s) => { o.seq = s; });
  const need = Object.fromEntries(txns.map(t => [t, {}]));
  for (const o of work) if (DATA.has(o.kind)) need[o.tx][o.item] = o.kind === 'W' || need[o.tx][o.item] === 'X' ? 'X' : 'S';
  // what may be released before commit, once the lock point is reached
  const early = protocol === '2PL' || protocol === 'conservative2PL' ? 'all' : protocol === 'strict2PL' ? 'S' : null;
  const L = lockTable(txns), pending = [...work], steps = [], deadlocks = [], lockPoint = {};
  const aborted = [], committed = [], started = new Set(), logged = new Set(), dirtyFrom = {}, writes = {};

  const request = o => {
    if (protocol === 'conservative2PL') return started.has(o.tx) ? [] : Object.entries(need[o.tx]);
    if (!DATA.has(o.kind)) return [];
    const want = o.kind === 'W' ? 'X' : 'S', have = L.locks[o.item]?.get(o.tx);
    return have === 'X' || have === want ? [] : [[o.item, want]];
  };
  const blockers = (t, it, md) => [...(L.locks[it] || [])]
    .filter(([u, m]) => u !== t && (md === 'X' || m === 'X')).map(([u, m]) => ({ u, it, m }));
  const release = (t, keep = () => false) => L.holds(t).forEach(it => { if (!keep(it)) L.locks[it].delete(t); });
  const lockPointReached = t => Object.entries(need[t]).every(([it, md]) => {
    const h = L.locks[it]?.get(t);
    return h && (md === 'S' || h === 'X');
  });

  const abort = (t, why, op = { i: -1, kind: 'A', tx: t, item: null, synthetic: true }) => {
    if (aborted.includes(t)) return;
    const peak = L.counts();
    aborted.push(t);
    release(t);
    for (let j = pending.length - 1; j >= 0; j--) if (pending[j].tx === t) pending.splice(j, 1);
    for (const it of Object.keys(writes)) writes[it] = writes[it].filter(u => u !== t);
    const hurt = txns.filter(u => dirtyFrom[u]?.has(t) && !aborted.includes(u));
    const unrec = hurt.filter(u => committed.includes(u));
    steps.push({ op, status: 'abort', note: join(why, unrec.length && `${unrec.map(T).join(', ')} already committed after reading its data: unrecoverable`), peak, held: L.counts() });
    for (const u of hurt) if (!committed.includes(u)) abort(u, `cascading rollback: read uncommitted data of ${T(t)}`);
  };

  const execute = (o, req) => {
    const t = o.tx;
    pending.splice(pending.indexOf(o), 1);
    if (o.kind === 'A') return abort(t, 'aborts (as written)', o);
    req.forEach(([it, md]) => L.at(it).set(t, md));
    started.add(t);
    const peak = L.counts();
    let note = join(req.length && `lock ${req.map(([it, md]) => `${md}(${it})`).join(', ')}`, o.implicit && 'implicit commit (not in the schedule)');
    if (o.kind === 'R') {
      const w = writes[o.item]?.at(-1);
      if (w != null && w !== t && !committed.includes(w)) {
        (dirtyFrom[t] ||= new Set()).add(w);
        note = join(note, `reads uncommitted ${T(w)}'s write`);
      }
    }
    if (o.kind === 'W') (writes[o.item] ||= []).push(t);
    if (o.kind === 'C') {
      committed.push(t);
      if (L.holds(t).length) note = join(note, 'release all locks');
      release(t);
    } else {
      if (lockPoint[t] == null && lockPointReached(t)) { lockPoint[t] = steps.length; note = join(note, 'lock point'); }
      if (lockPoint[t] != null && early) {
        const free = L.holds(t).filter(it => (early === 'all' || L.locks[it].get(t) === 'S')
          && !pending.some(p => p.tx === t && p.item === it));
        if (free.length) note = join(note, `unlock ${free.map(it => `${L.locks[it].get(t)}(${it})`).join(', ')}`);
        free.forEach(it => L.locks[it].delete(t));
      }
    }
    steps.push({ op: o, status: 'ok', note, peak, held: L.counts() });
  };

  for (let guard = 0; pending.length && guard < 20 * work.length + 50; guard++) {
    const heads = [];
    for (const o of pending) if (!heads.some(h => h.tx === o.tx)) heads.push(o);
    const waits = {};
    let moved = false;
    for (const o of heads) {
      const t = o.tx, req = request(o), block = req.flatMap(([it, md]) => blockers(t, it, md));
      if (!block.length) { execute(o, req); moved = true; break; }
      const holders = [...new Set(block.map(x => x.u))];
      const older = holders.find(u => ts[u] < ts[t]), younger = holders.filter(u => ts[u] > ts[t]);
      if (protocol === 'waitDie' && older != null) {
        abort(t, `dies: ${T(t)} (ts ${ts[t]}) is younger than holder ${T(older)} (ts ${ts[older]}); restarts later with the same timestamp`);
        moved = true; break;
      }
      if (protocol === 'woundWait' && younger.length) {
        younger.forEach(u => abort(u, `wounded by older ${T(t)} (ts ${ts[t]} < ${ts[u]}), which wants ${block.find(x => x.u === u).it}`));
        moved = true; break;
      }
      waits[t] = block;
      if (!logged.has(o.seq)) {
        logged.add(o.seq);
        const why = protocol === 'waitDie' ? `older ${T(t)} may wait` : protocol === 'woundWait' ? `younger ${T(t)} waits` : '';
        steps.push({ op: o, status: 'wait', note: join(`waits: ${block.map(x => `${T(x.u)} holds ${x.m}(${x.it})`).join(', ')}`, why), peak: L.counts(), held: L.counts() });
      }
    }
    if (moved) continue;
    // nobody can move: every waiter waits on a holder that also waits, so there is a cycle
    const edges = [];
    for (const t of Object.keys(waits).map(Number)) for (const x of waits[t]) {
      let e = edges.find(f => f.from === t && f.to === x.u);
      if (!e) edges.push(e = { from: t, to: x.u, items: [] });
      if (!e.items.includes(x.it)) e.items.push(x.it);
    }
    const nodes = txnsOf(edges.flatMap(e => [{ tx: e.from }, { tx: e.to }]));
    const cycle = findCycle(nodes, u => edges.filter(e => e.from === u).map(e => e.to));
    if (!cycle) break;
    edges.forEach(e => { e.onCycle = cycle.some((n, j) => n === e.from && cycle[j + 1] === e.to); });
    const victim = cycle.slice(0, -1).reduce((a, b) => (ts[b] > ts[a] ? b : a));
    deadlocks.push({ at: steps.length, nodes, edges, cycle, victim });
    abort(victim, `deadlock victim: youngest in cycle ${arrow(cycle)}`);
  }

  const waited = steps.filter(s => s.status === 'wait').length;
  const summary = [
    ...deadlocks.map(d => `Deadlock at step ${d.at + 1}: ${d.edges.filter(e => e.onCycle).map(e => `${T(e.from)} waits for ${T(e.to)} (${e.items.join(', ')})`).join(', ')}; ${T(d.victim)} rolled back`),
    aborted.length ? `Rolled back: ${aborted.map(T).join(', ')}` : '',
    !aborted.length && (waited ? `${waited} wait${waited > 1 ? 's' : ''}, no deadlock; all transactions commit` : 'No lock conflict blocks anything: runs exactly as written'),
  ].filter(Boolean).join('. ');
  return {
    kind: 'locking', steps, lockPoint, deadlocks, aborted, committed, violations: [], ok: !aborted.length,
    order: steps.filter(s => s.status === 'ok').map(s => opLabel(s.op)).join(' '), summary,
  };
}

/* basic TO (and Thomas' write rule): no waiting, a late op rolls its txn back */
function timestamp(ops, ts, thomas) {
  const rts = {}, wts = {}, aborted = [], ignored = [], steps = [];
  for (const o of ops) {
    if (LOCK.has(o.kind)) continue;
    const t = ts[o.tx], x = o.item, r = rts[x] ?? 0, w = wts[x] ?? 0;
    let status = 'ok', note = '';
    if (aborted.includes(o.tx)) { status = 'skip'; note = `${T(o.tx)} was rolled back`; }
    else if (o.kind === 'R') {
      if (t < w) { status = 'abort'; note = `TS(${T(o.tx)})=${t} < W-TS(${x})=${w}: the value is from a younger txn → roll back ${T(o.tx)}`; }
      else { rts[x] = Math.max(r, t); note = `R-TS(${x}) = ${rts[x]}`; }
    } else if (o.kind === 'W') {
      if (t < r) { status = 'abort'; note = `TS(${T(o.tx)})=${t} < R-TS(${x})=${r}: a younger txn already read ${x} → roll back ${T(o.tx)}`; }
      else if (t < w && thomas) { status = 'ignored'; note = `TS(${T(o.tx)})=${t} < W-TS(${x})=${w}: obsolete write skipped (Thomas' write rule)`; ignored.push(o.i); }
      else if (t < w) { status = 'abort'; note = `TS(${T(o.tx)})=${t} < W-TS(${x})=${w}: a younger txn already wrote ${x} → roll back ${T(o.tx)}`; }
      else { wts[x] = t; note = `W-TS(${x}) = ${t}`; }
    } else note = o.kind === 'C' ? 'commit' : 'abort (as written)';
    if (status === 'abort') aborted.push(o.tx);
    steps.push({ op: o, status, note, rts: { ...rts }, wts: { ...wts } });
  }
  const sum = [
    aborted.length ? `Rolled back: ${aborted.map(T).join(', ')} (restart with a new timestamp)` : 'Every operation passes the timestamp checks',
    ignored.length ? `${ignored.length} obsolete write${ignored.length > 1 ? 's' : ''} ignored` : '',
  ].filter(Boolean).join('. ');
  return { kind: 'timestamp', steps, aborted, ignored, deadlocks: [], lockPoint: {}, violations: [], ok: !aborted.length, summary: sum };
}

/* predict-mode question: explicit ask wins; otherwise an MSQ over verdict
   names whose answer is derived from the engine's verdicts */
const norm = s => String(s).toLowerCase().replace(/[^a-z]/g, '');
export const NONE_OPTION = 'None of these';
export function verdictAsk(ask, verdicts, keys, opsText) {
  const kind = ask?.kind || 'msq';
  const options = ask?.options || [...keys.map(k => VERDICTS[k]), NONE_OPTION];
  const q = ask?.q || `Which of these hold for the schedule \`${String(opsText).trim().replace(/\s+/g, ' ')}\`?`;
  const item = { kind, q, options, explain: ask?.explain };
  if (ask?.answer !== undefined) return { ...item, answer: ask.answer };
  const keyOf = o => Object.keys(VERDICTS).find(k => norm(k) === norm(o) || norm(VERDICTS[k]) === norm(o));
  const truth = options.map(o => {
    if (norm(o) === norm(NONE_OPTION)) return 'none';
    const k = keyOf(o);
    if (!k) throw new Error(`ask.answer is missing and option "${o}" is not a verdict name`);
    if (verdicts[k].value == null) throw new Error(`can't derive the answer: ${VERDICTS[k]} is unknown here`);
    return verdicts[k].value;
  });
  const anyTrue = truth.includes(true);
  const yes = truth.flatMap((v, i) => (v === true || (v === 'none' && !anyTrue) ? [i] : []));
  if (kind === 'msq') {
    if (!yes.length) throw new Error('ask has no correct option; add "None of these"');
    return { ...item, answer: yes };
  }
  if (kind === 'mcq' && yes.length === 1) return { ...item, answer: yes[0] };
  throw new Error('give ask.answer: an mcq needs exactly one true option');
}
