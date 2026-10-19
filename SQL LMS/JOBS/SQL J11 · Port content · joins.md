---
type: job
code: SQL
id: J11
title: "Port content · joins"
owner: opencode
agent: mechanic
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[SQL LMS — CARD]]"
---
# SQL J11 · Port content · joins

## Goal
Bring module `joins` (L1–L4) to the new standard: correct, runnable, graded. Realign L2: join algorithms, join_collapse_limit and pg_hint_plan move to L3; L2 teaches self/cross joins and conditional aggregation its sourced problems need. LATERAL stays in subqueries-ctes L2; joins links to it.

## Done when
- [ ] Every error listed for `joins` in SPEC §5 is fixed; the Report lists each fix with file and line
- [ ] ≥ 3 drills per lesson carry a graded `exercise` (ids unchanged) and `node scripts/check-exercises.mjs` passes
- [ ] L1 and L2 each have a `query-trace`; the module has ≥ 1 `predict` or `misconception`
- [ ] `node scripts/lint-content.mjs --only=joins` and `node scripts/check-provenance.mjs` show 0 errors, and the bias line for this module is ≤ 40%
- [ ] `git diff` shows no change to any problem `id` or `tier` and none inside a "Sourced Problem Set" section

## Inputs
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\AGENTS.md` (repo rules, verify commands, block contract)
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\BLOCKS.md` (block JSON shapes)
- vault: `DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/SQL LMS — SPEC.md` §4 (rules) and §5 (`joins` errors)
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\joins\L1.json` … `L4.json`
- `content/datasets/*.sql` (schemas for exercises)
- `content/SOURCING.md` precedence rules

## Steps
0. From the vault root run `python .obs-studio/comms.py jobs SQL --all`; if J08 is not `done`, set this card `blocked` with that reason and stop.
1. Fix the §5 errors first, one lesson at a time.
2. Remove filler dialect fields; rebalance MCQ options.
3. Expand drill statements and add `exercise` objects; add the traces and the predict/misconception.
4. Run the gates for `joins` and paste the numbers into the Report.

## Limits
- May edit: `content/joins/L1.json`–`L4.json`; may append tables/rows to `content/datasets/*.sql` (both twins) if every existing exercise still passes.
- Never edit `content/problems.json` or a "Sourced Problem Set" section; never change an id or tier.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
