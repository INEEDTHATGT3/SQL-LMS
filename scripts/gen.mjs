#!/usr/bin/env node
/* Build-time artifacts derived from content/ (run before dev/build):
     src/generated/answer-keys.json  { "<mod>_L<n>": { <qkey>: key } }  (analytics)
     src/generated/search-index.json [{ id, level, title, module, ... }]
   Throws on a qkey collision inside a lesson - two stems hashing alike would
   silently share one stored answer. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { qkey } from '../src/lib/qkey.js';
import { answerKey } from '../src/lib/grade.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'src', 'generated');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const mods = read(path.join(CONTENT, 'modules.json'));
const keys = {}, index = [];

export function* questionItems(lesson) {
  for (const it of lesson.placementQuiz || []) yield it;
  for (const s of lesson.sections || [])
    for (const b of s.blocks || []) {
      if (b.type === 'quiz') yield* b.items || [];
      if (b.type === 'question') yield b;
    }
}

for (const mod of mods.modules) {
  for (const { level } of mods.levels) {
    const file = path.join(CONTENT, mod.id, `L${level}.json`);
    if (!fs.existsSync(file)) continue;
    const lesson = read(file);
    const id = `${mod.id}_L${level}`;

    const k = keys[id] = {};
    for (const it of questionItems(lesson)) {
      const q = qkey(it.q);
      if (k[q] !== undefined && JSON.stringify(k[q]) !== JSON.stringify(answerKey(it)))
        throw new Error(`${id}: qkey collision ${q} on "${it.q}"`);
      k[q] = answerKey(it);
    }

    const problems = [], sections = [];
    for (const s of lesson.sections || []) {
      sections.push(s.title);
      for (const b of s.blocks || []) {
        const items = b.type === 'problems' ? b.items : b.type === 'problem' || b.type === 'sql-exercise' ? [b] : [];
        for (const p of items || []) problems.push({ t: p.title || p.prompt || '', pat: (p.patterns || []).join(' ') });
      }
    }
    index.push({
      id, level, title: lesson.title, tagline: lesson.tagline || '',
      module: mod.title, num: mod.num, sections,
      terms: (lesson.glossary || []).map(g => g.term), problems
    });
  }
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'answer-keys.json'), JSON.stringify(keys));
fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify(index));
console.log(`gen: ${index.length} lessons, ${Object.values(keys).reduce((a, k) => a + Object.keys(k).length, 0)} answer keys`);
