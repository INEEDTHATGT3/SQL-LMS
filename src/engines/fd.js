/* Functional dependencies & normalization engine. Pure: no React, no DOM.

   Input forms accepted everywhere:
     attrs  "ABCDE" (one letter each) | ["emp_id", "name", ...] | "a, b, c"
     fds    [["AB","C"], ...] | [["emp_id"], ["name"]] | "AB->C" | { lhs, rhs }
   Internally an attribute is a string, a set is an array kept in schema order,
   an FD is { lhs: string[], rhs: string[] }.
   Algorithms: Korth (DB System Concepts ch 7) closure / canonical cover /
   3NF synthesis / dependency preservation; Ullman chase; CMU 15-445 BCNF split
   (R1 = X+ within Ri, R2 = Ri - (X+ - X)); Gate Smashers key-finding trick. */

const uniq = a => [...new Set(a)];
const subset = (a, b) => a.every(x => b.includes(x));
const sameSet = (a, b) => subset(a, b) && subset(b, a);
const minus = (a, b) => a.filter(x => !b.includes(x));
const ord = (s, A) => A
  ? [...A.filter(a => s.includes(a)), ...uniq(s.filter(a => !A.includes(a))).sort()]
  : uniq(s).sort();
const isLetters = A => A.every(a => a.length === 1);

function* combos(arr, k, from = 0, pre = []) {
  if (pre.length === k) { yield pre; return; }
  for (let i = from; i <= arr.length - k + pre.length; i++) yield* combos(arr, k, i + 1, [...pre, arr[i]]);
}
/* non-empty subsets, smallest first, schema order within a size */
function* subsets(arr) { for (let k = 1; k <= arr.length; k++) yield* combos(arr, k); }

/* ---------- parsing & display ---------- */
export function parseAttrs(a) {
  if (Array.isArray(a)) return uniq(a.map(x => String(x).trim()).filter(Boolean));
  const s = String(a ?? '').trim();
  return uniq(/[\s,]/.test(s) ? s.split(/[\s,]+/).filter(Boolean) : [...s]);
}
function side(x, A) {
  if (Array.isArray(x)) return parseAttrs(x);
  const s = String(x ?? '').trim();
  return A?.includes(s) ? [s] : parseAttrs(s);
}
export function parseFds(fds, attrs) {
  const A = attrs && parseAttrs(attrs);
  return (fds || []).map(f => {
    let l, r;
    if (typeof f === 'string') [l, r] = f.split(/->|→/);
    else if (Array.isArray(f)) [l, r] = f;
    else if (f) ({ lhs: l, rhs: r } = f);
    if (l === undefined || r === undefined) throw new Error(`bad FD ${JSON.stringify(f)}`);
    return { lhs: side(l, A), rhs: side(r, A) };
  });
}
/* validated entry point: every FD attribute must belong to the schema */
export function relation(attrs, fds) {
  const A = parseAttrs(attrs);
  if (!A.length) throw new Error('relation has no attributes');
  const F = parseFds(fds, A);
  for (const f of F) for (const a of [...f.lhs, ...f.rhs])
    if (!A.includes(a)) throw new Error(`FD ${fdStr(f)} uses unknown attribute "${a}"`);
  return { A, F };
}
export const setStr = s => !s.length ? '∅' : isLetters(s) ? s.join('') : s.join(', ');
export function fdStr(f) {
  const all = [...f.lhs, ...f.rhs];
  return setStr(f.lhs) + (isLetters(all) ? '→' : ' → ') + setStr(f.rhs);
}
export const keysStr = ks => ks.map(k => isLetters(k) || k.length === 1 ? setStr(k) : `{${setStr(k)}}`).join(', ');
export const relStr = (name, attrs) => `${name}(${setStr(attrs)})`;

