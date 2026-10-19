---
type: job
code: SQL
id: J18
title: "Widen sourcing with all PGExercises categories"
owner: opencode
agent: mechanic
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[SQL LMS — CARD]]"
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
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\AGENTS.md` (repo rules, verify commands, block contract)
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\BLOCKS.md` (block JSON shapes)
- `content/SOURCING.md`, `content/AGENT_BRIEF.md` (invariants)
- `content/problems.json`
- https://pgexercises.com/ (fetch each question page)

## Steps
0. From the vault root run `python .obs-studio/comms.py jobs SQL --all`; if J09, J10, J11, J12, J13, J14, J15, J16, J17 is not `done`, set this card `blocked` with that reason and stop.
1. Fetch each category index, then each question page; record only questions whose page loads.
2. Append entries; route each to the module it actually tests.
3. Run the four scripts; update SOURCING.md counts.

## Limits
- May edit: `content/problems.json`, `content/modules.json` (sourced counts via the script), `content/SOURCING.md`, lesson files only through `sync-problems.mjs`.
- Never invent an entry: a page you could not load is not added.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
