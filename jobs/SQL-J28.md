---
type: job
code: SQL
id: J28
title: "Answer payloads · aggregation L2–L3"
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 26
depends: [SQL-J18]
exclusive: true
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J28 · Answer payloads · aggregation L2–L3.md"
created: 2026-10-17
updated: 2026-10-17
---
# SQL J28 · Answer payloads · aggregation L2–L3

## Goal
Give every free sourced problem in **aggregation L2–L3** a Striver-style answer payload: own-words statement, hint ladder, Brute → Optimal approaches, a graded exercise on a replica dataset, interviewer follow-ups.

## Done when
- [ ] `content/answers/aggregation.json` has an entry for every non-premium sourced problem in scope (ids listed in the Report); `leetcode-advanced-sql-50` (premium) entries are skipped
- [ ] Each entry: own-words `statement` (incl. expected columns), 3-step `hints`, `approaches` per `docs/STYLE.md` §4 (≥ 2 when a naive one exists), `exercise` on `content/datasets/<lc|hr|pgx>-<ref>.sql` + `_edge` twin (public schema, our own rows; PGExercises problems share `pgx-cd.sql`), ≥ 2 `followups`
- [ ] `node scripts/sync-problems.mjs && node scripts/check-exercises.mjs && node scripts/check-provenance.mjs` → 0 errors
- [ ] `node scripts/solution-coverage.mjs` shows 100% payload coverage for the free problems in scope
- [ ] No statement or explanation text copied verbatim (Report spot-checks 3 against the originals)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `docs/STYLE.md` (teacher style: lesson skeleton, approach ladder, checklist) and `docs/PARITY.md`
- `content/answers/README.md` (format, from J21)
- `content/problems.json` (the scope's entries; their `url` shows schema and examples — read, then paraphrase)

## Steps
0. Run `node jobs/status.mjs show SQL-J28`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. List the scope's free problem ids with a node one-liner over `content/problems.json`. If there are more than 20, set this card `blocked` with "split needed" and stop.
2. Per problem: open its url, note the schema, write the replica datasets, write the entry (statement → hints → approaches → exercise → follow-ups).
3. Run the gates; paste coverage numbers into the Report.

## Limits
- May edit: `content/answers/aggregation.json`; may create `content/datasets/lc-*.sql`, `hr-*.sql`, `pgx-*.sql` (+ `_edge`).
- Never edit `content/problems.json`, lesson files or a Sourced Problem Set section by hand.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