/* ---------- closure, keys ---------- */
export function closure(X, fds, attrs) {
  const A = attrs && parseAttrs(attrs), F = parseFds(fds, A);
  let c = side(X, A);
  const steps = [];
  for (let changed = true; changed;) {
    changed = false;
    for (const f of F) {
      if (!subset(f.lhs, c)) continue;
      const added = minus(f.rhs, c);
      if (!added.length) continue;
      c = [...c, ...added];
      changed = true;
      steps.push({ using: fdStr(f), added: ord(added, A), closure: ord(c, A) });
    }
  }
  return { closure: ord(c, A), steps };
}

export function isSuperkey(X, attrs, fds) {
  const A = parseAttrs(attrs);
  return subset(A, closure(X, fds, A).closure);
}

/* Gate Smashers trick: attributes on no RHS are in every key; attributes only
   on a RHS are in none (only when F lives inside the schema - for a sub-relation
   an outside attribute may be what derives them). Search the rest by size,
   skipping supersets of keys already found. */
export function keySearch(attrs, fds) {
  const A = parseAttrs(attrs), F = parseFds(fds, A);
  const rhs = uniq(F.flatMap(f => minus(f.rhs, f.lhs)));
  const lhs = uniq(F.flatMap(f => f.lhs));
  const essential = A.filter(a => !rhs.includes(a));
  const inside = F.every(f => subset([...f.lhs, ...f.rhs], A));
  const pool = A.filter(a => rhs.includes(a) && (!inside || lhs.includes(a)));
  // ponytail: exhaustive over the pool, fine for textbook sizes; needs a smarter search past ~16
  if (pool.length > 16) throw new Error(`key search over ${pool.length} attributes is too large`);
  const keys = [], tried = [];
  for (let k = 0; k <= pool.length; k++) {
    for (const S of combos(pool, k)) {
      const X = ord([...essential, ...S], A);
      if (!X.length || keys.some(key => subset(key, X))) continue;
      const c = closure(X, F, A).closure;
      const key = subset(A, c);
      tried.push({ set: X, closure: c, key });
      if (key) keys.push(X);
    }
  }
  return { keys, essential, pool, tried };
}
export const candidateKeys = (attrs, fds) => keySearch(attrs, fds).keys;
export function primeAttrs(attrs, fds) {
  const A = parseAttrs(attrs);
  return ord(uniq(candidateKeys(A, fds).flat()), A);
}

/* superkeys = supersets of some candidate key; inclusion-exclusion over keys */
export function superkeyTerms(attrs, fds) {
  const A = parseAttrs(attrs), keys = candidateKeys(A, fds), n = A.length;
  const terms = [];
  for (let k = 1; k <= keys.length; k++)
    for (const group of combos(keys, k)) {
      const union = ord(uniq(group.flat()), A);
      terms.push({ keys: group, union, sign: k % 2 ? 1 : -1, value: 2 ** (n - union.length) });
    }
  return terms;
}
export const superkeyCount = (attrs, fds) => superkeyTerms(attrs, fds).reduce((s, t) => s + t.sign * t.value, 0);

/* ---------- covers ---------- */
export const splitFds = fds => parseFds(fds).flatMap(f => minus(f.rhs, f.lhs).map(a => ({ lhs: f.lhs, rhs: [a] })));
function mergeByLhs(F) {
  const out = [];
  for (const f of F) {
    const g = out.find(x => sameSet(x.lhs, f.lhs));
    if (g) g.rhs = uniq([...g.rhs, ...f.rhs]); else out.push({ lhs: f.lhs, rhs: [...f.rhs] });
  }
  return out;
}
export const implies = (fds, f, attrs) => subset(f.rhs, closure(f.lhs, fds, attrs).closure);

