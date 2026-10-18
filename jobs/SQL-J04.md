---
type: job
code: SQL
id: J04
title: "Port query plan, dialect diff, schema diagram"
status: done
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 4
depends: []
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J04 · Port query plan, dialect diff, schema diagram.md"
created: 2026-10-17
updated: 2026-10-18
lane: 2
---
# SQL J04 · Port query plan, dialect diff, schema diagram

## Goal
Port the three old static blocks to React; 57 lesson query plans and 42 dialect diffs depend on them.

## Done when
- [x] `QueryPlan.jsx`: collapsible tree, cost range, estimated vs actual rows with a ratio badge (> 10× = warn), conditions in mono, most expensive node (exclusive cost) highlighted, Copy JSON button, `compareWith` side by side (stacks on phones)
- [x] `DialectDiff.jsx`: tabs or columns via `Code`; empty or comment-only fields show a "same as SQL" chip
- [x] `SchemaDiagram.jsx`: pure-SVG table cards with PK/FK markers and FK lines; accepts plain table names; reads `b.spec ?? b`
- [x] `content/lab/plans.json` has samples incl. two plans copied from lessons; `node scripts/lint-content.mjs` 0 errors
- [x] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J04 --emptyOutDir` passes (then delete `dist-SQL-J04` with node fs.rmSync)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- old versions: `git show main:renderer/blocks/query-plan.js`, `…/dialect-diff.js`, `…/schema-diagram.js` (escaping there was broken)
- examples in lessons: `grep -l query-plan content/*/L*.json`

## Steps
1. Build QueryPlan.
2. Build DialectDiff.
3. Build SchemaDiagram (no mermaid).
4. Lab samples, checks, AGENTS.md status table.

## Limits
- May edit: `QueryPlan.jsx`, `DialectDiff.jsx`, `SchemaDiagram.jsx` (+ .css), `content/lab/plans.json`, the AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
- **Changed:** `src/components/blocks/QueryPlan.jsx` (+.css): collapsible tree, cost range, est/actual rows ratio badge (>10× warn), mono conditions, hottest node by exclusive cost, Copy JSON, compareWith side-by-side (stacks ≤760px); fixed compare-plan hot-path keys. `DialectDiff.jsx` (+.css): columns via Code, "same as SQL" chip for empty/comment-only fields. `SchemaDiagram.jsx` (+.css): pure-SVG cards with PK/FK markers + FK lines, plain table names, reads `b.spec ?? b`. `content/lab/plans.json` samples (6 plans incl. 2 from lessons, 3 dialect-diffs, 3 schema-diagrams).
- **Checks:** `node scripts/lint-content.mjs` 0 errors; `node scripts/gen.mjs` ok; `node scripts/check-provenance.mjs` 0 errors; `node scripts/check-exercises.mjs` 0 errors; `npx eslint` clean on touched files; `npx vite build --outDir dist-SQL-J04` passed (dist deleted). esbuild transform OK on all 3 components.
- **Open:** none for this card; AGENTS.md status table left as "built, not yet reviewed".
- 2026-10-18 · QueryPlan/DialectDiff/SchemaDiagram ported; build passes
- 2026-10-18 · Inspected: pass. All 5 Done-when items verified (QueryPlan/DialectDiff/SchemaDiagram + plans.json + eslint/build clean); dist deleted.
