---
type: job
code: SQL
id: J01
title: "SQL runtime core"
status: done
est: 45
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 1
depends: []
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J01 · SQL runtime core.md"
created: 2026-10-17
updated: 2026-10-18
lane: 1
---
# SQL J01 · SQL runtime core

## Goal
Make graded SQL possible: verify the PGlite runner and the six datasets in Node, add result comparison, and a script that runs every exercise solution.

## Done when
- [x] `src/engines/resultcompare.js` exports `compare(expected, got, opts)`; `resultcompare.test.mjs` covers multiset order, duplicates, NULL vs empty string, numeric string vs number, float tolerance, column-count mismatch, `orderMatters`; `node scripts/test-engines.mjs` passes
- [x] `node scripts/check-exercises.mjs --lab` loads all six `content/datasets/*.sql`, asserts each `_edge` file has exactly the tables and columns of its base, and prints a summary
- [x] `node scripts/check-exercises.mjs --explain <dataset-or-.sql-path> "<sql>"` prints `EXPLAIN (FORMAT JSON)` (works with `harness/init.sql`)
- [x] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J01 --emptyOutDir` passes (then delete `dist-SQL-J01` with node fs.rmSync)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `src/engines/sqlrunner.js`, `src/engines/sqlrunner.worker.js`
- `content/datasets/*.sql`
- `src/lib/content.js` (loadDataset)
- `scripts/test-engines.mjs`, `scripts/lint-content.mjs` (how lessons are walked)

## Steps
1. Read sqlrunner.js. Confirm `getDb(name, loadSql)` and an exported `run(db, sql)` returning `{ columns, rows, error }` inside BEGIN…ROLLBACK, working in Node (in-process PGlite) and the browser (worker). Fix or add what is missing.
2. Write `resultcompare.js` (pure): normalize values (PG numeric strings → numbers, Date → ISO string, null stays null); multiset compare unless `orderMatters`; `floatTol` default 1e-6; optional `checkColumnNames`; return `{ ok, reason, diff: { missing, extra } }`. Tests with node:assert.
3. Write `scripts/check-exercises.mjs`: load datasets with fs into Node PGlite; assert base/edge schema parity via information_schema; walk `content/*/L*.json` (plus `content/lab/*.json` with `--lab`) for `sql-exercise` blocks, problem items with `exercise`, and `query-trace` stages; run each solution/stage on every listed dataset; exit 1 on SQL error, warn on empty results; add the `--explain` mode.
4. Fix any dataset that fails to load or breaks parity (keep names; only add rows/columns to both twins).
5. Update the sqlrunner/datasets row of the Block status table in AGENTS.md.

## Limits
- May edit: `src/engines/sqlrunner.js`, `sqlrunner.worker.js`, `resultcompare.js` + test, `scripts/check-exercises.mjs`, `content/datasets/*.sql`, the status table in `AGENTS.md`.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
**Changed:** `src/engines/resultcompare.js` (new: normalize + multiset/orderMatters compare, floatTol 1e-6,
checkColumnNames, `{ ok, reason, diff: { missing, extra } }`) · `src/engines/resultcompare.test.mjs` (new) ·
`scripts/check-exercises.mjs` (new: dataset load + base/edge parity + exercise/stage walker + `--explain`) ·
`AGENTS.md` (sqlrunner/datasets row now "verified"). sqlrunner.js/worker needed no fixes — verified `run`/`explain`
in Node (BEGIN…ROLLBACK sandbox, COMMIT refused, errors surfaced). Datasets: all 6 load, 3/3 edge twins match.

**Checks:** `node scripts/test-engines.mjs` 4/4 · `check-exercises --lab` 39 files, 3/3 parity, 0 err (walker
error/warn/exit-1 paths verified via a temporary lab fixture, then removed) · `--explain` on `hr` and
`harness/init.sql` both print EXPLAIN FORMAT JSON · eslint clean on card files · vite build passes (run in an
isolated temp copy: the working tree briefly failed on another lane's in-flight `QueryPlan.jsx`/`DialectDiff.jsx`
CSS imports — not card files, left untouched); `dist-SQL-J01` never created in repo.

**Open:** exercises/stages count is 0 until J02/J03/J09+ author `sql-exercise`/`query-trace` content — walker is ready.
- 2026-10-18 · resultcompare + check-exercises shipped: 4/4 engine tests, 3/3 base/edge parity, --explain verified on hr and harness/init.sql; runner confirmed no fixes needed
- 2026-10-18 · Inspected: pass. All 4 Done-when items verified: engine tests 4/4, check-exercises --lab loads 6 datasets with 3/3 edge parity and 0 errors, --explain prints EXPLAIN FORMAT JSON on hr and harness/init.sql, eslint clean and vite build passes (dist-SQL-J01 deleted); changes confined to card Limits.