export function minimalCover(fds, attrs) {
  const A = attrs && parseAttrs(attrs);
  let F = splitFds(parseFds(fds, A));
  const steps = [{ phase: 'split', text: F.map(fdStr).join(', ') }];
  for (let i = 0; i < F.length; i++) {
    for (const b of [...F[i].lhs]) {
      if (F[i].lhs.length < 2) break;
      const rest = minus(F[i].lhs, [b]);
      const c = closure(rest, F, A).closure;
      const remove = subset(F[i].rhs, c);
      const fd = fdStr(F[i]);
      if (remove) F[i] = { lhs: rest, rhs: F[i].rhs };
      steps.push({ phase: 'lhs', fd, attr: b, rest, closure: c, remove, after: fdStr(F[i]) });
    }
  }
  const before = F.length;
  F = F.filter((f, i) => F.findIndex(g => sameSet(g.lhs, f.lhs) && sameSet(g.rhs, f.rhs)) === i);
  if (F.length < before) steps.push({ phase: 'dedupe', text: F.map(fdStr).join(', ') });
  for (let i = 0; i < F.length;) {
    const rest = F.filter((_, j) => j !== i);
    const c = closure(F[i].lhs, rest, A).closure;
    const remove = subset(F[i].rhs, c);
    steps.push({ phase: 'redundant', fd: fdStr(F[i]), lhs: F[i].lhs, closure: c, remove });
    if (remove) F = rest; else i++;
  }
  return { cover: F, canonical: mergeByLhs(F), steps };
}

export function equivalent(F, G, attrs) {
  const A = attrs && parseAttrs(attrs);
  const f = parseFds(F, A), g = parseFds(G, A), rows = [];
  for (const [from, to, under] of [[f, g, 'F'], [g, f, 'G']])
    for (const d of to) {
      const c = closure(d.lhs, from, A).closure;
      rows.push({ under, fd: fdStr(d), closure: c, ok: subset(d.rhs, c) });
    }
  const fCoversG = rows.filter(r => r.under === 'F').every(r => r.ok);
  const gCoversF = rows.filter(r => r.under === 'G').every(r => r.ok);
  return { equivalent: fCoversG && gCoversF, fCoversG, gCoversF, rows };
}

/* any valid minimal cover of F (they are not unique); merged RHS accepted */
export function isMinimalCover(G, F, attrs) {
  const A = attrs && parseAttrs(attrs), g = splitFds(parseFds(G, A));
  if (!equivalent(F, g, A).equivalent) return false;
  return g.every(f =>
    !(f.lhs.length > 1 && f.lhs.some(b => subset(f.rhs, closure(minus(f.lhs, [b]), g, A).closure))) &&
    !subset(f.rhs, closure(f.lhs, g.filter(h => h !== f), A).closure));
}

/* FDs of F+ that hold on S, as a minimal cover */
export function project(fds, S, attrs) {
  const A = attrs && parseAttrs(attrs), sub = side(S, A), F = parseFds(fds, A), out = [];
  // ponytail: 2^|S| closures, fine for textbook relations (<= ~12 attrs)
  for (const X of subsets(sub)) {
    const r = minus(closure(X, F, A).closure.filter(a => sub.includes(a)), X);
    if (r.length) out.push({ lhs: X, rhs: r });
  }
  return minimalCover(out, sub).cover;
}

/* ---------- normal forms ---------- */
export const NF = ['1NF', '2NF', '3NF', 'BCNF'];

/* one row per given FD (checking F is enough for 3NF/BCNF of R itself, Korth
   7.3); 2NF is tested on every proper subset of every key, because a partial
   dependency can be implied without appearing in F. */
