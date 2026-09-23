/* Content manifest - statically analyzable globs (one lazy chunk per lesson).
   Lessons live in /content/<module>/L<n>.json, authored directly (no copy step). */
import { getSnapshot as readProgress } from './progress.js';
import { LEVEL_NUMS } from './subject.js';
import searchIndex from '../generated/search-index.json';

const lessonLoaders = import.meta.glob('/content/*/L*.json');
const datasetLoaders = import.meta.glob('/content/datasets/*.sql', { query: '?raw', import: 'default' });

export const SEARCH_INDEX = searchIndex;

export async function loadLesson(moduleId, level) {
  const load = lessonLoaders[`/content/${moduleId}/L${level}.json`];
  if (!load) throw new Error(`lesson not found: ${moduleId} L${level}`);
  return (await load()).default;
}

export async function loadDataset(name) {
  const load = datasetLoaders[`/content/datasets/${name}.sql`];
  if (!load) throw new Error(`dataset not found: ${name}`);
  return load();
}

/* every problem in a lesson, whether in a `problems` list or a lone `problem` block */
export function lessonProblems(lesson) {
  const out = [];
  for (const s of lesson.sections || [])
    for (const b of s.blocks || []) {
      if (b.type === 'problems') out.push(...(b.items || []));
      else if (b.type === 'problem') out.push(b);
    }
  return out;
}

/* progress summary per module for hub matrix - reads store snapshot */
export function moduleProgress(modId) {
  const p = readProgress();
  let done = 0;
  const perLevel = {};
  for (const L of LEVEL_NUMS) {
    const complete = !!p.lessons[`${modId}_L${L}`]?.complete;
    perLevel[L] = complete;
    if (complete) done++;
  }
  return { done, perLevel };
}
