/* Preferred code language/dialect - one global choice, persisted per subject. */
import { useSyncExternalStore } from 'react';
import { SUBJECT, LANGS } from './subject.js';

const KEY = SUBJECT.langStorageKey || `${SUBJECT.id}_lang`;
let current = (() => {
  try { const v = localStorage.getItem(KEY); if (LANGS.some(l => l.id === v)) return v; } catch {}
  return LANGS[0]?.id;
})();
const subs = new Set();

export function setLang(id) {
  current = id;
  try { localStorage.setItem(KEY, id); } catch {}
  subs.forEach(fn => fn());
}
export function useLang() {
  return useSyncExternalStore(fn => (subs.add(fn), () => subs.delete(fn)), () => current);
}
