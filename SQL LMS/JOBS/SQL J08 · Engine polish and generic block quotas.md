---
type: job
code: SQL
id: J08
title: "Engine polish and generic block quotas"
owner: opencode
agent: mechanic
status: open
est: 25
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[SQL LMS — CARD]]"
---
# SQL J08 · Engine polish and generic block quotas

## Goal
Close the small engine gaps found in review and add a generic per-level block quota both subjects use.

## Done when
- [ ] `src/lib/grade.js` `answerKey` turns a number answer + `tolerance` into `{ min, max }`; a test covers it
- [ ] `scripts/lint-content.mjs` walks `misconception.evidence` like `predict.reveal`, and supports `quotas.minBlocks: { "typeA|typeB": { "1": n, … } }` counting blocks of any listed type (nested ones too)
- [ ] AGENTS.md Block status table shows every block done; `node scripts/gen.mjs && node scripts/lint-content.mjs` 0 errors; `node scripts/test-engines.mjs` passes
- [ ] `npx eslint <your files>` clean; `npx vite build --outDir dist-check --emptyOutDir` passes (then delete `dist-check`)

## Inputs
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\AGENTS.md` (repo rules, verify commands, block contract)
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\BLOCKS.md` (block JSON shapes)
- `src/lib/grade.js`, `scripts/lint-content.mjs`, `scripts/gen.mjs`

## Steps
0. From the vault root run `python .obs-studio/comms.py jobs SQL --all`; if J02, J03, J04, J05, J06, J07 is not `done`, set this card `blocked` with that reason and stop.
1. Patch grade.js + test.
2. Patch lint-content.mjs (no subject.json change yet).
3. Run the gates.

## Limits
- May edit: `src/lib/grade.js`, a new `src/engines/grade.test.mjs`, `scripts/lint-content.mjs`, AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
