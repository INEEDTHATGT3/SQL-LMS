---
type: job
code: SQL
id: J02
title: "Graded SQL exercise and table diff blocks"
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 2
depends: [SQL-J01]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J02 · Graded SQL exercise and table diff blocks.md"
created: 2026-10-17
updated: 2026-10-17
---
# SQL J02 · Graded SQL exercise and table diff blocks

## Goal
Build the two blocks that make SQL drills runnable and graded in the browser.

## Done when
- [ ] `src/components/blocks/TableDiff.jsx` renders a single table (no `after`) and a before/after diff with `.cell-add/.cell-del/.cell-chg`; NULL shows as NULL, distinct from ''; also exports `DiffTables` for reuse
- [ ] `SqlExercise.jsx` implements BLOCKS.md `sql-exercise`: schema peek, editor (Tab = 2 spaces, Ctrl/Cmd+Enter runs), Run (≤ 50 rows), Submit grades on every dataset incl. hidden ones and shows the diff on mismatch, `setSolved` on pass, draft via `saveBlock(lessonId, 'sql:'+id)`, progressive hints, solution after a submit, embedded mode, PGlite loaded only on the first Run
- [ ] `content/lab/sql.json` has ≥ 4 exercises across hr/shop/events, one with `orderMatters`, one whose `_edge` dataset catches a plausible wrong answer; `node scripts/check-exercises.mjs --lab` passes
- [ ] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J02 --emptyOutDir` passes (then delete `dist-SQL-J02` with node fs.rmSync)

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
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
