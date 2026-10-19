---
type: job
code: SQL
id: J03
title: "Query trace block"
owner: opencode
agent: mechanic
status: open
est: 30
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[SQL LMS — CARD]]"
---
# SQL J03 · Query trace block

## Goal
Give SQL its dry-run trace: show the intermediate table after each clause.

## Done when
- [ ] `QueryTrace.jsx` implements BLOCKS.md `query-trace`: Run trace boots PGlite, runs every stage, prev/next + show all, row count per stage, rows dropped since the previous stage marked `.cell-del` when columns match
- [ ] `content/lab/sql-trace.json` has ≥ 2 traces (WHERE → GROUP BY → HAVING on hr; the LEFT JOIN + WHERE-on-right-table trap on shop); `node scripts/check-exercises.mjs --lab` passes
- [ ] `npx eslint <your files>` clean; `npx vite build --outDir dist-check --emptyOutDir` passes (then delete `dist-check`)

## Inputs
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\AGENTS.md` (repo rules, verify commands, block contract)
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\BLOCKS.md` (block JSON shapes)
- `src/engines/sqlrunner.js`
- `src/components/blocks/TableDiff.jsx` (reuse its table styling if done)

## Steps
0. From the vault root run `python .obs-studio/comms.py jobs SQL --all`; if J01 is not `done`, set this card `blocked` with that reason and stop.
1. Build the block.
2. Write the lab samples and run the checks.
3. Update the AGENTS.md status table.

## Limits
- May edit: `QueryTrace.jsx` (+ .css), `content/lab/sql-trace.json`, the AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
