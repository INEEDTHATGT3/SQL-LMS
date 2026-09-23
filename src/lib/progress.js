/* Versioned progress store - single source of truth for localStorage.
   Keys come from content/subject.json so subjects never share state. */
import { useSyncExternalStore } from 'react';
import { SUBJECT } from './subject.js';
import * as srsEngine from './srs.js';

const KEY = SUBJECT.storageKey;
/* Corrupt or future-version state is copied here instead of being thrown away,
   so a bad read is recoverable rather than a silent wipe of months of work. */
const BACKUP_KEY = `${KEY}_quarantine`;
const VERSION = 1;
const todayStr = srsEngine.todayStr;

function fresh() {
  return { version: VERSION, lessons: {}, srs: {}, mistakes: [], days: [], notes: {}, sessions: [] };
}

function normalize(raw) {
  return {
    version: VERSION,
    lessons: raw.lessons || {},
    srs: raw.srs || {},
    mistakes: raw.mistakes || [],
    days: raw.days || [],
    notes: raw.notes || {},
    sessions: raw.sessions || []
  };
}

function quarantine(text, why) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ why, at: new Date().toISOString(), raw: text }));
    console.warn(`[progress] ${why}; previous state preserved under "${BACKUP_KEY}"`);
  } catch { /* storage full or blocked - nothing further we can do */ }
}

/* Static-site era store: { "<mod>_L<n>": { mcq, solved, complete } }.
   Its quiz keys were a build-order counter (unstable), so only solved +
   complete are carried over. The legacy key is left untouched. */
function fromLegacy() {
  if (!SUBJECT.legacyStorageKey) return null;
  let old;
  try { old = JSON.parse(localStorage.getItem(SUBJECT.legacyStorageKey)); } catch { return null; }
  if (!old || typeof old !== 'object') return null;
  const next = fresh();
  for (const [id, st] of Object.entries(old)) {
    if (!/_L\d+$/.test(id) || !st || typeof st !== 'object') continue;
    const solved = Object.fromEntries(Object.entries(st.solved || {}).filter(([, v]) => v));
    if (st.complete || Object.keys(solved).length)
      next.lessons[id] = { complete: !!st.complete, solved };
  }
  return next;
}

function load() {
  let text = null;
  try { text = localStorage.getItem(KEY); } catch { return fresh(); }
  if (text === null) return fromLegacy() || fresh();
  let raw;
  try { raw = JSON.parse(text); }
  catch { quarantine(text, 'stored progress was not valid JSON'); return fresh(); }
  if (!raw || typeof raw !== 'object' || typeof raw.version !== 'number') {
    quarantine(text, 'stored progress had an unexpected shape'); return fresh();
  }
  if (raw.version > VERSION) {
    quarantine(text, `stored progress came from a newer build (v${raw.version} > v${VERSION})`);
    return fresh();
  }
  return normalize(raw);
}

let state = load();
const listeners = new Set();