export function nfCheck(attrs, fds) {
  const { A, F } = relation(attrs, fds);
  const keys = candidateKeys(A, F), prime = ord(uniq(keys.flat()), A);
  const sk = X => subset(A, closure(X, F, A).closure);
  const judge = (f, implied = false) => {
    const rhs = minus(f.rhs, f.lhs), L = setStr(f.lhs), fd = fdStr(f) + (implied ? ' (implied)' : '');
    const yes = why => ({ ok: true, why }), no = why => ({ ok: false, why });
    if (!rhs.length) return { fd, trivial: true, nf2: yes('trivial'), nf3: yes('trivial'), bcnf: yes('trivial') };
    const isSk = sk(f.lhs), np = rhs.filter(a => !prime.includes(a));
    const part = keys.find(k => f.lhs.length < k.length && subset(f.lhs, k));
    return {
      fd, implied,
      bcnf: isSk ? yes(`${L} is a superkey`) : no(`${L} is not a superkey`),
      nf3: isSk ? yes(`${L} is a superkey`) : !np.length ? yes(`${setStr(rhs)} is prime`)
        : no(`${L} not a superkey, ${setStr(np)} non-prime`),
      nf2: isSk ? yes(`${L} is a superkey`) : !np.length ? yes(`${setStr(rhs)} is prime`)
        : part ? no(`partial: ${L} ⊂ key ${setStr(part)}, ${setStr(np)} non-prime`)
        : yes(`${L} is not part of a key`)
    };
  };
  const rows = F.map(f => judge(f));
  const partial = [];
  for (const key of keys)
    for (const S of subsets(key)) {
      if (S.length === key.length) continue;
      const np = minus(closure(S, F, A).closure, S).filter(a => !prime.includes(a));
      if (np.length && !partial.some(p => subset(p.lhs, S) && subset(np, p.rhs))) partial.push({ lhs: S, rhs: np, key });
    }
  if (partial.length && rows.every(r => r.nf2.ok)) rows.push(...partial.map(p => judge(p, true)));
  const bad3 = rows.find(r => !r.nf3.ok), badB = rows.find(r => !r.bcnf.ok);
  const [highest, why] = partial.length
    ? ['1NF', `Not 2NF: ${fdStr(partial[0])} is a partial dependency (${setStr(partial[0].lhs)} ⊂ key ${setStr(partial[0].key)}, ${setStr(partial[0].rhs)} non-prime).`]
    : bad3 ? ['2NF', `No partial dependency, but ${bad3.fd} breaks 3NF: ${bad3.nf3.why}.`]
    : badB ? ['3NF', `Every FD has a superkey LHS or a prime RHS, but ${badB.fd} breaks BCNF: ${badB.bcnf.why}.`]
    : ['BCNF', 'Every non-trivial FD has a superkey on its left side.'];
  return { keys, prime, nonPrime: minus(A, prime), rows, partial, highest, why };
}
export const highestNF = (attrs, fds) => nfCheck(attrs, fds).highest;

/* ---------- decomposition ---------- */
/* Deterministic choice: given FDs first, in author order (LHS inside Ri); then
   every subset of Ri, smallest first in schema order. First X with
   X+ ∩ Ri ⊋ X and X+ ⊉ Ri is the violation. */
function bcnfViolation(R, F, A) {
  const test = X => {
    const c = closure(X, F, A).closure.filter(a => R.includes(a));
    return c.length > X.length && c.length < R.length ? { lhs: X, rhs: minus(c, X), within: c } : null;
  };
  for (const f of F) if (subset(f.lhs, R)) { const v = test(f.lhs); if (v) return v; }
  for (const X of subsets(R)) { if (X.length === R.length) break; const v = test(X); if (v) return v; }
  return null;
}
export function bcnfDecompose(attrs, fds, name = 'R') {
  const A = parseAttrs(attrs), F = parseFds(fds, A), steps = [];
  const node = (R, nm) => {
    const n = { name: nm, attrs: R, keys: candidateKeys(R, F) };
    const v = bcnfViolation(R, F, A);
    if (!v) return n;
    const R1 = v.within, R2 = ord(minus(R, v.rhs), A);
    n.split = fdStr(v);
    steps.push(`${relStr(nm, R)}: ${n.split} violates BCNF (${setStr(v.lhs)}⁺ ∩ ${nm} = ${setStr(R1)}, not a superkey) → ${relStr(nm + '1', R1)}, ${relStr(nm + '2', R2)}`);
    n.children = [node(R1, nm + '1'), node(R2, nm + '2')];
    return n;
  };
  const tree = node(A, name);
  return { tree, leaves: leavesOf(tree), steps };
}

