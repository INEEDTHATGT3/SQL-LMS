/* Pure helpers for the recall blocks (question, flashcards, misconception,
   predict, explain-back). No React, no DOM - node imports this for tests. */
import { answerKey, isCorrect } from '../lib/grade.js';

const STOP = new Set('a an the of to in on at by for and or is are was were be been it its this that with as from into than then which who whom what when where why how not no can will would should does do did has have had'.split(' '));

/* lower-case, punctuation -> space, collapse whitespace. Keeps + and # so
   "B+ tree" and "C#" survive. */
export function normalize(s) {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();
}
export const words = s => normalize(s).split(' ').filter(Boolean);
export const wordCount = s => words(s).length;

/* crude plural fold to a shared root: keys/key, dependencies/dependency,
   indexes/index, caches/cache all collapse to one form (not always a word).
   ponytail: suffix rules, not a real stemmer; swap in Porter if recall misses. */
export function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) w = w.slice(0, -1);
  return w.length > 3 && w.endsWith('e') ? w.slice(0, -1) : w;
}
const stems = s => words(s).map(stem);

/* does `text` mention `term`? Case-insensitive, plural-tolerant, whole words,
   multi-word terms must appear as a contiguous phrase. */
export function mentions(text, term) {
  const t = stems(term), x = stems(text);
  if (!t.length) return false;
  for (let i = 0; i + t.length <= x.length; i++)
    if (t.every((w, j) => x[i + j] === w)) return true;
  return false;
}
export function keywordHits(text, terms = []) {
  const hit = [], miss = [];
  for (const t of terms) (mentions(text, t) ? hit : miss).push(t);
  return { hit, miss };
}

/* share (0..1) of the expected answer's content words present in the typed one */
export function overlap(typed, expected) {
  const want = [...new Set(words(expected).filter(w => !STOP.has(w)).map(stem))];
  if (!want.length) return 0;
  const have = new Set(stems(typed));
  return want.filter(w => have.has(w)).length / want.length;
}

/* free-text answer: ignores case, punctuation and spacing ("Non-repeatable
   read" == "nonrepeatable read"); accepted may be a string or a list */
export function matchesText(input, accepted) {
  const squash = s => normalize(s).replace(/ /g, '');
  const got = squash(input);
  return !!got && [].concat(accepted).some(a => squash(a) === got);
}

/* learner-typed number: "1,024", "1 024", "−5", "2.5e3". NaN if not a number. */
export function parseNum(s) {
  if (typeof s === 'number') return s;
  const t = String(s ?? '').trim().replace(/[−–]/g, '-').replace(/[,_\s]/g, '');
  return t && /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? Number(t) : NaN;
}

/* NAT answer -> inclusive range. answer: number | {min,max}; tolerance widens a number. */
export function natRange(answer, tolerance = 0) {
  if (typeof answer === 'number') return { min: answer - tolerance, max: answer + tolerance };
  if (answer && typeof answer.min === 'number' && typeof answer.max === 'number') return { min: answer.min, max: answer.max };
  throw new Error('nat answer must be a number or {min,max}');
}

/* grade one question-like item { kind, answer, options?, tolerance? } against a stored value.
   Same rules as grade.js (the analytics answer keys); `text` and `tolerance` are the extras. */
export function checkAnswer(item, value) {
  const kind = item.kind || 'mcq';
  if (kind === 'text') return typeof value === 'string' && matchesText(value, item.answer);
  if (kind === 'nat') return isCorrect({ k: 'nat', a: natRange(item.answer, item.tolerance || 0) }, parseNum(value));
  return isCorrect(answerKey(item, kind), value);
}

const fmtNum = n => String(Math.round(n * 1e6) / 1e6);
/* human-readable correct answer, for the mistake log and the reveal */
export function correctText(item) {
  const o = item.options || [], a = item.answer, unit = item.unit ? ' ' + item.unit : '';
  switch (item.kind || 'mcq') {
    case 'mcq': return String(o[a]);
    case 'msq': return a.map(i => o[i]).join('; ');
    case 'nat': {
      const r = natRange(a, item.tolerance || 0);
      return (r.min === r.max ? fmtNum(r.min) : `${fmtNum(r.min)} to ${fmtNum(r.max)}`) + unit;
    }
    case 'order': return a.map(i => o[i]).join(' → ');
    case 'match': return (item.left || []).map((l, i) => `${l} → ${(item.right || [])[a[i]]}`).join('; ');
    case 'text': return [].concat(a)[0];
    default: return JSON.stringify(a);
  }
}

/* "GATE CS 2021 · Set 2 · Q34" | "LeetCode #1757" | ref text */
export function sourceText(src) {
  if (!src) return '';
  if (typeof src === 'string') return src;
  const exam = [src.exam, src.year].filter(Boolean).join(' ');
  const plat = [src.platform, src.ref && (src.platform ? '#' + src.ref : src.ref)].filter(Boolean).join(' ');
  return [exam, src.set && `Set ${src.set}`, src.q && `Q${src.q}`, plat].filter(Boolean).join(' · ');
}

/* explain-back self-rubric: ticked weight / total weight (weight defaults to 1) */
export function rubricScore(rubric = [], ticked = []) {
  const w = r => (typeof r.weight === 'number' ? r.weight : 1);
  const total = rubric.reduce((s, r) => s + w(r), 0);
  return total ? ticked.reduce((s, i) => s + (rubric[i] ? w(rubric[i]) : 0), 0) / total : 0;
}
