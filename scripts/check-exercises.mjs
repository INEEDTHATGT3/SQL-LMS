#!/usr/bin/env node
/* Exercise gate: every authored SQL solution/stage must run clean on every
   dataset it lists, and each *_edge dataset must share its base's schema.

   Usage:
     node scripts/check-exercises.mjs                    lessons only
     node scripts/check-exercises.mjs --lab              + content/lab/*.json
     node scripts/check-exercises.mjs --explain <dataset-or-.sql-path> "<sql>"
       prints EXPLAIN (FORMAT JSON); the target is a dataset name
       (content/datasets/<name>.sql) or a path to any .sql file
       (e.g. harness/init.sql).

   Exit 1 on any SQL error, parity break or unknown dataset; empty result
   sets are warnings only. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, runOn, explainOn } from '../src/engines/sqlrunner.js';
import { compare } from '../src/engines/resultcompare.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATASETS = path.join(ROOT, 'content', 'datasets');
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const rel = p => path.relative(ROOT, p).replaceAll('\\', '/');

let errs = 0, warns = 0;
const err = m => { errs++; console.log(`  ✗ ${m}`); };
const warn = m => { warns++; console.log(`  ⚠ ${m}`); };

/* ---------- dataset loading ---------- */
const dbs = new Map();   // dataset name -> PGlite

async function getDb(name) {
  if (dbs.has(name)) return dbs.get(name);
  const file = path.join(DATASETS, `${name}.sql`);
  if (!fs.existsSync(file)) throw new Error(`unknown dataset "${name}"`);
  const pg = await createDb(fs.readFileSync(file, 'utf8'));
  dbs.set(name, pg);
  return pg;
}

async function schemaOfDataset(name) {
  const pg = await getDb(name);
  const r = await runOn(pg, `SELECT table_name, column_name, data_type
    FROM information_schema.columns WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position`);
  if (r.error) throw new Error(`${name}: ${r.error}`);
  const tables = {};
  for (const [t, c, dt] of r.rows) (tables[t] ||= []).push(`${c} ${dt}`);
  return tables;
}

/* ---------- --explain mode ---------- */
const argv = process.argv.slice(2);
const ei = argv.indexOf('--explain');
if (ei !== -1) {
  const [target, sql] = argv.slice(ei + 1, ei + 3);
  if (!target || !sql) {
    console.error('usage: node scripts/check-exercises.mjs --explain <dataset-or-.sql-path> "<sql>"');
    process.exit(2);
  }
  const looksLikePath = target.endsWith('.sql') || target.includes('/') || target.includes('\\');
  const file = looksLikePath ? path.resolve(ROOT, target) : path.join(DATASETS, `${target}.sql`);
  if (!fs.existsSync(file)) { console.error(`no such SQL file: ${file}`); process.exit(2); }
  try {
    const pg = await createDb(fs.readFileSync(file, 'utf8'));
    try {
      const plan = await explainOn(pg, sql);
      console.log(JSON.stringify(plan, null, 2));
    } finally { await pg.close(); }
  } catch (e) {
    console.error(e?.message || String(e));
    process.exit(1);
  }
  process.exit(0);
}

/* ---------- content walking ---------- */
function* blocksOf(node) {
  if (Array.isArray(node)) { for (const x of node) yield* blocksOf(x); return; }
  if (!node || typeof node !== 'object') return;
  if (node.type === 'predict' && Array.isArray(node.reveal)) yield* blocksOf(node.reveal);
  if (node.type && node.type !== 'predict') yield node;
  if (Array.isArray(node.sections)) yield* blocksOf(node.sections);
  if (Array.isArray(node.blocks)) yield* blocksOf(node.blocks);
  if (node.type === 'quiz' || node.type === 'problems') { /* items handled by caller type */ }
}

/* every runnable thing in one lesson/lab file */
function collect(file, lesson) {
  const found = { exercises: [], stages: [] };
  const pushExercise = (id, ex, where, approaches) => {
    if (!ex) return;
    if (!ex.solution) err(`${where}: exercise "${id}" without solution`);
    if (!(ex.datasets || []).length) err(`${where}: exercise "${id}" lists no datasets`);
    found.exercises.push({ id, ...ex, where, approaches: approaches || ex.approaches || [] });
  };
  for (const b of blocksOf(lesson)) {
    if (b.type === 'sql-exercise') pushExercise(b.id, b, rel(file), b.approaches);
    else if (b.type === 'problems') {
      for (const p of b.items || []) if (p.exercise) pushExercise(p.id, p.exercise, rel(file), p.approaches);
    } else if (b.type === 'problem' && b.exercise) pushExercise(b.id, b.exercise, rel(file), b.approaches);
    else if (b.type === 'query-trace') {
      if (!b.dataset) err(`${rel(file)}: query-trace without dataset`);
      for (const s of b.stages || []) {
        if (!s.sql) { err(`${rel(file)}: query-trace stage "${s.label || '?'}" without sql`); continue; }
        found.stages.push({ dataset: b.dataset, sql: s.sql, label: s.label || '(no label)', where: rel(file) });
      }
    }
  }
  return found;
}

