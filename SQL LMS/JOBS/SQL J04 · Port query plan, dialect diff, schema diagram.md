---
type: job
code: SQL
id: J04
title: "Port query plan, dialect diff, schema diagram"
owner: opencode
agent: mechanic
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[SQL LMS — CARD]]"
---
# SQL J04 · Port query plan, dialect diff, schema diagram

## Goal
Port the three old static blocks to React; 57 lesson query plans and 42 dialect diffs depend on them.

## Done when
- [ ] `QueryPlan.jsx`: collapsible tree, cost range, estimated vs actual rows with a ratio badge (> 10× = warn), conditions in mono, most expensive node (exclusive cost) highlighted, Copy JSON button, `compareWith` side by side (stacks on phones)
- [ ] `DialectDiff.jsx`: tabs or columns via `Code`; empty or comment-only fields show a "same as SQL" chip
- [ ] `SchemaDiagram.jsx`: pure-SVG table cards with PK/FK markers and FK lines; accepts plain table names; reads `b.spec ?? b`
- [ ] `content/lab/plans.json` has samples incl. two plans copied from lessons; `node scripts/lint-content.mjs` 0 errors
- [ ] `npx eslint <your files>` clean; `npx vite build --outDir dist-check --emptyOutDir` passes (then delete `dist-check`)

## Inputs
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\AGENTS.md` (repo rules, verify commands, block contract)
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\BLOCKS.md` (block JSON shapes)
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
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
