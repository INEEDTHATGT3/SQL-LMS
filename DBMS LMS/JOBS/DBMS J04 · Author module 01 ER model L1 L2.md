---
type: job
code: DBMS
id: J04
title: "Author module 01 ER model L1 L2"
owner: opencode
agent: mechanic
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\dbms-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[DBMS LMS — CARD]]"
---
# DBMS J04 · Author module 01 ER model L1 L2

## Goal
Author DBMS module `er-model` L1–L2. Use `er-diagram` with `mapping: true` for ER→tables, plus a `nat` question on minimum tables.

## Done when
- [ ] `content/er-model/L1.json`, `L2.json` follow SPEC §4 for their levels and use the blocks SPEC §3 names for this module
- [ ] `node scripts/lint-content.mjs --only=er-model` reports 0 errors for these files (quotas incl. `minBlocks`)
- [ ] Every sourced question carries `source` with a URL you loaded; every lesson links its explanation references through `modules.json` refs (no copied text)
- [ ] Report lists 3 claims you double-checked against Korth or CMU, with section numbers

## Inputs
- vault: `DJ THINKING/PROJECTS ARCHITECTURE/DBMS LMS/DBMS LMS — SPEC.md` §2–§6
- `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\AGENTS.md`, `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\content\BLOCKS.md`
- `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\content\lab\*.json` (working block examples)
- format example: `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\basics\L1.json`

## Steps
0. From the vault root run `python .obs-studio/comms.py jobs DBMS --all`; if J01 is not `done`, set this card `blocked` with that reason and stop. Also requires SQL J07 done.
1. Plan sections: mental model → core ideas → procedures/diagrams → interview angle → question set (revision card and glossary are separate keys).
2. Write the lessons; keep L1 analogies everyday, L4 tied to PostgreSQL/InnoDB.
3. Lint, fix, repeat.

## Limits
- May edit: `content/er-model/` files for these levels.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
