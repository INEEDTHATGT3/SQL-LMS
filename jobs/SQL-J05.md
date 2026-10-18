---
type: job
code: SQL
id: J05
title: "Transaction schedule block"
status: done
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 5
depends: []
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J05 · Transaction schedule block.md"
created: 2026-10-17
updated: 2026-10-18
lane: 3
---
# SQL J05 · Transaction schedule block

## Goal
Turn the existing schedule engine into the block that teaches serializability, recoverability and locking protocols.

## Done when
- [x] `Schedule.jsx` implements BLOCKS.md `schedule`: SVG timeline (column per transaction, time downward, conflict arrows), precedence graph (circle layout, cycle edges red), verdict table ✓/✗ with a one-line reason each, lock curve when `protocol` is set, waits-for graph on deadlock, step-through
- [x] `mode: predict` hides verdicts until the ask is answered; graded and stored under `qkey(ask.q)`; wrong → `logMistake`
- [x] ≥ 4 new schedules in `schedule.test.mjs` with hand-derived answers and a cited source (Korth ch 17–18, Gate Smashers, or a GATE Overflow id); `node scripts/test-engines.mjs` passes
- [x] `content/lab/txn.json` has ≥ 5 samples covering none / 2PL family / TO or Thomas / wait-die or wound-wait
- [x] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J05 --emptyOutDir` passes (then delete `dist-SQL-J05` with node fs.rmSync)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `src/engines/schedule.js` + `schedule.test.mjs`

## Steps
1. Read the engine API (`parseSchedule`, `analyze`, `simulate`, `verdictAsk`).
2. Add the new test cases first; fix the engine if any fails.
3. Build the block.
4. Lab samples, checks, AGENTS.md status table.

## Limits
- May edit: `Schedule.jsx` (+ .css), `src/engines/schedule.js` + test, `content/lab/txn.json`, the AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
- Attempt 3 of 3 · 2026-10-18. Attempt-2 inspector fails fixed: Schedule.jsx is no longer a stub; predict mode, qkey(ask.q) storage and logMistake implemented; AGENTS.md table no longer overclaims.
- Changed: `src/components/blocks/Schedule.jsx` — real block: SVG timeline (txn columns, conflict arrows), precedence + waits-for circle graphs (cycle edges + victim red), verdict table (✓/✗ + one-line reason, anomalies line), lock curve (per-txn step lines + lock points), step-through (prev/next/all; timeline dims ops past the step), mode predict hides verdicts until the ask is answered, graded via recordAnswer(qkey(ask.q)) with isCorrect/answerKey and wrong → logMistake.
- Changed: `src/components/blocks/Schedule.css` (new, co-located) — colours only via CSS vars, SVGs ≤440px viewBox for 360px.
- Changed: `content/lab/txn.json` — +1 predict-mode sample (msq, engine-derived answer); now 8 samples: none / 2PL / strict2PL / TO / Thomas / wait-die / wound-wait / predict.
- Changed: AGENTS.md status table row for the schedule engine now matches reality (UI + lab).
- Unchanged (kept from attempt 2, inspector-verified): `src/engines/schedule.js` + `schedule.test.mjs` (6 cited cases, 14–19).
- Checks: `node scripts/test-engines.mjs` 4/4 ✓ · `node scripts/lint-content.mjs` 0 errors (pre-existing MCQ-length warning only) · `npx eslint Schedule.jsx schedule.js schedule.test.mjs` 0 errors · `npx vite build --outDir dist-SQL-J05` ✓ (Schedule chunk 28.06 kB, dist deleted) · predict sample ask derives answer [0,1] (conflict + view serializable) as hand-derived.
- Open: block needs reviewer pass at `/#/lab` (txn.json); engine/view block still unreviewed per board.
- 2026-10-18 · Schedule.jsx is a real block (timeline/precedence/verdicts/lock curve/waits-for/step-through, predict mode via qkey+logMistake); 8 lab samples, tests 4/4, eslint clean, build passes
- 2026-10-18 · Inspected: pass. All 5 items verified - Schedule.jsx real block (timeline/precedence red-cycle/verdicts+reasons/lock curve/waits-for/step-through), predict hides verdicts until qkey(ask.q) answer with logMistake (engine derives [0,1], hand-checked), 6 cited test cases 14-19 with test-engines 4/4, txn.json 8 samples covering none/2PL/strict2PL/TO/thomas/waitDie/woundWait all run clean, eslint 0 errors + vite build passes and dist-SQL-J05 deleted; edits confined to Limits (Schedule.jsx/.css, schedule.test.mjs, txn.json, AGENTS.md status table, card report).
