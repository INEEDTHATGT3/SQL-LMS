/**
 * @layered-study/core - Lint/Quota Validator
 * Validates lesson JSON against quota-config.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default to current working directory
let CONTENT = process.cwd();

function validateLesson(lesson, quotaConfig) {
  const errs = [], warns = [];
  let traces = 0, quizzes = 0, problems = [];
  
  const minProblems = quotaConfig?.minProblems || { 1: 8, 2: 10, 3: 6, 4: 5 };
  const minPlacementQuiz = quotaConfig?.minPlacementQuiz || 5;
  const minTraces = quotaConfig?.minTraces || 2;
  const minMcqsTotal = quotaConfig?.minMcqsTotal || 6;
  const minRevisionBullets = quotaConfig?.minRevisionBullets || 4;
  const minGlossaryTerms = quotaConfig?.minGlossaryTerms || 5;
  // Allow skills to define which block types count as traces
  const traceTypes = new Set(['trace', ...(quotaConfig?.traceTypes || [])]);

  (lesson.sections || []).forEach(sec => sec.blocks.forEach(b => {
    if (traceTypes.has(b.type)) traces++;
    if (b.type === 'quiz') quizzes += (b.items || []).length;
    if (b.type === 'problem') problems.push(b);
    if (b.type === 'problems') problems.push(...(b.items || []));
  }));

  if ((lesson.placementQuiz || []).length < minPlacementQuiz) errs.push(`placementQuiz needs ≥${minPlacementQuiz} items (has ${(lesson.placementQuiz || []).length})`);
  if (traces < minTraces) errs.push(`needs ≥${minTraces} traced dry-runs (has ${traces})`);
  if (quizzes < minMcqsTotal) errs.push(`needs ≥${minMcqsTotal} MCQs across sections (has ${quizzes})`);
  if (problems.length < minProblems[lesson.level]) errs.push(`needs ≥${minProblems[lesson.level]} problems at L${lesson.level} (has ${problems.length})`);
  if ((lesson.revisionCard || []).length < minRevisionBullets) errs.push(`revisionCard needs ≥${minRevisionBullets} bullets`);
  if ((lesson.glossary || []).length < minGlossaryTerms) errs.push(`glossary needs ≥${minGlossaryTerms} terms`);
  
  // Tier validation
  const tiers = problems.map(p => p.tier);
  if (tiers.some(t => t !== lesson.level)) warns.push(`tier mismatch: L${lesson.level} file contains problems tagged tier ${[...new Set(tiers)].filter(t => t !== lesson.level).join(',')}`);
  
  // Quiz item validation
  const validateQuiz = (items, prefix) => {
    (items || []).forEach((q, i) => {
      if (!q.options || q.options.length !== 4) errs.push(`${prefix} quiz ${i}: needs exactly 4 options`);
      if (q.answer === undefined || q.answer < 0 || q.answer > 3) errs.push(`${prefix} quiz ${i}: answer must be 0-3`);
      if (!q.explain) errs.push(`${prefix} quiz ${i}: missing explanation`);
    });
  };
  validateQuiz(lesson.placementQuiz, 'placement');
  (lesson.sections || []).forEach((sec, si) => {
    sec.blocks.filter(b => b.type === 'quiz').forEach((b, bi) => validateQuiz(b.items, `section ${si} quiz ${bi}`));
  });

  return { errs, warns };
}

export async function lint(onlyModule, contentDir) {
  CONTENT = contentDir || process.cwd();
  const mods = JSON.parse(fs.readFileSync(path.join(CONTENT, 'modules.json'), 'utf8'));
  
  const quotaConfigPath = path.join(CONTENT, 'quota-config.json');
  const quotaConfig = fs.existsSync(quotaConfigPath) ? JSON.parse(fs.readFileSync(quotaConfigPath, 'utf8')) : {};

  let totalErrs = 0, totalWarns = 0;

  for (const mod of mods.modules) {
    if (mod.status !== 'active') continue;
    if (onlyModule && mod.id !== onlyModule) continue;
    const candidates = [path.join(CONTENT, mod.id), path.join(CONTENT, `${mod.num}_${mod.id}`)];
    const dir = candidates.find(c => fs.existsSync(c));
    if (!dir) continue;
    for (const f of fs.readdirSync(dir).filter(x => /^L\d+\.json$/.test(x))) {
      const lesson = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const { errs, warns } = validateLesson(lesson, quotaConfig);
      console.log(`\n◆ ${mod.id}/L${lesson.level} — ${lesson.title}`);
      warns.forEach(w => console.log(`  ⚠ ${w}`));
      errs.forEach(e => console.log(`  ✗ ${e}`));
      totalErrs += errs.length;
      totalWarns += warns.length;
    }
  }

  console.log(`\n=== Lint complete: ${totalErrs} error(s), ${totalWarns} warning(s) ===`);
  process.exit(totalErrs > 0 ? 1 : 0);
}