async function runSql(where, what, dataset, sql) {
  let pg;
  try { pg = await getDb(dataset); }
  catch (e) { err(`${where}: ${what}: ${e.message}`); return null; }
  const r = await runOn(pg, sql);
  if (r.error) { err(`${where}: ${what} on ${dataset}: ${r.error}`); return null; }
  if (!r.rows.length) warn(`${where}: ${what} on ${dataset}: empty result`);
  return r;
}

/* ---------- main gate ---------- */
const names = fs.readdirSync(DATASETS).filter(f => f.endsWith('.sql')).map(f => f.slice(0, -4)).sort();
const bases = names.filter(n => !n.endsWith('_edge'));

console.log(`datasets: ${names.join(', ')}`);
let parityOk = 0;
for (const base of bases) {
  const edge = `${base}_edge`;
  if (!names.includes(edge)) { warn(`no _edge twin for ${base}`); continue; }
  try {
    const a = await schemaOfDataset(base);
    const b = await schemaOfDataset(edge);
    const at = Object.keys(a).sort(), bt = Object.keys(b).sort();
    if (at.join() !== bt.join()) {
      err(`parity ${base} vs ${edge}: tables ${at.join(', ')} vs ${bt.join(', ')}`);
      continue;
    }
    let bad = false;
    for (const t of at) {
      if (a[t].join(' | ') !== b[t].join(' | ')) {
        err(`parity ${base} vs ${edge}: ${t} columns [${a[t].join(', ')}] vs [${b[t].join(', ')}]`);
        bad = true;
      }
    }
    if (!bad) { parityOk++; console.log(`  ✓ ${base} ↔ ${edge}: ${at.length} tables, same columns`); }
  } catch (e) { err(`parity ${base} vs ${edge}: ${e.message}`); }
}
console.log(`parity: ${parityOk}/${bases.length} edge twins match their base`);

/* lesson (+ optional lab) files */
const withLab = argv.includes('--lab');
const files = [];
for (const d of fs.readdirSync(path.join(ROOT, 'content'), { withFileTypes: true })) {
  if (!d.isDirectory() || d.name === 'datasets' || d.name === 'lab') continue;
  for (const f of fs.readdirSync(path.join(ROOT, 'content', d.name)))
    if (/^L\d+\.json$/.test(f)) files.push(path.join(ROOT, 'content', d.name, f));
}
if (withLab) {
  const lab = path.join(ROOT, 'content', 'lab');
  if (fs.existsSync(lab))
    for (const f of fs.readdirSync(lab)) if (f.endsWith('.json')) files.push(path.join(lab, f));
}

let exercises = 0, runs = 0, stages = 0;
for (const file of files.sort()) {
  let lesson;
  try { lesson = readJson(file); } catch (e) { err(`${rel(file)}: invalid JSON: ${e.message}`); continue; }
  const { exercises: exs, stages: sts } = collect(file, lesson);
  for (const ex of exs) {
    exercises++;
    const approachCodes = (ex.approaches || []).map(a => {
      const c = a.code;
      const sql = typeof c === 'string' ? c : (c && (c.pg || c.code));
      return { name: a.name || 'approach', sql };
    }).filter(x => typeof x.sql === 'string' && x.sql.trim());
    for (const ds of ex.datasets || []) {
      runs++;
      const expected = await runSql(ex.where, `exercise "${ex.id}"`, ds, ex.solution);
      for (const ap of approachCodes) {
        runs++;
        const got = await runSql(ex.where, `approach "${ap.name}" of "${ex.id}"`, ds, ap.sql);
        if (!expected || !got) continue;
        const cmp = compare(expected, got, { orderMatters: ex.orderMatters, floatTol: ex.floatTol, checkColumnNames: ex.checkColumnNames });
        if (!cmp.ok) err(`${ex.where}: approach "${ap.name}" of exercise "${ex.id}" disagrees with solution on ${ds}: ${cmp.reason}`);
      }
    }
  }
  for (const st of sts) {
    stages++;
    if (!st.dataset) continue;                       // already reported
    await runSql(st.where, `trace stage "${st.label}"`, st.dataset, st.sql);
  }
}

console.log(`\n=== check-exercises: ${files.length} files · ${exercises} exercises (${runs} runs) · ${stages} trace stages · ${errs} error(s), ${warns} warning(s) ===`);
for (const pg of dbs.values()) await pg.close().catch(() => {});
process.exit(errs ? 1 : 0);