/* Korth 3NF synthesis: schema per canonical-cover FD, add a key if no schema
   holds one, drop schemas contained in another. */
export function synthesize3NF(attrs, fds, name = 'R') {
  const A = parseAttrs(attrs), F = parseFds(fds, A);
  const { canonical } = minimalCover(F, A);
  const steps = [`Canonical cover: {${canonical.map(fdStr).join(', ')}}`];
  let schemas = canonical.map(f => ({ attrs: ord(uniq([...f.lhs, ...f.rhs]), A), edge: fdStr(f) }));
  const keys = candidateKeys(A, F);
  const holder = schemas.find(s => keys.some(k => subset(k, s.attrs)));
  if (holder) steps.push(`(${setStr(holder.attrs)}) already contains a candidate key`);
  else {
    schemas.push({ attrs: keys[0], edge: 'key' });
    steps.push(`No schema contains a candidate key → add (${setStr(keys[0])})`);
  }
  schemas = schemas.filter((s, i) => {
    const t = schemas.find((u, j) => j !== i && subset(s.attrs, u.attrs) && (s.attrs.length < u.attrs.length || j < i));
    if (t) steps.push(`(${setStr(s.attrs)}) ⊆ (${setStr(t.attrs)}) → removed`);
    return !t;
  });
  const children = schemas.map((s, i) => ({ name: name + (i + 1), attrs: s.attrs, keys: candidateKeys(s.attrs, F), edge: s.edge }));
  const tree = { name, attrs: A, keys, children };
  return { tree, leaves: children, steps };
}
export const leavesOf = t => t.children?.length ? t.children.flatMap(leavesOf) : [t];

/* ---------- lossless join & dependency preservation ---------- */
export function losslessBinary(r1, r2, fds, attrs) {
  const A = attrs && parseAttrs(attrs), R1 = side(r1, A), R2 = side(r2, A);
  const common = R1.filter(a => R2.includes(a)), c = closure(common, fds, A).closure;
  const into = subset(R1, c) ? R1 : subset(R2, c) ? R2 : null;
  return {
    lossless: !!into, common, closure: c,
    reason: into ? `common ${setStr(common)}, ${setStr(common)}⁺ = ${setStr(c)} ⊇ (${setStr(into)})`
      : `common ${setStr(common)} is a superkey of neither side (${setStr(common)}⁺ = ${setStr(c)})`
  };
}

/* Ullman chase: row per schema, a = distinguished; equate symbols on FD LHS
   agreement until nothing changes. Lossless iff some row becomes all a. */
export function chase(attrs, schemas, fds) {
  const A = parseAttrs(attrs), S = schemas.map(s => side(s, A));
  const F = splitFds(parseFds(fds, A)).filter(f => subset([...f.lhs, ...f.rhs], A));
  const T = S.map((s, i) => A.map((a, j) => s.includes(a) ? 'a' : `b${i + 1},${j + 1}`));
  let passes = 0;
  for (let changed = true; changed; passes++) {
    changed = false;
    for (const f of F) {
      const L = f.lhs.map(a => A.indexOf(a)), j = A.indexOf(f.rhs[0]);
      for (let r = 0; r < T.length; r++) for (let s = r + 1; s < T.length; s++) {
        const x = T[r][j], y = T[s][j];
        if (x === y || !L.every(l => T[r][l] === T[s][l])) continue;
        const keep = x === 'a' || (y !== 'a' && x < y) ? x : y, drop = keep === x ? y : x;
        for (const row of T) if (row[j] === drop) row[j] = keep;
        changed = true;
      }
    }
  }
  const row = T.findIndex(r => r.every(v => v === 'a'));
  return { lossless: row >= 0, row, tableau: T, passes };
}

