/* Problem pool for interview + sprint modes: every problem across the chosen
   modules/levels, loaded in parallel, tagged with its lesson. */
import { MODULES, LEVEL_NUMS } from './subject.js';
import { loadLesson, lessonProblems } from './content.js';

export async function buildPool(modFilter = 'all', tier = 'any') {
  const mods = modFilter === 'all' ? MODULES : MODULES.filter(m => m.id === modFilter);
  const jobs = [];
  for (const m of mods)
    for (const L of LEVEL_NUMS) {
      if (tier !== 'any' && L !== +tier) continue;
      jobs.push(loadLesson(m.id, L)
        .then(les => lessonProblems(les).map(pr => ({ ...pr, lessonRef: `${m.id}_L${L}`, moduleTitle: m.title, level: L })))
        .catch(() => []));   // a module with no lesson at this level is not an error
    }
  return (await Promise.all(jobs)).flat();
}

/* Fisher-Yates. `sort(() => Math.random() - 0.5)` is not a uniform shuffle. */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const fmtClock = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
