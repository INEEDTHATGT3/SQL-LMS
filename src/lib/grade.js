/* Answer checking + deterministic option shuffling. Pure; shared by the
   browser and scripts/gen.mjs (answer keys) so both agree on "correct". */

/* key: number (mcq option index) | { k: 'msq'|'nat'|'order'|'match', a } */
export function isCorrect(key, value) {
  if (value === undefined || value === null) return false;
  if (typeof key === 'number') return value === key;
  switch (key.k) {
    case 'msq':   return sameSet(key.a, value);
    case 'nat': {
      const n = typeof value === 'number' ? value : parseFloat(value);
      return Number.isFinite(n) && n >= key.a.min && n <= key.a.max;
    }
    case 'order':
    case 'match': return Array.isArray(value) && value.length === key.a.length && value.every((v, i) => v === key.a[i]);
    default: return false;
  }
}
function sameSet(a, b) {
  if (!Array.isArray(b) || a.length !== b.length) return false;
  const s = new Set(a);
  return b.every(x => s.has(x));
}

/* answer key for a question-like item; NAT always normalized to a range.
   A number answer widens by `tolerance` (item.tolerance or the 3rd arg) into
   { min, max }; an explicit { min, max } answer is kept as-is. */
export function answerKey(item, kind = item.kind || 'mcq', tolerance) {
  if (kind === 'mcq') return item.answer;
  if (kind === 'nat') {
    const a = item.answer;
    const tol = (tolerance !== undefined ? tolerance : (item.tolerance ?? 0));
    return { k: 'nat', a: typeof a === 'number' ? { min: a - tol, max: a + tol } : a };
  }
  return { k: kind, a: item.answer };
}

/* Seeded Fisher-Yates over option indices. Seed = question key, so the order
   is stable across visits (a stored choice never jumps) but authored answer
   position no longer leaks: options are stored/graded by ORIGINAL index. */
// Options that point at other options ("Both B and C", "All of the above") only make sense
// in authored order, so such option lists are never shuffled.
const REFERS_TO_OPTIONS = /\b[A-F]\b(,| and| &)|\bof the above\b/i;
export function optionOrder(options, seedKey) {
  return options.some(o => REFERS_TO_OPTIONS.test(String(o)))
    ? options.map((_, i) => i)
    : shuffledOrder(options.length, seedKey);
}

export function shuffledOrder(n, seedKey) {
  let seed = parseInt(String(seedKey).replace(/^q/, ''), 16) || 1;
  const rand = () => {                       // mulberry32
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