/* Korth 7.4.4: grow LHS through each schema's local closure; no F+ needed */
export function dependencyPreserving(attrs, schemas, fds) {
  const A = parseAttrs(attrs), S = schemas.map(s => side(s, A)), F = parseFds(fds, A);
  const rows = F.map(f => {
    let res = [...f.lhs];
    for (let changed = true; changed;) {
      changed = false;
      for (const s of S) {
        const add = minus(closure(res.filter(a => s.includes(a)), F, A).closure.filter(a => s.includes(a)), res);
        if (add.length) { res = [...res, ...add]; changed = true; }
      }
    }
    return { fd: fdStr(f), result: ord(res, A), ok: subset(f.rhs, res) };
  });
  return { preserving: rows.every(r => r.ok), lost: rows.filter(r => !r.ok).map(r => r.fd), rows };
}

/* everything the nf-decomposition block shows */
export function normalizeRelation(rel, target = 'BCNF') {
  if (!['BCNF', '3NF'].includes(target)) throw new Error(`target must be "BCNF" or "3NF", got "${target}"`);
  const { A, F } = relation(rel.attrs, rel.fds);
  const name = rel.name || 'R', check = nfCheck(A, F);
  const done = NF.indexOf(check.highest) >= NF.indexOf(target);
  const { tree, steps } = done
    ? { tree: { name, attrs: A, keys: check.keys }, steps: [`${name} is already in ${check.highest}: no decomposition needed.`] }
    : target === 'BCNF' ? bcnfDecompose(A, F, name) : synthesize3NF(A, F, name);
  tree.nf = check.highest;
  const leaves = leavesOf(tree);
  for (const l of leaves) if (l !== tree) l.nf = nfCheck(l.attrs, project(F, l.attrs, A)).highest;
  const schemas = leaves.map(l => l.attrs);
  let lossless;
  if (leaves.length === 1) lossless = { ok: true, reason: 'single relation, nothing to join' };
  else if (leaves.length === 2) {
    const b = losslessBinary(schemas[0], schemas[1], F, A);
    lossless = { ok: b.lossless, reason: b.reason };
  } else {
    const c = chase(A, schemas, F);
    lossless = { ok: c.lossless, reason: c.lossless ? `chase: the ${leaves[c.row].name} row becomes all a's` : "chase: no row becomes all a's" };
  }
  return { name, attrs: A, fds: F, ...check, target, tree, leaves, steps, lossless, dep: dependencyPreserving(A, schemas, F) };
}

/* ---------- fd-stepper task models ---------- */
/* row: { cells: string[], blank?: { col, set | num, hide? } } - a blank cell is
   what a faded worked example asks the learner for; cells after it and the
   `hide` columns would give it away, so the block hides those too. */
