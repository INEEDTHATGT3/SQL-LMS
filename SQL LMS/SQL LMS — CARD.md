---
type: project
code: SQL
phase: assembly
updated: 2026-10-17
last_review: 2026-10-17
---
# SQL · SQL LMS — CARD

**Objective:** bring the SQL LMS up to DSA-LMS quality: React SPA with spaced review, runnable graded SQL in the browser, theory and diagram blocks, and corrected content, for placement and data-analyst interviews.
**Done when:** all 15 lesson blocks work in `/#/lab`; every drill that can run has a graded exercise; the audit's factual errors are fixed; `npm run build` + `check:exercises` + `test:engines` are green; Pages is live from `main`.
**Constraints:** repo `C:\MEGA NZ\SKILLS MATERIAL\sql-lms`, branch `spa-engine`; repo rules in its `AGENTS.md`; engine stays subject-agnostic (DBMS reuses it); no backend, localStorage only.

## Now
- Engine done: review queue, mistakes, notes, sprint, interview, stats, search. Five recall blocks verified. FD + schedule engines built, unreviewed. Ten blocks still stubs.

## Next
1. `/job SQL J01` then `/inspect SQL J01` in OpenCode (SQL runtime core)
2. Jobs J02–J08 finish the blocks; J09–J17 port content module by module
3. J18–J20 sourcing, docs, final gate

## Owners
- Dhruv: calls, merge to main · Claude: design, review, browser QA · OpenCode: job cards in `JOBS/`

## Key files
- [[SQL LMS — SPEC]] · [[SQL LMS — DECISIONS]] · [[SQL LMS — ACTIONS]] · [[DBMS LMS — CARD]] · [[LAYERED STUDY SYSTEM — CARD]]

## Parking lot
- Merged multi-subject app (DSA + SQL + DBMS) in a new repo with a better name, after SQL and DBMS ship.

## Log
- 2026-10-17 · pit wall set up: SPEC, 20 job cards, ACTIONS; repo AGENTS.md + content/BLOCKS.md
- 2026-10-17 · car registered; engine on `spa-engine`; 20 job cards issued
