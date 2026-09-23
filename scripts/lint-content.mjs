#!/usr/bin/env node
/* Content gate: every lesson parses, uses only known block types with their
   required fields, and meets the quotas in content/subject.json.
   Usage: node scripts/lint-content.mjs [--only=<moduleId>]   (exit 1 on error) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REQUIRED, VISUAL_KINDS, PROBLEM_TYPES } from '../src/lib/block-types.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').split('=')[1];

const subject = read(path.join(CONTENT, 'subject.json'));
const mods = read(path.join(CONTENT, 'modules.json'));
const Q = subject.quotas || {};
const datasets = new Set(fs.existsSync(path.join(CONTENT, 'datasets'))
  ? fs.readdirSync(path.join(CONTENT, 'datasets')).filter(f => f.endsWith('.sql')).map(f => f.slice(0, -4)) : []);

let errs = 0, warns = 0, files = 0, mcqs = 0, longestRight = 0;
const err = (w, m) => { errs++; console.log(`  ✗ ${w}: ${m}`); };
const warn = (w, m) => { warns++; console.log(`  ⚠ ${w}: ${m}`); };

function checkMcq(w, it) {
  if (!it.q) return err(w, 'question without q');
  if (!Array.isArray(it.options) || it.options.length < 2) return err(w, `"${it.q.slice(0, 40)}" needs ≥2 options`);
  if (!Number.isInteger(it.answer) || it.answer < 0 || it.answer >= it.options.length) err(w, `"${it.q.slice(0, 40)}" answer out of range`);
  if (!it.explain) err(w, `"${it.q.slice(0, 40)}" missing explain`);
  mcqs++;
  const lens = it.options.map(o => String(o).length);
  if (lens[it.answer] === Math.max(...lens) && lens.filter(l => l === lens[it.answer]).length === 1) longestRight++;
}

function checkQuestion(w, b) {
  const n = (b.options || []).length;
  if (b.kind === 'mcq') return checkMcq(w, b);
  if (b.kind === 'msq') {
    if (!Array.isArray(b.answer) || !b.answer.length || b.answer.some(i => i < 0 || i >= n)) err(w, 'msq answer must be option indices');
  } else if (b.kind === 'nat') {
    const a = b.answer;
    if (!(typeof a === 'number' || (a && typeof a.min === 'number' && typeof a.max === 'number' && a.min <= a.max))) err(w, 'nat answer must be number or {min,max}');
  } else if (b.kind === 'order' || b.kind === 'match') {
    if (!Array.isArray(b.answer)) err(w, `${b.kind} answer must be an array`);
  } else err(w, `question kind "${b.kind}" unknown`);
  if (!b.explain) warn(w, 'question missing explain');
}

function walkBlock(w, b, level, counts) {
  if (!REQUIRED[b.type]) return err(w, `unknown block type "${b.type}"`);
  for (const f of REQUIRED[b.type]) if (b[f] === undefined) err(w, `${b.type} missing "${f}"`);
  if (b.type === 'visual' && !VISUAL_KINDS.includes(b.kind)) err(w, `unknown visual kind "${b.kind}"`);
  if (b.type === 'quiz') for (const it of b.items || []) { checkMcq(w, it); counts.mcq++; }
  if (b.type === 'question') { checkQuestion(w, b); counts.mcq++; }
  if ((Q.traceTypes || ['trace']).includes(b.type)) counts.trace++;
  if (b.type === 'query-plan') counts.plan++;
  if (b.type === 'dialect-diff' || (b.type === 'code' && (b.pg || b.mysql))) counts.dialect++;
  if (b.type === 'code' && b.code && !b.code.trim()) err(w, 'empty code block');
  const items = b.type === 'problems' ? b.items || [] : PROBLEM_TYPES.includes(b.type) ? [b] : [];
  for (const p of items) {
    counts.prob++;
    if (!p.id) err(w, 'problem without id');
    else if (counts.ids.has(p.id)) err(w, `duplicate problem id ${p.id}`);
    counts.ids.add(p.id);
    if (b.type !== 'sql-exercise' && p.tier !== level) warn(w, `${p.id} tier ${p.tier} in L${level} file`);
    const ex = b.type === 'sql-exercise' ? b : p.exercise;
    if (ex) {
      if (!ex.solution) err(w, `${p.id} exercise without solution`);
      for (const d of ex.datasets || []) if (!datasets.has(d)) err(w, `${p.id} unknown dataset "${d}"`);
      if (!(ex.datasets || []).length) err(w, `${p.id} exercise lists no datasets`);
    }
  }
  if (b.type === 'query-trace' && !datasets.has(b.dataset)) err(w, `query-trace unknown dataset "${b.dataset}"`);
  if (b.type === 'predict' && Array.isArray(b.reveal)) for (const r of b.reveal) walkBlock(w, r, level, counts);
}

for (const mod of mods.modules) {
  if (ONLY && mod.id !== ONLY) continue;
  for (const { level } of mods.levels) {
    const file = path.join(CONTENT, mod.id, `L${level}.json`);
    const w = `${mod.id}/L${level}`;
    if (!fs.existsSync(file)) { if (mod.status === 'active') err(w, 'missing lesson file'); continue; }
    files++;
    let L;
    try { L = read(file); } catch (e) { err(w, `invalid JSON: ${e.message}`); continue; }
    if (L.level !== level) err(w, `level field ${L.level} ≠ file level ${level}`);
    if (!L.title) err(w, 'missing title');
    const counts = { mcq: 0, trace: 0, prob: 0, plan: 0, dialect: 0, ids: new Set() };
    for (const it of L.placementQuiz || []) checkMcq(w, it);
    if ((L.placementQuiz || []).length < (Q.minPlacementQuiz ?? 0)) err(w, `placementQuiz ${(L.placementQuiz || []).length} < ${Q.minPlacementQuiz}`);
    for (const s of L.sections || []) {
      if (!s.title || !Array.isArray(s.blocks)) { err(w, 'section needs title + blocks[]'); continue; }
      for (const b of s.blocks) walkBlock(w, b, level, counts);
    }
    if (counts.mcq < (Q.minMcqsTotal ?? 0)) err(w, `questions ${counts.mcq} < ${Q.minMcqsTotal}`);
    if (counts.trace < (Q.minTraces ?? 0)) err(w, `traces ${counts.trace} < ${Q.minTraces}`);
    const minP = (Q.minProblems || {})[level] ?? 0;
    if (counts.prob < minP) err(w, `problems ${counts.prob} < ${minP}`);
    const needPlan = (Q.requireQueryPlan || {})[level] ?? 0;
    if (counts.plan < needPlan) err(w, `query-plan blocks ${counts.plan} < ${needPlan}`);
    if ((Q.requireDialectNote || {})[level] && !counts.dialect) err(w, 'needs a dialect-diff or a code block with pg/mysql variants');
    if ((L.revisionCard || []).length < (Q.minRevisionBullets ?? 0)) err(w, `revisionCard < ${Q.minRevisionBullets}`);
    if ((L.glossary || []).length < (Q.minGlossaryTerms ?? 0)) err(w, `glossary < ${Q.minGlossaryTerms}`);
  }
}

/* options render shuffled, but "the longest option is right" still leaks the answer */
const pct = mcqs ? Math.round(longestRight / mcqs * 100) : 0;
if (pct > 50) { warns++; console.log(`  ⚠ answer-length bias: the uniquely longest option is correct in ${pct}% of ${mcqs} MCQs (aim < 40%)`); }

console.log(`\n=== lint-content: ${files} lessons · ${mcqs} MCQs · ${errs} error(s), ${warns} warning(s) ===`);
process.exit(errs ? 1 : 0);
