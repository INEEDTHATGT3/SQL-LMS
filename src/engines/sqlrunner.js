/* SQL runtime over PGlite (PostgreSQL compiled to WASM).

   getDb(name, loadSql) -> handle, one seeded database per dataset (cached).
   run(db, sql)         -> { columns, rows, error }  rows = arrays, last statement that returned rows
   explain(db, sql)     -> EXPLAIN (FORMAT JSON) root object ({ Plan: {...} })

   Every run happens inside BEGIN ... ROLLBACK, so learner DML/DDL never
   persists; statements that would end that transaction early are refused.
   In the browser each dataset lives in its own Web Worker: PGlite ignores
   statement_timeout (single-threaded WASM), so a runaway query is stopped by
   terminating the worker. In Node (scripts, tests) PGlite runs in-process.
   PGlite (~3MB) is always a dynamic import, so it stays out of the main chunk. */

export const TIMEOUT_MS = 3000;

/* keep dates/times as PostgreSQL text (a JS Date would shift them into the
   viewer's timezone); int8 becomes a Number when exact, else its text */
const raw = v => v;
const PARSERS = {
  1082: raw, 1083: raw, 1114: raw, 1184: raw, 1266: raw,
  20: v => { const n = Number(v); return Number.isSafeInteger(n) ? n : v; }
};

export async function createDb(seedSql) {
  const { PGlite } = await import('@electric-sql/pglite');
  const pg = new PGlite({ parsers: PARSERS });
  if (seedSql) await pg.exec(seedSql);
  return pg;
}

/* First two words of every statement, ignoring comments, strings, quoted
   identifiers and $tag$ bodies. ponytail: nested block comments are not
   tracked; PostgreSQL would reject the ones that confuse this anyway. */
const TOKEN = /(--[^\n]*|\/\*[\s\S]*?\*\/|[eE]'(?:\\[\s\S]|''|[^'\\])*'|'(?:''|[^'])*'|"(?:""|[^"])*"|\$([A-Za-z_]\w*)?\$[\s\S]*?\$\2\$)|(;)|([A-Za-z_]\w*)|(\S)/g;
export function statementHeads(sql) {
  const heads = [];
  let cur = null;
  for (const m of String(sql).matchAll(TOKEN)) {
    if (m[3]) { cur = null; continue; }
    if (m[1]) continue;
    const w = (m[4] || m[5]).toLowerCase();
    if (!cur) heads.push(cur = [w]);
    else if (cur.length < 2) cur.push(w);
  }
  return heads;
}

/* statements that would end the sandbox transaction (and so persist changes) */
export function transactionControl(sql) {
  const h = statementHeads(sql).find(([a, b]) =>
    a === 'commit' || a === 'end' || a === 'abort' || (a === 'rollback' && b !== 'to'));
  return h ? h[0].toUpperCase() : null;
}

function errText(e) {
  const m = e?.message || String(e);
  return e?.position ? `${m} (at character ${e.position})` : m;
}

/* all result sets of `sql`, run inside a transaction that is always rolled back */
async function sandboxed(pg, sql) {
  if (!statementHeads(sql).length) throw new Error('Nothing to run - the query is empty.');
  const tc = transactionControl(sql);
  if (tc) throw new Error(`${tc} is not allowed here: every run is wrapped in its own transaction and rolled back automatically.`);
  await pg.exec('BEGIN');
  try {
    // no-op under PGlite today (see header); kept so a real server build is guarded too
    await pg.exec("SET LOCAL statement_timeout = '3s'");
    return await pg.exec(sql, { rowMode: 'array' });
  } finally {
    await pg.exec('ROLLBACK');
  }
}

export async function runOn(pg, sql) {
  try {
    const res = await sandboxed(pg, sql);
    const last = res.filter(r => r.fields.length).pop();
    return last
      ? { columns: last.fields.map(f => f.name), rows: last.rows, error: null }
      : { columns: [], rows: [], error: null };
  } catch (e) {
    return { columns: [], rows: [], error: errText(e) };
  }
}

export async function explainOn(pg, sql) {
  const res = await sandboxed(pg, `EXPLAIN (FORMAT JSON) ${sql}`);
  const r = res.find(x => x.fields[0]?.name === 'QUERY PLAN');
  if (!r) throw new Error('EXPLAIN returned no plan');
  const v = r.rows[0][0];
  return (typeof v === 'string' ? JSON.parse(v) : v)[0];
}

/* ---------- dataset cache ---------- */
const cache = new Map();
const inBrowser = typeof window !== 'undefined' && typeof Worker !== 'undefined';

export function getDb(name, loadSql) {
  if (!cache.has(name)) {
    const p = Promise.resolve(loadSql(name))
      .then(text => (inBrowser ? workerDb(name, text) : nodeDb(text)));
    p.catch(() => cache.delete(name));          // a failed boot can be retried
    cache.set(name, p);
  }
  return cache.get(name);
}

async function nodeDb(text) {
  const pg = await createDb(text);
  // ponytail: no timeout in Node - authored solutions only; move to worker_threads if one ever hangs
  return { call: (op, sql) => (op === 'explain' ? explainOn(pg, sql) : runOn(pg, sql)), close: () => pg.close() };
}

function workerDb(name, text) {
  const w = new Worker(new URL('./sqlrunner.worker.js', import.meta.url), { type: 'module' });
  const pending = new Map();
  let seq = 0;
  const kill = msg => {
    w.terminate();
    cache.delete(name);                          // next getDb boots a fresh copy
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error(msg)); }
    pending.clear();
  };
  w.onmessage = ({ data }) => {
    const p = pending.get(data.id);
    if (!p) return;
    pending.delete(data.id);
    clearTimeout(p.timer);
    if ('error' in data) p.reject(new Error(data.error)); else p.resolve(data.result);
  };
  w.onerror = e => kill(`Database worker crashed: ${e.message || 'unknown error'}`);
  const call = (op, sql, ms) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = ms && setTimeout(() => kill(
      `Stopped after ${ms / 1000}s. Look for a recursive CTE without a stop condition or an accidental cross join.`), ms);
    pending.set(id, { resolve, reject, timer });
    w.postMessage({ id, op, sql });
  });
  return call('init', text, 0).then(() => ({
    call: (op, sql) => call(op, sql, TIMEOUT_MS),
    close: () => kill('closed')
  }));
}

export async function run(db, sql) {
  try { return await db.call('run', sql); }
  catch (e) { return { columns: [], rows: [], error: errText(e) }; }
}

export function explain(db, sql) {
  return db.call('explain', sql);
}

/* tables + columns of the dataset, for a schema peek */
export async function schemaOf(db) {
  const r = await run(db, `SELECT table_name, string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position)
    FROM information_schema.columns WHERE table_schema = 'public' GROUP BY table_name ORDER BY table_name`);
  if (r.error) throw new Error(r.error);
  return r.rows.map(([table, cols]) => ({ table, columns: cols.split(', ') }));
}
