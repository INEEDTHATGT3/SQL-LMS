---
type: job
code: SQL
id: J20
title: "Final gate before merge"
status: open
est: 30
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 29
depends: [SQL-J19]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J20 · Final gate before merge.md"
created: 2026-10-17
updated: 2026-10-17
---
# SQL J20 · Final gate before merge

## Goal
Prove the branch is ready for Dhruv to merge to main.

## Done when
- [ ] `content/subject.json` quotas gain `minBlocks: { "query-trace": { "1": 1, "2": 1 } }` and lint still passes
- [ ] `npm run build`, `npm run test:engines`, `npm run check:exercises`, `npx eslint .` all pass (Report pastes the summary lines)
- [ ] `npm run harness` passes, or the Report says Docker is unavailable
- [ ] `node scripts/solution-coverage.mjs` shows every free sourced problem with approaches + exercise
- [ ] Report lists anything left for Claude's browser QA

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `package.json` scripts

## Steps
0. Run `node jobs/status.mjs show SQL-J20`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Add the quota.
2. Run every gate; fix only small, obvious failures; list the rest under Open.

## Limits
- May edit: `content/subject.json`; small fixes in files the failing gate names. No merges, no pushes.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
