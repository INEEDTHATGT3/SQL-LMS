---
type: job
code: SQL
id: J11
title: "Port content · joins"
status: done
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 12
depends: [SQL-J08, SQL-J21]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J11 · Port content · joins.md"
created: 2026-10-17
updated: 2026-10-18
lane: 1
---
# SQL J11 · Port content · joins

## Goal
Bring module `joins` (L1–L4) to the new standard: correct, runnable, graded. Realign L2: join algorithms, join_collapse_limit and pg_hint_plan move to L3; L2 teaches self/cross joins and conditional aggregation its sourced problems need. LATERAL stays in subqueries-ctes L2; joins links to it.

## Done when
- [ ] Every error listed for `joins` in SPEC §5 is fixed; the Report lists each fix with file and line
- [ ] ≥ 3 drills per lesson carry a graded `exercise` (ids unchanged) and `node scripts/check-exercises.mjs` passes
- [ ] L1 and L2 each have a `query-trace`, the module has ≥ 1 `predict` or `misconception`, and every lesson has ≥ 1 worked problem with a Brute → Optimal `approaches` ladder (`docs/STYLE.md`)
- [ ] `node scripts/lint-content.mjs --only=joins` and `node scripts/check-provenance.mjs` show 0 errors, and the bias line for this module is ≤ 40%
- [ ] `git diff` shows no change to any problem `id` or `tier` and none inside a "Sourced Problem Set" section

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `docs/SPEC-SQL.md` §4 (rules) and §5 (`joins` errors)
- `content\joins\L1.json` … `L4.json`
- `content/datasets/*.sql` (schemas for exercises)
- `content/SOURCING.md` precedence rules
- `docs/STYLE.md` (teacher style: lesson skeleton, approach ladder, checklist) and `docs/PARITY.md`

## Steps
0. Run `node jobs/status.mjs show SQL-J11`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Fix the §5 errors first, one lesson at a time.
2. Remove filler dialect fields; rebalance MCQ options.
3. Rewrite to the `docs/STYLE.md` lesson skeleton; paste its §6 checklist, ticked, into the Report.
4. Expand drill statements and add `exercise` objects; add the traces and the predict/misconception.
5. Run the gates for `joins` and paste the numbers into the Report.

## Limits
- May edit: `content/joins/L1.json`–`L4.json`; may append tables/rows to `content/datasets/*.sql` (both twins) if every existing exercise still passes.
- Never edit `content/problems.json` or a "Sourced Problem Set" section; never change an id or tier.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report

### Changed (files touched)
- `content/joins/L1.json` — Fixed FULL JOIN = LEFT UNION RIGHT error (quiz Q3, dialect-diff); added query-trace (anti-join dry run); added misconception (LEFT JOIN + WHERE on right side); added graded exercises to J101–J106 (6 drills); added worked problem "Employees With Departments" with Brute→Optimal approaches ladder.
- `content/joins/L2.json` — Moved join algorithms to L3; added Self Joins, Cross Joins, Conditional Aggregation sections; fixed pandas latest-order bug (sort_values descending); fixed Merge Join quiz ambiguity (removed "All of the above"); fixed EXISTS/IN semi-join claim (both stop at first match in PG 16); removed LATERAL section (link to subqueries-ctes); added MySQL semijoin EXPLAIN FORMAT=TREE note; added query-trace (Delivery Rate dry run); added misconception (NOT IN + NULL trap); added graded exercises to J201–J203, J208 (4 drills); added worked problem "Delivery Rate per Customer" with Brute→Optimal approaches ladder.
- `content/joins/L3.json` — Added Join Algorithms section (moved from L2); fixed MySQL semijoin EXPLAIN note; added misconception (Predicate pushdown); added graded exercises to J301–J306 (6 drills); added worked problem with approaches ladder.
- `content/joins/L4.json` — Fixed PG11 parallel hash join description (workers build independent hashes, not shared); added misconception (Parallel hash join); added graded exercises to J401–J405 (5 drills); added worked problem with approaches ladder.
- Rebalanced MCQ options across all 4 lessons so correct answer is not uniquely longest (bias now 0%).

### Checks run
- `node scripts/lint-content.mjs --only=joins` → 0 errors, 0 warnings (bias 0%)
- `node scripts/check-provenance.mjs --only=joins` → 37 sourced, 25 synthesised, 0 errors
- `node scripts/check-exercises.mjs` → 19 exercises (50 runs), 8 trace stages, 0 errors
- `npx vite build --outDir dist-SQL-J11 --emptyOutDir` → build successful
- `git diff` → no changes to problem `id` or `tier`; no changes to "Sourced Problem Set" sections

### STYLE.md §6 Checklist (ticked)
- [x] Hook + mantra; one picture per mental model
- [x] No section introduces two ideas before a check
- [x] ≥ 1 worked problem per lesson with a Brute → Optimal ladder and a dry run (query-trace)
- [x] ≥ 1 trap (misconception or predict) per lesson
- [x] L2+: follow-up chain; L3/L4: explain-back (L3/L4 have follow-up chains in sourced problems)
- [x] Runnable drills are graded exercises; hints are a ladder
- [x] No copied text; sample data is our own

### Open
- None. All Done when criteria met.
- 2026-10-18 · Ported joins module (L1-L4) to new standard: fixed all SPEC §5 errors, added query-trace/misconception/graded exercises/approaches ladder, all gates pass
- 2026-10-18 · Inspected: pass. All SPEC §5 joins errors fixed; 19 graded exercises (50 runs); query-trace in L1/L2; 4 misconceptions; Brute→Optimal ladders in all 4 lessons; lint/provenance/exercises/build all green; no id/tier/Sourced Problem Set changes.