export function stepperTask(task, attrs, fds, other) {
  const { A, F } = relation(attrs, fds);
  const t = String(task), cut = t.indexOf(':');
  const kind = cut < 0 ? t : t.slice(0, cut), arg = cut < 0 ? '' : t.slice(cut + 1);
  const L = isLetters(A);
  const setPh = L ? 'e.g. ABCD' : `e.g. ${A.slice(0, 2).join(', ')}`;
  switch (kind) {
    case 'closure': {
      const X = side(arg, A);
      if (!X.length || !subset(X, A)) throw new Error(`task "${t}": name attributes of R, e.g. closure:AB`);
      const { closure: c, steps } = closure(X, F, A), x = setStr(X);
      return {
        kind, input: 'set', title: `Closure ${x}⁺`, prompt: `Compute ${x}⁺.`, placeholder: setPh,
        columns: ['#', 'Using', 'Added', `${x}⁺ so far`],
        rows: [{ cells: ['0', 'start', '—', x] },
          ...steps.map((s, i) => ({ cells: [String(i + 1), s.using, setStr(s.added), setStr(s.closure)], blank: { col: 3, set: s.closure, hide: [2] } }))],
        answer: c, answerText: `${x}⁺ = ${setStr(c)}`
      };
    }
    case 'keys': {
      const k = keySearch(A, F), never = minus(A, [...k.essential, ...k.pool]);
      return {
        kind, input: 'keys', title: 'Candidate keys', prompt: 'List every candidate key.',
        placeholder: L ? 'e.g. AB, CD' : `e.g. {${A[0]}}; {${A.slice(1, 3).join(', ')}}`,
        note: `On no RHS, so in every key: ${setStr(k.essential)}. May complete a key: ${setStr(k.pool)}. Only on a RHS, never in a key: ${setStr(never)}. Supersets of a found key are skipped.`,
        columns: ['Try', 'Closure', 'Verdict'],
        rows: k.tried.map(r => ({ cells: [setStr(r.set), setStr(r.closure), r.key ? 'candidate key ✓' : 'not a superkey'], blank: { col: 1, set: r.closure } })),
        answer: k.keys, answerText: `Candidate keys: ${keysStr(k.keys)}`
      };
    }
    case 'primeAttrs': {
      let acc = [];
      const keys = candidateKeys(A, F);
      return {
        kind, input: 'set', title: 'Prime attributes', prompt: 'List the prime attributes.', placeholder: setPh,
        note: 'Prime = belongs to at least one candidate key.',
        columns: ['Candidate key', 'Prime so far'],
        rows: keys.map(key => { acc = ord(uniq([...acc, ...key]), A); return { cells: [setStr(key), setStr(acc)], blank: { col: 1, set: acc } }; }),
        answer: acc, answerText: `Prime: ${setStr(acc)} · non-prime: ${setStr(minus(A, acc))}`
      };
    }
    case 'superkeyCount': {
      const n = A.length, keys = candidateKeys(A, F), terms = superkeyTerms(A, F);
      const count = terms.reduce((s, x) => s + x.sign * x.value, 0);
      return {
        kind, input: 'num', title: 'Number of superkeys', prompt: `How many superkeys does R have (n = ${n})?`, placeholder: 'a number',
        note: `Superkey = any superset of a candidate key (${keysStr(keys)}). Inclusion–exclusion: a term fixes the union U and frees the other n − |U| attributes.`,
        columns: ['Keys', 'Union U', '± 2^(n−|U|)'],
        rows: terms.map(x => ({ cells: [x.keys.map(setStr).join(' ∪ '), setStr(x.union), `${x.sign > 0 ? '+' : '−'}2^${n - x.union.length} = ${x.sign * x.value}`], blank: { col: 2, num: x.sign * x.value } })),
        answer: count, answerText: `${count} superkeys`
      };
    }
    case 'minimalCover': {
      const m = minimalCover(F, A);
      const rows = m.steps.map(s =>
        s.phase === 'lhs' ? { cells: ['Extraneous LHS?', `${s.attr} in ${s.fd}: ${setStr(s.rest)}⁺`, setStr(s.closure), s.remove ? `yes → ${s.after}` : 'no, keep'], blank: { col: 2, set: s.closure } }
        : s.phase === 'redundant' ? { cells: ['Redundant FD?', `${s.fd}: ${setStr(s.lhs)}⁺ without it`, setStr(s.closure), s.remove ? 'yes → remove' : 'no, keep'], blank: { col: 2, set: s.closure } }
        : { cells: [s.phase === 'split' ? 'Split RHS' : 'Drop duplicates', s.text, '—', '—'] });
      return {
        kind, input: 'fds', title: 'Minimal cover', prompt: 'Give a minimal cover of F (any valid one is accepted).',
        placeholder: L ? 'e.g. A->B, B->C' : `e.g. ${A[0]} -> ${A[1] || A[0]}; …`,
        columns: ['Step', 'Check', 'Closure', 'Result'], rows,
        answer: m.cover, answerText: `Minimal cover: {${m.cover.map(fdStr).join(', ')}}`
      };
    }
    case 'equivalent': {
      if (!other) throw new Error('task "equivalent" needs `other` (the FD set G)');
      const G = relation(A, other).F, e = equivalent(F, G, A);
      const missing = e.rows.filter(r => !r.ok).map(r => `${r.fd} not implied by ${r.under}`);
      return {
        kind, input: 'choice', choices: ['Equivalent', 'Not equivalent'], title: 'F ≡ G?',
        prompt: `Is F equivalent to G = {${G.map(fdStr).join(', ')}}?`,
        columns: ['Closure under', 'FD', 'LHS⁺', 'Implied?'],
        rows: e.rows.map(r => ({ cells: [r.under, r.fd, setStr(r.closure), r.ok ? 'yes ✓' : 'no ✗'], blank: { col: 2, set: r.closure } })),
        answer: e.equivalent ? 0 : 1,
        answerText: e.equivalent ? 'Equivalent: each set implies every FD of the other.' : `Not equivalent: ${missing.join('; ')}.`
      };
    }
    default: throw new Error(`unknown task "${t}" (closure:X, keys, primeAttrs, minimalCover, superkeyCount, equivalent)`);
  }
}

