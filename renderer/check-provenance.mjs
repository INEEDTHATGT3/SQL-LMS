#!/usr/bin/env node
/**
 * check-provenance.mjs — enforce the sourced-vs-synthesised rule from content/AUTHORING.md.
 *
 * Every problem in every lesson is exactly one of:
 *   sourced      — platform !== 'drill', MUST carry ref + url, MUST exist in problems.json
 *   synthesised  — platform === 'drill', MUST carry a statement
 *
 * Exits 1 on any error so it can gate CI.
 * Usage:  node renderer/check-provenance.mjs [--only=<moduleId>]
 */
import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.join(process.cwd(), 'content');
const ONLY = (process.argv.slice(2).find(a => a.startsWith('--only=')) || '').split('=')[1] || null;
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const bank = read(path.join(CONTENT, 'problems.json'));
const mods = read(path.join(CONTENT, 'modules.json'));

const bankIds = new Set();
for (const items of Object.values(bank.modules)) for (const p of items) bankIds.add(p.id);

let errs = 0, warns = 0, sourced = 0, drills = 0;

for (const mod of mods.modules) {
  if (mod.status !== 'active') continue;
  if (ONLY && mod.id !== ONLY) continue;

  const dir = [path.join(CONTENT, mod.id), path.join(CONTENT, `${mod.num}_${mod.id}`)]
    .find(c => fs.existsSync(c));
  if (!dir) continue;

  for (const f of fs.readdirSync(dir).filter(x => /^L\d+\.json$/.test(x))) {
    const lesson = read(path.join(dir, f));
    const where = `${mod.id}/${f}`;
    const problems = [];
    (lesson.sections || []).forEach(s => (s.blocks || []).forEach(b => {
      if (b.type === 'problem') problems.push(b);
      if (b.type === 'problems') problems.push(...(b.items || []));
    }));

    const seen = new Set();
    for (const p of problems) {
      const tag = `${where} [${p.id || '<no id>'}]`;

      if (!p.id) { console.log(`  ✗ ${tag}: missing id`); errs++; continue; }
      if (seen.has(p.id)) { console.log(`  ✗ ${tag}: duplicate id in this lesson`); errs++; }
      seen.add(p.id);

      if (!p.platform) { console.log(`  ✗ ${tag}: missing platform — must be a source name or "drill"`); errs++; continue; }

      if (p.platform === 'drill') {
        drills++;
        if (!p.statement) { console.log(`  ✗ ${tag}: drill has no statement`); errs++; }
        if (p.url) { console.log(`  ✗ ${tag}: drill must not carry a url — if it has a home, it is sourced`); errs++; }
      } else {
        sourced++;
        if (!p.ref) { console.log(`  ✗ ${tag}: sourced problem missing ref`); errs++; }
        if (!p.url) { console.log(`  ✗ ${tag}: sourced problem missing url`); errs++; }
        if (!bankIds.has(p.id)) { console.log(`  ✗ ${tag}: not in problems.json — add it to the bank first`); errs++; }
        if (!p.sheet) { console.log(`  ⚠ ${tag}: sourced problem has no sheet`); warns++; }
      }

      if (p.tier !== lesson.level) { console.log(`  ⚠ ${tag}: tier ${p.tier} in an L${lesson.level} file`); warns++; }
    }
  }
}

console.log(`\n=== Provenance: ${sourced} sourced · ${drills} synthesised · ${errs} error(s), ${warns} warning(s) ===`);
process.exit(errs ? 1 : 0);
