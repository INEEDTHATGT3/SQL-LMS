/* Weakness analytics - pure functions over (progress, answerKeys).
   Accuracy per module from persisted answers vs build-time keys. */
import { MODULES, LEVEL_NUMS } from './subject.js';
import ANSWER_KEYS from '../generated/answer-keys.json';
import { isCorrect } from './grade.js';

const lessonIdToModule = {};
for (const m of MODULES)
  for (const L of LEVEL_NUMS)
    lessonIdToModule[`${m.id}_L${L}`] = { id: m.id, num: m.num, title: m.title };

function* graded(progress) {
  for (const [lessonId, st] of Object.entries(progress.lessons)) {
    const keys = ANSWER_KEYS[lessonId] || {};
    for (const [qKey, value] of Object.entries(st.mcq || {})) {
      if (keys[qKey] === undefined) continue;
      yield { lessonId, right: isCorrect(keys[qKey], value) };
    }
  }
}

export function moduleAccuracy(progress) {
  const agg = {};   // moduleId: {right, total, mod}
  for (const g of graded(progress)) {
    const mod = lessonIdToModule[g.lessonId];
    if (!mod) continue;
    const a = agg[mod.id] ||= { right: 0, total: 0, mod };
    a.total++;
    if (g.right) a.right++;
  }
  return agg;
}

/* weakest modules with >= minAttempts, accuracy ascending */
export function weakestModules(progress, minAttempts = 4, topN = 3) {
  return Object.values(moduleAccuracy(progress))
    .filter(a => a.total >= minAttempts)
    .map(a => ({ ...a, pct: Math.round(a.right / a.total * 100) }))
    .sort((x, y) => x.pct - y.pct)
    .slice(0, topN);
}

export function overallAccuracy(progress) {
  let right = 0, total = 0;
  for (const g of graded(progress)) { total++; if (g.right) right++; }
  return total ? Math.round(right / total * 100) : null;
}

export function answeredCount(progress) {
  let n = 0;
  for (const l of Object.values(progress.lessons)) n += Object.keys(l.mcq || {}).length;
  return n;
}
