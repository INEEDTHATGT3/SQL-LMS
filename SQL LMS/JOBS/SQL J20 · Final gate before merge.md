---
type: job
code: SQL
id: J20
title: "Final gate before merge"
owner: opencode
agent: mechanic
status: open
est: 30
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[SQL LMS — CARD]]"
---
# SQL J20 · Final gate before merge

## Goal
Prove the branch is ready for Dhruv to merge to main.

## Done when
- [ ] `content/subject.json` quotas gain `minBlocks: { "query-trace": { "1": 1, "2": 1 } }` and lint still passes
- [ ] `npm run build`, `npm run test:engines`, `npm run check:exercises`, `npx eslint .` all pass (Report pastes the summary lines)
- [ ] `npm run harness` passes, or the Report says Docker is unavailable
- [ ] Report lists anything left for Claude's browser QA

## Inputs
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\AGENTS.md` (repo rules, verify commands, block contract)
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\BLOCKS.md` (block JSON shapes)
- `package.json` scripts

## Steps
0. From the vault root run `python .obs-studio/comms.py jobs SQL --all`; if J19 is not `done`, set this card `blocked` with that reason and stop.
1. Add the quota.
2. Run every gate; fix only small, obvious failures; list the rest under Open.

## Limits
- May edit: `content/subject.json`; small fixes in files the failing gate names. No merges, no pushes.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
