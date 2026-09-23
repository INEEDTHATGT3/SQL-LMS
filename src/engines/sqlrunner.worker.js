/* One PGlite per worker (one worker per dataset); see sqlrunner.js. */
import { createDb, runOn, explainOn } from './sqlrunner.js';

let pg;
self.onmessage = async ({ data: { id, op, sql } }) => {
  try {
    let result = true;
    if (op === 'init') pg = await createDb(sql);
    else if (op === 'explain') result = await explainOn(pg, sql);
    else result = await runOn(pg, sql);
    self.postMessage({ id, result });
  } catch (e) {
    self.postMessage({ id, error: e?.message || String(e) });
  }
};