/* write + notify, without touching the study-day log */
function persist(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach(fn => fn());
}
function commit(next) {
  // auto-stamp study day on ANY user-driven progress mutation
  const day = todayStr();
  persist({ ...next, days: next.days.includes(day) ? next.days : [...next.days, day] });
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getSnapshot() { return state; }
export function useProgress() { return useSyncExternalStore(subscribe, getSnapshot); }

/* --- srs card helpers (pure over state) --- */
function withCard(s, id, type, ref) {
  if (s.srs[id]) return s;
  return { ...s, srs: { ...s.srs, [id]: { type, ref, ease: 2.5, ivl: 0, due: todayStr(), reps: 0, lapses: 0 } } };
}
function withoutCard(s, id) {
  if (!s.srs[id]) return s;
  const srs = { ...s.srs }; delete srs[id];
  return { ...s, srs };
}

/* --- base mutators --- */
function updateLesson(s, id, fn) {
  return { ...s, lessons: { ...s.lessons, [id]: fn(s.lessons[id] || {}) } };
}
export const actions = {
  markComplete(lessonId, done) {
    let s = updateLesson(state, lessonId, st => ({ ...st, complete: done }));
    const card = `rev:${lessonId}`;
    s = done ? withCard(s, card, 'rev', { lessonId }) : withoutCard(s, card);
    commit(s);
  },
  /* value: option index (mcq), index[] (msq), number (nat), any JSON for other kinds */
  recordAnswer(lessonId, qKey, value) {
    commit(updateLesson(state, lessonId, st => ({ ...st, mcq: { ...st.mcq, [qKey]: value } })));
  },
  setSolved(lessonId, pid, solved) {
    let s = updateLesson(state, lessonId, st => {
      const next = { ...(st.solved || {}) };
      if (solved) next[pid] = true; else delete next[pid];
      return { ...st, solved: next };
    });
    const card = `prob:${lessonId}:${pid}`;
    s = solved ? withCard(s, card, 'prob', { lessonId, pid }) : withoutCard(s, card);
    commit(s);
  },
  toggleSolved(lessonId, pid) {
    actions.setSolved(lessonId, pid, !state.lessons[lessonId]?.solved?.[pid]);
  },
  /* free-form per-block state (explain-back drafts, rubric ticks, ...) */
  saveBlock(lessonId, key, value) {
    commit(updateLesson(state, lessonId, st => ({ ...st, blocks: { ...st.blocks, [key]: value } })));
  },
  resetAll() { commit(fresh()); }
};

/* --- notes & sessions --- */
export const actionsExt = {
  saveNote(lessonId, text) {
    commit({ ...state, notes: { ...state.notes, [lessonId]: text } });
  },
  addSession(session) {
    commit({ ...state, sessions: [session, ...(state.sessions || [])].slice(0, 20) });
  }
};
export function getNote(p, id) { return (p.notes || {})[id] || ''; }
export function getSessions(p) { return p.sessions || []; }

/* --- spaced repetition --- */
export const srsActions = {
  /* flashcards enroll on first rating, then follow the normal schedule */
  rateFlashcard(lessonId, cardId, rating) {
    const id = `fc:${lessonId}:${cardId}`;
    const s = withCard(state, id, 'fc', { lessonId, cardId });
    commit({ ...s, srs: { ...s.srs, [id]: srsEngine.rate(s.srs[id], rating) } });
  },
  rate(id, rating) {
    if (!state.srs[id]) return;
    commit({ ...state, srs: { ...state.srs, [id]: srsEngine.rate(state.srs[id], rating) } });
  },
  resolveMistake(id) {
    const s = withoutCard(state, `mis:${id}`);
    commit({ ...s, mistakes: s.mistakes.map(m => m.id === id ? { ...m, resolved: true } : m) });
  }
};

/* a wrong answer is logged AND becomes a review card, so it gets re-asked */
export function logMistake(lessonId, q, correctAnswer) {
  const id = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const s = withCard(state, `mis:${id}`, 'mis', { lessonId, mistakeId: id });
  commit({
    ...s,
    mistakes: [...s.mistakes, {
      id, lessonId, q: String(q).slice(0, 300), correctAnswer: String(correctAnswer).slice(0, 300),
      ts: Date.now(), resolved: false
    }]
  });
}

export const dueToday = srs => srsEngine.dueCount(srs);
export function importAll(raw) { commit(normalize(raw && typeof raw === 'object' ? raw : {})); }
export function exportAll() { return JSON.stringify(state, null, 2); }

/* --- selectors --- */
export function lessonState(p, id) { return p.lessons[id] || {}; }
export function isComplete(p, id) { return !!(p.lessons[id]?.complete); }

export function streak(p) {
  const days = new Set(p.days || []);
  let cur = 0;
  let off = 0;
  // allow "today not yet studied" without breaking yesterday's streak
  if (!days.has(srsEngine.dayStr(0))) off = -1;
  while (days.has(srsEngine.dayStr(off))) { cur++; off--; }
  return cur;
}
export function longestStreak(p) {
  const sorted = [...new Set(p.days || [])].sort();
  let best = 0, run = 0, prev = null;
  for (const d of sorted) {
    run = prev && (Date.parse(d) - Date.parse(prev) === srsEngine.DAY) ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  return best;
}
