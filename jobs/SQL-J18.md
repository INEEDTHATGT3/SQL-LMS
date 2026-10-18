---
type: job
code: SQL
id: J18
title: "Widen sourcing with all PGExercises categories"
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 19
depends: [SQL-J09, SQL-J10, SQL-J11, SQL-J12, SQL-J13, SQL-J14, SQL-J15, SQL-J16, SQL-J17]
exclusive: true
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J18 · Widen sourcing with all PGExercises categories.md"
created: 2026-10-17
updated: 2026-10-17
---
# SQL J18 · Widen sourcing with all PGExercises categories

## Goal
Add the remaining PGExercises categories (Joins and Subqueries, Modifying Data, Aggregates, Working with Strings, Recursive) to the sourced bank with verified URLs.

## Done when
- [ ] Each new `problems.json` entry has `platform: "pgexercises"`, `sheet: "pgexercises"`, `ref` = slug, a `url` you fetched successfully, an id `<LETTER><TIER>-PG<slug>` and a tier set by SOURCING.md rules
- [ ] `sources.pgexercises` and SOURCING.md counts match the bank; SQLZoo is listed in SOURCING.md as a reference overlay (no stable problem ids)
- [ ] `node scripts/maintain-sourcing.mjs && node scripts/sync-problems.mjs && node scripts/check-provenance.mjs` → 0 errors
- [ ] `node scripts/lint-content.mjs` 0 errors

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `content/SOURCING.md`, `content/AGENT_BRIEF.md` (invariants)
- `content/problems.json`
- https://pgexercises.com/ (fetch each question page)

## Steps
0. Run `node jobs/status.mjs show SQL-J18`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Fetch each category index, then each question page; record only questions whose page loads.
2. Append entries; route each to the module it actually tests.
3. Run the four scripts; update SOURCING.md counts.

## Limits
- May edit: `content/problems.json`, `content/modules.json` (sourced counts via the script), `content/SOURCING.md`, lesson files only through `sync-problems.mjs`.
- Never invent an entry: a page you could not load is not added.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
