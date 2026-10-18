---
type: job
code: SQL
id: J21
title: "Approach ladder and answer payload system"
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 9
depends: [SQL-J08]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J21 · Approach ladder and answer payload system.md"
created: 2026-10-17
updated: 2026-10-17
---
# SQL J21 · Approach ladder and answer payload system

## Goal
Bring DSA's answer-payload system and Striver's Brute → Optimal ladder into the engine, so every problem can carry a tested, multi-approach answer.

## Done when
- [ ] `scripts/sync-problems.mjs` merges `content/answers/<module>.json` (`{ "<problemId>": { statement?, hints?, approaches?, exercise?, followups?, complexity? } }`) into the generated Sourced Problem Set items; `check-provenance.mjs` errors on answer ids missing from the bank; drills may carry `approaches` directly; `content/answers/README.md` documents the format
- [ ] Problem block renders `approaches` as a ladder (Brute → Better → Optimal, revealed one at a time: idea, code tabs, cost, pitfalls) per `docs/STYLE.md` §4; Interview shows the approaches in order in its solution phase; Review's problem answer shows the optimal approach
- [ ] `scripts/check-exercises.mjs` also runs every approach's `code` on the exercise datasets and fails if one disagrees with the graded result; `lint-content.mjs` validates the `approaches` shape; `content/BLOCKS.md` documents it
- [ ] `scripts/solution-coverage.mjs` (npm script `coverage`) prints per module × tier: problems, with approaches, with exercise, with follow-ups, premium skipped — the DSA `solution-coverage.mjs` equivalent
- [ ] `content/answers/basics.json` holds 2 real entries that survive sync → lesson → check-exercises; `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J21 --emptyOutDir` passes (then delete `dist-SQL-J21`)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `docs/STYLE.md` (teacher style: lesson skeleton, approach ladder, checklist) and `docs/PARITY.md`
- `scripts/sync-problems.mjs`, `check-provenance.mjs`, `check-exercises.mjs`, `lint-content.mjs`
- `src/components/blocks.jsx` (Problem), `src/pages/Interview.jsx`, `src/pages/Review.jsx`
- DSA reference: `C:\MEGA NZ\SKILLS MATERIAL\DSA\renderer\apply-answers.mjs`, `solution-coverage.mjs`, `renderer\answers\arrays-L1.mjs`

## Steps
0. Run `node jobs/status.mjs show SQL-J21`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Answer files + merge in sync-problems (keep it additive and idempotent; ids never change).
2. Approach ladder UI in Problem, Interview, Review.
3. check-exercises runs every approach; lint validates; coverage script; BLOCKS.md + answers README.
4. Two real basics entries end to end; update AGENTS.md status table and the PARITY.md rows this closes.

## Limits
- May edit: the scripts named above, `scripts/solution-coverage.mjs`, Problem in `src/components/blocks.jsx`, `src/pages/Interview.jsx`, `src/pages/Review.jsx`, `src/lib/block-types.js`, `content/BLOCKS.md`, `content/answers/*`, `package.json` (scripts only), AGENTS.md status table, `docs/PARITY.md`.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
