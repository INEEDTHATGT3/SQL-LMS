---
type: job
code: DBMS
id: J03
title: "Author module 00 foundations L3 L4"
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\dbms-lms'
seq: 42
depends: [DBMS-J02]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/DBMS LMS/JOBS/DBMS J03 · Author module 00 foundations L3 L4.md"
created: 2026-10-17
updated: 2026-10-17
---
# DBMS J03 · Author module 00 foundations L3 L4

## Goal
Author DBMS module `foundations` L3–L4.

## Done when
- [ ] `content/foundations/L3.json`, `L4.json` follow SPEC §4 for their levels and use the blocks SPEC §3 names for this module, following `docs/STYLE.md` (Report pastes its §6 checklist, ticked)
- [ ] `node scripts/lint-content.mjs --only=foundations` reports 0 errors for these files (quotas incl. `minBlocks`)
- [ ] Every sourced question carries `source` with a URL you loaded; every lesson links its explanation references through `modules.json` refs (no copied text)
- [ ] Report lists 3 claims you double-checked against Korth or CMU, with section numbers
- [ ] `modules.json` sets `foundations` to `status: "active"`, a `content/changelog.json` entry is added, and `npx vite build` passes

## Inputs
- `docs/SPEC-DBMS.md` §2–§6
- `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\AGENTS.md`, `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\content\BLOCKS.md`
- `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms\content\lab\*.json` (working block examples)
- `docs/STYLE.md`, `docs/PARITY.md` (copied into dbms-lms by J01)
- format example: `content\basics\L1.json`

## Steps
0. Run `node jobs/status.mjs show DBMS-J03`; if it prints UNMET depends, stop and tell Dhruv which card to run first. (After DBMS-J01 this card lives in `dbms-lms/jobs/`; run it there.)
1. Plan sections: mental model → core ideas → procedures/diagrams → interview angle → question set (revision card and glossary are separate keys).
2. Write the lessons; keep L1 analogies everyday, L4 tied to PostgreSQL/InnoDB.
3. Lint, fix, repeat.

## Limits
- May edit: `content/foundations/` files for these levels, `content/modules.json` (status only), `content/changelog.json`.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
