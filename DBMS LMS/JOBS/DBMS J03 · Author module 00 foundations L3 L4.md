---
type: job
code: DBMS
id: J03
title: "Author module 00 foundations L3 L4"
owner: opencode
agent: mechanic
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\dbms-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[DBMS LMS — CARD]]"
---
# DBMS J03 · Author module 00 foundations L3 L4

## Goal
Author DBMS module `foundations` L3–L4.

## Done when
- [ ] `content/foundations/L3.json`, `L4.json` follow SPEC §4 for their levels and use the blocks SPEC §3 names for this module
- [ ] `node scripts/lint-content.mjs --only=foundations` reports 0 errors for these files (quotas incl. `minBlocks`)
- [ ] Every sourced question carries `source` with a URL you loaded; every lesson links its explanation references through `modules.json` refs (no copied text)
- [ ] Report lists 3 claims you double-checked against Korth or CMU, with section numbers
- [ ] `modules.json` sets `foundations` to `status: "active"`, a `content/changelog.json` entry is added, and `npx vite build` passes

## Inputs
- vault: `DJ THINKING/PROJECTS ARCHITECTURE/DBMS LMS/DBMS LMS — SPEC.md` §2–§6
- `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\AGENTS.md`, `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\content\BLOCKS.md`
- `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\content\lab\*.json` (working block examples)
- format example: `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\basics\L1.json`

## Steps
0. From the vault root run `python .obs-studio/comms.py jobs DBMS --all`; if J02 is not `done`, set this card `blocked` with that reason and stop.
1. Plan sections: mental model → core ideas → procedures/diagrams → interview angle → question set (revision card and glossary are separate keys).
2. Write the lessons; keep L1 analogies everyday, L4 tied to PostgreSQL/InnoDB.
3. Lint, fix, repeat.

## Limits
- May edit: `content/foundations/` files for these levels, `content/modules.json` (status only), `content/changelog.json`.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
