---
type: job
code: DBMS
id: J01
title: "Scaffold dbms-lms from the SQL engine"
status: open
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL'
seq: 40
depends: [SQL-J21]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/DBMS LMS/JOBS/DBMS J01 · Scaffold dbms-lms from the SQL engine.md"
created: 2026-10-17
updated: 2026-10-18
lane: 3
---
# DBMS J01 · Scaffold dbms-lms from the SQL engine

## Goal
Create the dbms-lms repo on the shared engine with the 14-module plan, ready for lessons.

## Done when
- [ ] `dbms-lms/` holds copies of sql-lms `src/`, `scripts/` (minus sync-problems, check-provenance, maintain-sourcing), `index.html`, `vite.config.js`, `eslint.config.js`, `.gitignore`, `content/BLOCKS.md`, `content/lab/`, `content/datasets/`, plus `.opencode/` and `docs/` (the job board stays in `sql-lms/jobs`); `AGENTS.md` adapted to DBMS; `package.json` named dbms-lms with prebuild = lint:content + gen
- [ ] `content/subject.json` (DBMS name, storage keys `dbms_progress_v1` / `dbms_lang`, one language `sql`, quotas from SPEC §5 incl. `minBlocks`, `minProblems` 0) and `content/modules.json` (14 modules from SPEC §3 with deps chain, `refs` from SPEC §2, levels CONCEPTS / PROCEDURES / REASONING / SYSTEMS with promises and colours, every module `status: "draft"`)
- [ ] `git init` done; `npm install`, `node scripts/test-engines.mjs`, `node scripts/gen.mjs`, `node scripts/lint-content.mjs`, `npx vite build` all pass
- [ ] No subject-specific string from SQL remains in `src/` (grep for "SQL" shows only generic uses)

## Inputs
- `docs/SPEC-DBMS.md` (all)
- `AGENTS.md`, `content\subject.json`, `content\modules.json` (shape to copy)

## Steps
0. Run `node jobs/status.mjs show DBMS-J01`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Copy the engine files, `.opencode/` and `docs/` listed in Done when into `C:\MEGA NZ\SKILLS MATERIAL\dbms-lms`.
2. Write subject.json and modules.json from the SPEC.
3. Adapt AGENTS.md (subject, invariants for theory content: cite sources, no invented GATE ids).
4. git init, npm install, run the gates.

## Limits
- May create files only inside `dbms-lms/`. Do not edit sql-lms.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
- 2026-10-18 · lane 3 gave up after 3 mechanic attempts; needs Claude or Dhruv (see jobs/logs/DBMS-J01-*.log)
- 2026-10-18 · reopened by Claude: previous attempts died on the free-tier rate limit (no model output), not on the work. Keep any partial edits that pass the gates.
