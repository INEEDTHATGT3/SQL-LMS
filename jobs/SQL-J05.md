---
type: job
code: SQL
id: J05
title: "Transaction schedule block"
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 5
depends: []
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J05 · Transaction schedule block.md"
created: 2026-10-17
updated: 2026-10-17
---
# SQL J05 · Transaction schedule block

## Goal
Turn the existing schedule engine into the block that teaches serializability, recoverability and locking protocols.

## Done when
- [ ] `Schedule.jsx` implements BLOCKS.md `schedule`: SVG timeline (column per transaction, time downward, conflict arrows), precedence graph (circle layout, cycle edges red), verdict table ✓/✗ with a one-line reason each, lock curve when `protocol` is set, waits-for graph on deadlock, step-through
- [ ] `mode: predict` hides verdicts until the ask is answered; graded and stored under `qkey(ask.q)`; wrong → `logMistake`
- [ ] ≥ 4 new schedules in `schedule.test.mjs` with hand-derived answers and a cited source (Korth ch 17–18, Gate Smashers, or a GATE Overflow id); `node scripts/test-engines.mjs` passes
- [ ] `content/lab/txn.json` has ≥ 5 samples covering none / 2PL family / TO or Thomas / wait-die or wound-wait
- [ ] `npx eslint <your files>` clean; `npx vite build --outDir dist-check --emptyOutDir` passes (then delete `dist-check`)

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
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
