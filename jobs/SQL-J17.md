---
type: job
code: SQL
id: J17
title: "Port content · timeseries-geo"
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 18
depends: [SQL-J08, SQL-J21]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J17 · Port content · timeseries-geo.md"
created: 2026-10-17
updated: 2026-10-18
lane: 1
---
# SQL J17 · Port content · timeseries-geo

## Goal
Bring module `timeseries-geo` (L1–L4) to the new standard: correct, runnable, graded. Re-scope L1 to dates, intervals and `generate_series` gap filling; move PostGIS/H3 to L4 (PostGIS code stays as non-runnable examples; exercises only for date/time).

## Done when
- [ ] Every error listed for `timeseries-geo` in SPEC §5 is fixed; the Report lists each fix with file and line
- [ ] ≥ 3 drills per lesson carry a graded `exercise` (ids unchanged) and `node scripts/check-exercises.mjs` passes
- [ ] L1 and L2 each have a `query-trace`, the module has ≥ 1 `predict` or `misconception`, and every lesson has ≥ 1 worked problem with a Brute → Optimal `approaches` ladder (`docs/STYLE.md`)
- [ ] `node scripts/lint-content.mjs --only=timeseries-geo` and `node scripts/check-provenance.mjs` show 0 errors, and the bias line for this module is ≤ 40%
- [ ] `git diff` shows no change to any problem `id` or `tier` and none inside a "Sourced Problem Set" section

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `docs/SPEC-SQL.md` §4 (rules) and §5 (`timeseries-geo` errors)
- `content\timeseries-geo\L1.json` … `L4.json`
- `content/datasets/*.sql` (schemas for exercises)
- `content/SOURCING.md` precedence rules
- `docs/STYLE.md` (teacher style: lesson skeleton, approach ladder, checklist) and `docs/PARITY.md`

## Steps
0. Run `node jobs/status.mjs show SQL-J17`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Fix the §5 errors first, one lesson at a time.
2. Remove filler dialect fields; rebalance MCQ options.
3. Rewrite to the `docs/STYLE.md` lesson skeleton; paste its §6 checklist, ticked, into the Report.
4. Expand drill statements and add `exercise` objects; add the traces and the predict/misconception.
5. Run the gates for `timeseries-geo` and paste the numbers into the Report.

## Limits
- May edit: `content/timeseries-geo/L1.json`–`L4.json`; may append tables/rows to `content/datasets/*.sql` (both twins) if every existing exercise still passes.
- Never edit `content/problems.json` or a "Sourced Problem Set" section; never change an id or tier.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
- 2026-10-18 · lane 1 gave up after 3 mechanic attempts; needs Claude or Dhruv (see jobs/logs/SQL-J17-*.log)
- 2026-10-18 · reopened by Claude: previous attempts died on the free-tier rate limit (no model output), not on the work. Keep any partial edits that pass the gates.
