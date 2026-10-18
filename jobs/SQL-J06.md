---
type: job
code: SQL
id: J06
title: "Review FD engine and normalization blocks"
status: open
est: 45
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 6
depends: []
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J06 · Review FD engine and normalization blocks.md"
created: 2026-10-17
updated: 2026-10-17
---
# SQL J06 · Review FD engine and normalization blocks

## Goal
Adversarially check the functional-dependency engine and its two blocks before lessons rely on them.

## Done when
- [ ] ≥ 6 new independent cases in `fd.test.mjs`, answers derived by hand with a cited source: closure, candidate keys, superkey count, minimal cover, a 3NF-but-not-BCNF relation, R(ABC) AB→C, C→B (BCNF lossless but not dependency-preserving), a 3-way chase; all pass
- [ ] FdStepper practice answers are stored under a qkey and wrong ones call `logMistake`; NfDecomposition `ask` is graded (Report cites the lines)
- [ ] `content/lab/fd.json` covers every `tasks` value and both targets
- [ ] `npx eslint <your files>` clean; `npx vite build --outDir dist-check --emptyOutDir` passes (then delete `dist-check`)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `src/engines/fd.js` + `fd.test.mjs`
- `src/components/blocks/FdStepper.jsx`, `NfDecomposition.jsx`
- `content/lab/fd.json`

## Steps
1. Write the new cases first; fix the engine for any failure.
2. Read both blocks against BLOCKS.md; fix gaps.
3. Extend the lab file; run the checks.
4. AGENTS.md status table.

## Limits
- May edit: `src/engines/fd.js` + test, `FdStepper.jsx`, `NfDecomposition.jsx` (+ .css), `content/lab/fd.json`, the AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
