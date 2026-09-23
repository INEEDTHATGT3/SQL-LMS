/* Subject config - the only place the engine learns what it is teaching.
   Everything subject-specific (name, levels, languages, storage keys, quotas)
   comes from content/subject.json + content/modules.json. */
import subject from '/content/subject.json';
import modulesMeta from '/content/modules.json';

export const SUBJECT = subject;
export const MODULES = modulesMeta.modules.filter(m => m.status !== 'draft');
export const LEVELS = modulesMeta.levels;
export const LEVEL_NUMS = LEVELS.map(l => l.level);
export const LEVEL_META = Object.fromEntries(LEVELS.map(l => [l.level, l]));
export const TOTAL_LESSONS = MODULES.length * LEVELS.length;
export const LANGS = subject.languages || [];

export function moduleById(id) {
  return MODULES.find(m => m.id === id);
}

/* "foo-bar_L3" -> ["foo-bar", "3"]; module ids may contain underscores */
export function splitLessonId(id) {
  const m = String(id).match(/^(.+)_L(\d+)$/);
  return m ? [m[1], m[2]] : [id, '1'];
}
export const lessonPath = id => `/lesson/${splitLessonId(id).join('/')}`;

/* per-level accent colours come from modules.json, not hard-coded CSS */
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
export function applyLevelTheme() {
  const css = LEVELS.map(l =>
    `body[data-level="${l.level}"]{--lvl:${l.color};--lvl-rgba:${rgba(l.color, .1)};--lvl-border:${rgba(l.color, .25)}}`
  ).join('\n');
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
  document.title = subject.title;
}
