#!/usr/bin/env node
/* Solution coverage: how much of the problem set carries an authored answer
   payload (approaches / exercise / follow-ups), per module x tier.

   Usage:
     node scripts/solution-coverage.mjs            # summary table
     node scripts/solution-coverage.mjs --missing  # list problems without approaches
     node scripts/solution-coverage.mjs --module basics
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const mods = read(path.join(CONTENT, 'modules.json'));
const args = process.argv.slice(2);
const showMissing = args.includes('--missing');
const onlyModule = args.includes('--module') ? args[args.indexOf('--module') + 1] : null;

function resolveDir(id) {
  const m = mods.modules.find(x => x.id === id);
  if (!m) return null;
  return [path.join(CONTENT, id), path.join(CONTENT, `${m.num}_${id}`)].find(fs.existsSync);
}

function problemsIn(lesson) {
  const out = [];
  for (const s of lesson.sections || [])
    for (const b of s.blocks || []) {
      if (b.type === 'problems') out.push(...(b.items || []));
      else if (b.type === 'problem') out.push(b);
      else if (b.type === 'sql-exercise') out.push(b);
    }
  return out;
}

function isPremium(p) {
  return p.sheet === 'leetcode-advanced-sql-50' || p.platform === 'leetcode-advanced-sql-50';
}

let gProb = 0, gApp = 0, gEx = 0, gFu = 0, gPrem = 0;
const missing = [];
const rows = [];

for (const mod of mods.modules) {
  if (mod.status !== 'active') continue;
  if (onlyModule && mod.id !== onlyModule) continue;
  const dir = resolveDir(mod.id);
  if (!dir) continue;
  for (const L of [1, 2, 3, 4]) {
    const f = path.join(dir, `L${L}.json`);
    if (!fs.existsSync(f)) continue;
    const lesson = read(f);
    const ps = problemsIn(lesson);
    let prob = 0, app = 0, ex = 0, fu = 0, prem = 0;
    for (const p of ps) {
      prob++;
      if (Array.isArray(p.approaches) && p.approaches.length) app++;
      else missing.push(`${mod.id}/L${L} ${p.id || '?'} ${p.title || ''}`);
      const exercise = p.type === 'sql-exercise' ? p : p.exercise;
      if (exercise && exercise.solution) ex++;
      if (Array.isArray(p.followups) && p.followups.length) fu++;
      if (isPremium(p)) prem++;
    }
    gProb += prob; gApp += app; gEx += ex; gFu += fu; gPrem += prem;
    rows.push({ mod: mod.id, level: L, prob, app, ex, fu, prem });
  }
}

const pct = (a, b) => b ? (100 * a / b).toFixed(0).padStart(3) + '%' : '  -';
console.log('module                 L   problems  approaches  exercise  followups  premium');
console.log('-'.repeat(78));
for (const r of rows) {
  if (r.prob === 0) continue;
  console.log(
    r.mod.padEnd(22),
    String(r.level).padStart(1),
    String(r.prob).padStart(9),
    `${String(r.app).padStart(6)} ${pct(r.app, r.prob)}`,
    String(r.ex).padStart(9),
    String(r.fu).padStart(10),
    String(r.prem).padStart(9)
  );
}
console.log('-'.repeat(78));
console.log(`TOTAL  problems=${gProb}  approaches=${gApp} (${pct(gApp, gProb).trim()})  exercise=${gEx}  followups=${gFu}  premium=${gPrem}`);

if (showMissing) {
  console.log(`\nWITHOUT APPROACHES (${missing.length}):`);
  for (const m of missing) console.log('  ' + m);
}
process.exit(0);