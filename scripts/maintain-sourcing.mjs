#!/usr/bin/env node
/**
 * maintain-sourcing.mjs — recompute derived sourcing stats from the problems bank.
 *
 * The bank (content/problems.json) is the single source of truth. This script
 * regenerates the derived counts that would otherwise drift when problems are
 * appended:
 *   - content/modules.json  → per-module `sourced` block (count/byTier/bySheet)
 *   - content/problems.json → per-module `coverage` (sourced/byTier/bySheet; `overlay` preserved)
 *
 * Idempotent. Run after any bank edit.
 */
import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.join(process.cwd(), 'content');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const bank = read(path.join(CONTENT, 'problems.json'));
const mods = read(path.join(CONTENT, 'modules.json'));

let dirty = 0;

for (const mod of mods.modules) {
  const pool = bank.modules[mod.id] || [];
  const byTier = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const bySheet = {};
  for (const p of pool) {
    const t = String(p.tier);
    byTier[t] = (byTier[t] || 0) + 1;
    if (p.sheet) bySheet[p.sheet] = (bySheet[p.sheet] || 0) + 1;
  }
  const sourced = { count: pool.length, byTier, bySheet };

  const js = JSON.stringify(sourced);
  if (mod.sourced && JSON.stringify(mod.sourced) === js) {
    // unchanged
  } else {
    mod.sourced = sourced;
    dirty++;
  }

  const cov = { sourced: pool.length, byTier, bySheet,
                overlay: (bank.coverage[mod.id] || {}).overlay || {} };
  const jc = JSON.stringify(cov);
  if (bank.coverage[mod.id] && JSON.stringify(bank.coverage[mod.id]) === jc) {
    // unchanged
  } else {
    bank.coverage[mod.id] = cov;
  }
}

fs.writeFileSync(path.join(CONTENT, 'modules.json'), JSON.stringify(mods, null, 2) + '\n');
fs.writeFileSync(path.join(CONTENT, 'problems.json'), JSON.stringify(bank, null, 2) + '\n');
console.log(`maintain-sourcing: updated ${dirty} module sourced block(s) + coverage.`);