function tokens(text, A) {
  const raw = isLetters(A) ? String(text).match(/[A-Za-z]/g) || [] : String(text).split(/[\s,{}()]+/).filter(Boolean);
  const by = new Map(A.map(a => [a.toLowerCase(), a]));
  const out = [];
  for (const t of raw) {
    const a = by.get(t.toLowerCase());
    if (!a) return { error: `unknown attribute "${t}"` };
    out.push(a);
  }
  return { value: ord(uniq(out), A) };
}

/* learner text -> stored value: set = name[], keys = name[][], num = number,
   fds = [lhs[], rhs[]][], choice = option index (buttons, not parsed) */
export function parseAnswer(model, text, attrs) {
  const A = parseAttrs(attrs), s = String(text ?? '').trim();
  if (!s) return { error: 'type an answer first' };
  if (model.input === 'set') return tokens(s, A);
  if (model.input === 'num') {
    const n = Number(s);
    return Number.isInteger(n) ? { value: n } : { error: 'enter a whole number' };
  }
  if (model.input === 'keys') {
    const parts = isLetters(A) ? s.split(/[^A-Za-z]+/) : s.split(/[;|\n]+|[)}]\s*,?\s*[({]/);
    const value = [];
    for (const p of parts.filter(x => x.trim())) {
      const r = tokens(p, A);
      if (r.error) return r;
      if (r.value.length) value.push(r.value);
    }
    return value.length ? { value } : { error: 'no keys found' };
  }
  if (model.input === 'fds') {
    const value = [];
    for (const p of s.split(isLetters(A) ? /[;,\n]+/ : /[;\n]+/).filter(x => x.trim())) {
      const lr = p.split(/->|→/);
      if (lr.length !== 2) return { error: `"${p.trim()}" is not of the form X -> Y` };
      const l = tokens(lr[0], A), r = tokens(lr[1], A);
      if (l.error || r.error) return l.error ? l : r;
      value.push([l.value, r.value]);
    }
    return { value };
  }
  return { error: `no text answer for ${model.kind}` };
}

export function checkAnswer(model, v, attrs, fds) {
  switch (model.input) {
    case 'set': return Array.isArray(v) && sameSet(v, model.answer);
    case 'keys': return Array.isArray(v) && v.length === model.answer.length && model.answer.every(k => v.some(x => sameSet(x, k)));
    case 'fds': return Array.isArray(v) && isMinimalCover(v, fds, attrs);
    default: return v === model.answer;
  }
}
export function showValue(model, v) {
  if (v === undefined || v === null) return '';
  switch (model.input) {
    case 'set': return setStr(v);
    case 'keys': return keysStr(v);
    case 'fds': return parseFds(v).map(fdStr).join(', ');
    case 'choice': return model.choices[v] ?? String(v);
    default: return String(v);
  }
}
export function checkBlank(blank, text, attrs) {
  if (blank.num !== undefined) return Number(String(text).trim().replace('−', '-')) === blank.num;
  const r = tokens(text, parseAttrs(attrs));
  return !r.error && sameSet(r.value, blank.set);
}
