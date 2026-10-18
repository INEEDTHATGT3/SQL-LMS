---
type: job
code: SQL
id: J21
title: "Approach ladder and answer payload system"
status: done
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 9
depends: [SQL-J08]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J21 · Approach ladder and answer payload system.md"
created: 2026-10-17
updated: 2026-10-18
lane: 2
---
# SQL J21 · Approach ladder and answer payload system

## Goal
Bring DSA's answer-payload system and Striver's Brute → Optimal ladder into the engine, so every problem can carry a tested, multi-approach answer.

## Done when
- [x] `scripts/sync-problems.mjs` merges `content/answers/<module>.json` (`{ "<problemId>": { statement?, hints?, approaches?, exercise?, followups?, complexity? } }`) into the generated Sourced Problem Set items; `check-provenance.mjs` errors on answer ids missing from the bank; drills may carry `approaches` directly; `content/answers/README.md` documents the format
- [x] Problem block renders `approaches` as a ladder (Brute → Better → Optimal, revealed one at a time: idea, code tabs, cost, pitfalls) per `docs/STYLE.md` §4; Interview shows the approaches in order in its solution phase; Review's problem answer shows the optimal approach
- [x] `scripts/check-exercises.mjs` also runs every approach's `code` on the exercise datasets and fails if one disagrees with the graded result; `lint-content.mjs` validates the `approaches` shape; `content/BLOCKS.md` documents it
- [x] `scripts/solution-coverage.mjs` (npm script `coverage`) prints per module × tier: problems, with approaches, with exercise, with follow-ups, premium skipped — the DSA `solution-coverage.mjs` equivalent
- [x] `content/answers/basics.json` holds 2 real entries that survive sync → lesson → check-exercises; `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J21 --emptyOutDir` passes (then delete `dist-SQL-J21` with node fs.rmSync)

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
**Changed:** scripts/sync-problems.mjs, check-provenance.mjs, check-exercises.mjs, lint-content.mjs, scripts/solution-coverage.mjs, package.json, src/components/blocks.jsx (+ src/components/blocks/Problem.css), src/pages/Interview.jsx, src/pages/Review.jsx, content/answers/basics.json, content/answers/README.md, content/BLOCKS.md, AGENTS.md, docs/PARITY.md.
**Checks:** gen idempotent; check-provenance (0 err), lint-content (0 err, 1 pre-existing MCQ-length warning), check-exercises (2 exercises, 12 runs, 0 err; --lab 7 exercises, 22 runs, 0 err), test-engines (6/6), eslint (0 errors), vite build dist-SQL-J21 (pass, deleted), npm run coverage (2 approaches).
**Open:** only basics has answer payloads; other modules pending later cards.
- 2026-10-18 · Approach ladder + answer payload system; fixed BLOCKS.md approaches docs and Review.jsx arrow
- 2026-10-18 · lane 2: inspector session ended without a verdict
- 2026-10-18 · lane 2 re-check: added missing .approach-ladder/.approach-step/.approach-name CSS (co-located Problem.css, imported in blocks.jsx); all gates re-run green
- 2026-10-18 · Approach ladder + answer payload system done: answers merge in sync-problems, ladder UI in Problem/Interview/Review (added missing co-located Problem.css), check-exercises runs every approach, coverage script, 2 real basics entries; all gates green
- 2026-10-18 · Inspected: pass. All gates green — gen idempotent, provenance+exercises 0 err (12/22 runs incl. every approach), eslint 0 err, vite build ok, 2 basics answers verified end-to-end (B1-HR003/B1-HR007 merge → lesson → graded); ladder UI matches STYLE.md §4; provenance answer-id guard functionally tested; all edits within Limits.
