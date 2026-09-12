#!/usr/bin/env node
/**
 * sync-problems.mjs — inject sourced problems from content/problems.json into lesson files.
 *
 * Contract (see content/SOURCING.md):
 *   - ADDITIVE. Synthesised drills are never touched, never removed, never reordered.
 *   - IDEMPOTENT. The generated section is rebuilt from the bank on every run.
 *   - The bank is the single source of truth. Never hand-edit the generated section.
 *
 * Usage:  node renderer/sync-problems.mjs [--dry] [--only=<moduleId>]
 */
import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.join(process.cwd(), 'content');
const SECTION_TITLE = 'Sourced Problem Set';
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const ONLY = (argv.find(a => a.startsWith('--only=')) || '').split('=')[1] || null;

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const bank = read(path.join(CONTENT, 'problems.json'));
const mods = read(path.join(CONTENT, 'modules.json'));

const KEEP = ['id', 'tier', 'title', 'platform', 'ref', 'url', 'sheet', 'sheetSection', 'difficulty', 'patterns'];

function toLessonItem(p) {
  const out = {};
  for (const k of KEEP) {
    if (p[k] === undefined || p[k] === null) continue;
    if (Array.isArray(p[k]) && p[k].length === 0) continue;
    out[k] = p[k];
  }
  return out;
}

function sheetLabel(items) {
  const sheets = [...new Set(items.map(i => i.sheet).filter(Boolean))];
  const names = { 'leetcode-sql-50': 'LeetCode SQL 50', 'hackerrank-sql-58': 'HackerRank SQL',
                  'leetcode-advanced-sql-50': 'LeetCode Advanced SQL 50', 'datalemur': 'DataLemur',
                  'stratascratch': 'StrataScratch', 'pgexercises': 'PGExercises' };
  return sheets.map(s => names[s] || s).join(' · ');
}

function buildSection(items) {
  return {
    title: SECTION_TITLE,
    blocks: [
      { type: 'callout', tone: 'blue',
        md: `${items.length} sourced problem${items.length === 1 ? '' : 's'} from ${sheetLabel(items)}. ` +
            `Titles link to the platform. Generated from \`content/problems.json\` by \`renderer/sync-problems.mjs\` — do not hand-edit this section.` },
      { type: 'problems', items }
    ]
  };
}

let touched = 0, injected = 0;
const zero = [];

for (const mod of mods.modules) {
  if (mod.status !== 'active') continue;
  if (ONLY && mod.id !== ONLY) continue;

  const dir = [path.join(CONTENT, mod.id), path.join(CONTENT, `${mod.num}_${mod.id}`)]
    .find(c => fs.existsSync(c));
  if (!dir) { console.log(`  ! ${mod.id}: no content directory`); continue; }

  const pool = bank.modules[mod.id] || [];
  console.log(`\n◆ ${mod.id}`);

  for (const L of [1, 2, 3, 4]) {
    const file = path.join(dir, `L${L}.json`);
    if (!fs.existsSync(file)) continue;

    const lesson = read(file);
    const items = pool.filter(p => p.tier === L).map(toLessonItem);

    const before = (lesson.sections || []).length;
    lesson.sections = (lesson.sections || []).filter(s => s.title !== SECTION_TITLE);
    const hadSection = before !== lesson.sections.length;

    if (items.length) {
      lesson.sections.push(buildSection(items));
      injected += items.length;
      console.log(`  L${L}: ${items.length} sourced ${hadSection ? '(refreshed)' : '(added)'}`);
    } else {
      zero.push(`${mod.id}/L${L}`);
      console.log(`  L${L}: 0 sourced — drills only${hadSection ? ' (stale section removed)' : ''}`);
    }

    if (!DRY) fs.writeFileSync(file, JSON.stringify(lesson, null, 2) + '\n');
    touched++;
  }
}

console.log(`\n=== ${DRY ? 'DRY RUN — ' : ''}${injected} sourced problem(s) into ${touched} lesson file(s) ===`);
if (zero.length) {
  console.log(`\nZero sourced coverage (${zero.length} cells) — these stay synthesised, see content/AGENT_BRIEF.md:`);
  console.log('  ' + zero.join('  '));
}
