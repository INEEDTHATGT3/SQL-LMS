---
type: job
code: SQL
id: J03
title: "Query trace block"
status: done
est: 30
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 3
depends: [SQL-J01]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J03 · Query trace block.md"
created: 2026-10-17
updated: 2026-10-18
lane: 1
---
# SQL J03 · Query trace block

## Goal
Give SQL its dry-run trace: show the intermediate table after each clause.

## Done when
- [x] `QueryTrace.jsx` implements BLOCKS.md `query-trace`: Run trace boots PGlite, runs every stage, prev/next + show all, row count per stage, rows dropped since the previous stage marked `.cell-del` when columns match
- [x] `content/lab/sql-trace.json` has ≥ 2 traces (WHERE → GROUP BY → HAVING on hr; the LEFT JOIN + WHERE-on-right-table trap on shop); `node scripts/check-exercises.mjs --lab` passes
- [x] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J03 --emptyOutDir` passes (then delete `dist-SQL-J03` with node fs.rmSync)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `src/engines/sqlrunner.js`
- `src/components/blocks/TableDiff.jsx` (reuse its table styling if done)

## Steps
0. Run `node jobs/status.mjs show SQL-J03`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Build the block.
2. Write the lab samples and run the checks.
3. Update the AGENTS.md status table.

## Limits
- May edit: `QueryTrace.jsx` (+ .css), `content/lab/sql-trace.json`, the AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
**Changed:** `src/components/blocks/QueryTrace.jsx` + `QueryTrace.css` (real block: Run trace boots PGlite, runs all stages, Prev/Next + Show all, per-stage row count, dropped rows appended `.cell-del` when columns match, new rows `.cell-add`, diff disabled when columns change); `content/lab/sql-trace.json` (2 traces: 6-stage hr FROM→WHERE→GROUP BY→HAVING→SELECT→ORDER BY, 3-stage shop LEFT JOIN WHERE-on-right trap + derived-table fix); AGENTS.md status-table row `query-trace` → built, not yet reviewed.
**Checks:** `node scripts/check-exercises.mjs --lab` → 42 files · 5 exercises · 9 trace stages · 0 errors, 0 warnings · `npx eslint src/components/blocks/QueryTrace.jsx` → clean · `node scripts/gen.mjs && node scripts/lint-content.mjs` → 0 errors (pre-existing MCQ answer-length warning) · `node scripts/check-provenance.mjs` → 0 errors · `node scripts/test-engines.mjs` → 4/4 · `npx vite build --outDir dist-SQL-J03 --emptyOutDir` → built, `dist-SQL-J03` deleted. Stage counts verified against PGlite (hr 21→14→6→4→4→4; shop 31→2→12) and match the stage notes.
**Open:** no component harness exists, so the block is not click-tested in a browser — reviewer should open `/#/lab` → `sql-trace.json` and try Run trace / Prev / Next / Show all; lesson-level `query-trace` placements belong to the SQL-J09+ content jobs.
- 2026-10-18 · QueryTrace block built (step-through PGlite dry run with dropped-row diff) + 2 lab traces on hr/shop; check-exercises --lab, eslint and vite build all pass
- 2026-10-18 · Inspected: pass. Block matches BLOCKS.md query-trace; 2 lab traces verified against PGlite (hr 21→14→6→4→4→4, shop 31→2→12); check-exercises --lab, eslint, engines, provenance, gen/lint and vite build all pass.
