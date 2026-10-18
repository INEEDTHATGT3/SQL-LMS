---
type: job
code: SQL
id: J08
title: "Engine polish and generic block quotas"
status: done
est: 25
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 8
depends: [SQL-J02, SQL-J03, SQL-J04, SQL-J05, SQL-J06, SQL-J07]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J08 · Engine polish and generic block quotas.md"
created: 2026-10-17
updated: 2026-10-18
lane: 2
---
# SQL J08 · Engine polish and generic block quotas

## Goal
Close the small engine gaps found in review and add a generic per-level block quota both subjects use.

## Done when
- [x] `src/lib/grade.js` `answerKey` turns a number answer + `tolerance` into `{ min, max }`; a test covers it
- [x] `scripts/lint-content.mjs` walks `misconception.evidence` like `predict.reveal`, and supports `quotas.minBlocks: { "typeA|typeB": { "1": n, … } }` counting blocks of any listed type (nested ones too)
- [x] Claude QA fix: `SqlExercise.jsx` clears an earlier Run error/result when Submit starts (a stale "syntax error" line stayed visible under a PASS verdict)
- [x] AGENTS.md Block status table shows every block done; `node scripts/gen.mjs && node scripts/lint-content.mjs` 0 errors; `node scripts/test-engines.mjs` passes
- [x] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J08 --emptyOutDir` passes (then delete `dist-SQL-J08` with node fs.rmSync)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `src/lib/grade.js`, `scripts/lint-content.mjs`, `scripts/gen.mjs`

## Steps
0. Run `node jobs/status.mjs show SQL-J08`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Patch grade.js + test.
2. Patch lint-content.mjs (no subject.json change yet).
3. Run the gates.

## Limits
- May edit: `src/components/blocks/SqlExercise.jsx` (that one fix), `src/lib/grade.js`, a new `src/engines/grade.test.mjs`, `scripts/lint-content.mjs`, AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
**Changed:** src/lib/grade.js (answerKey widens number answer by tolerance); src/engines/grade.test.mjs (new); scripts/lint-content.mjs (misconception.evidence walk + minBlocks quotas + type counts); src/components/blocks/SqlExercise.jsx (clear result on Submit); AGENTS.md (block status table all done).
**Checks:** test-engines 6/6 pass; gen 36 lessons/423 keys; lint 0 errors (1 pre-existing length-bias warning); eslint clean; vite build dist-SQL-J08 ok then deleted; check-exercises 0 errors.
**Open:** minBlocks not yet added to subject.json (card says no subject.json change yet); warning answer-length bias 66% remains.
- 2026-10-18 · Engine polish done: grade tolerance, lint minBlocks/evidence, SqlExercise stale error fix, all blocks marked done
- 2026-10-18 · Inspected: pass. grade tolerance + test; lint evidence/minBlocks; SqlExercise stale result cleared; AGENTS table all done; gates green.
