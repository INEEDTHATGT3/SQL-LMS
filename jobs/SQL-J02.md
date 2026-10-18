---
type: job
code: SQL
id: J02
title: "Graded SQL exercise and table diff blocks"
status: done
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 2
depends: [SQL-J01]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J02 · Graded SQL exercise and table diff blocks.md"
created: 2026-10-17
updated: 2026-10-18
lane: 1
---
# SQL J02 · Graded SQL exercise and table diff blocks

## Goal
Build the two blocks that make SQL drills runnable and graded in the browser.

## Done when
- [x] `src/components/blocks/TableDiff.jsx` renders a single table (no `after`) and a before/after diff with `.cell-add/.cell-del/.cell-chg`; NULL shows as NULL, distinct from ''; also exports `DiffTables` for reuse
- [x] `SqlExercise.jsx` implements BLOCKS.md `sql-exercise`: schema peek, editor (Tab = 2 spaces, Ctrl/Cmd+Enter runs), Run (≤ 50 rows), Submit grades on every dataset incl. hidden ones and shows the diff on mismatch, `setSolved` on pass, draft via `saveBlock(lessonId, 'sql:'+id)`, progressive hints, solution after a submit, embedded mode, PGlite loaded only on the first Run
- [x] `content/lab/sql.json` has ≥ 4 exercises across hr/shop/events, one with `orderMatters`, one whose `_edge` dataset catches a plausible wrong answer; `node scripts/check-exercises.mjs --lab` passes
- [x] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J02 --emptyOutDir` passes (then delete `dist-SQL-J02` with node fs.rmSync)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `src/engines/sqlrunner.js`, `src/engines/resultcompare.js`
- `src/components/blocks.jsx` (Problem renders `exercise` through Block)
- `src/lib/progress.js`, `src/lib/content.js`
- old version: `git show main:renderer/blocks/table-diff.js`

## Steps
0. Run `node jobs/status.mjs show SQL-J02`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Build TableDiff (read `b.spec ?? b`; key by `key` or row index).
2. Build SqlExercise on top of sqlrunner + resultcompare + DiffTables; loading text while PGlite boots.
3. Write the lab samples, run check-exercises, eslint, build.
4. Update the AGENTS.md status table.

## Limits
- May edit: `TableDiff.jsx`, `SqlExercise.jsx` (+ co-located .css), `content/lab/sql.json`, the AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
**Changed**
- `src/components/blocks/TableDiff.jsx` + `TableDiff.css` — single ref table / merged before-after diff (key or row index), `.cell-add/.cell-del/.cell-chg`, NULL ≠ ''; exports `DiffTables`
- `src/components/blocks/SqlExercise.jsx` + `SqlExercise.css` — schema peek, Tab=2sp / Ctrl+⏎ editor, Run ≤50 rows, Submit grades all datasets + mismatch diff, `setSolved`, draft `sql:'+id`, hints, solution after submit, embedded, PGlite boots on first Run
- `content/lab/sql.json` — 5 exercises (hr×2, shop×2, events×1); `orderMatters` on dept-top-salary; edge-catching wrong answers verified (NOT-IN NULL trap, drop-cancelled filter, COUNT w/o DISTINCT)
- `AGENTS.md` — status table: sql-exercise + table-diff → built, not yet reviewed

**Checks**
- `node scripts/check-exercises.mjs --lab` → 5 exercises (10 runs) · 3/3 parity · 0 err / 0 warn
- edge harness (temp dir, outside repo): 6/6 — each wrong passes base, fails `_edge`
- `npx eslint TableDiff.jsx SqlExercise.jsx` → clean; SSR smoke via repo esbuild 24/24
- `npx vite build --outDir dist-SQL-J02 --emptyOutDir` → built; `dist-SQL-J02` deleted

**Open**
- query-trace still stub (other card); real lesson exercises await the L1–L4 content jobs
- 2026-10-18 · TableDiff + SqlExercise built; 5 lab exercises pass check-exercises --lab, eslint, SSR smoke 24/24, vite build
- 2026-10-18 · Inspected: pass. All 4 Done-when items verified: TableDiff (single/diff modes, cell-add/del/chg, NULL≠'', DiffTables export) and SqlExercise (schema peek, Tab=2sp, Ctrl+Enter, Run ≤50 rows, Submit grades all datasets w/ mismatch diff, setSolved, sql:+id draft, hints, solution-after-submit, embedded, lazy PGlite) read against code; check-exercises --lab 5 exercises/10 runs 0 err + independent edge harness 6/6 (NOT-IN, drop-cancelled, COUNT w/o DISTINCT all pass base, fail _edge); eslint clean, vite build ok, dist-SQL-J02 deleted; edits confined to card Limits.
