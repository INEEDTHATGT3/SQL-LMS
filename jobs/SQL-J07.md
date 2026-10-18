---
type: job
code: SQL
id: J07
title: "ER diagram block and ER to tables mapping"
status: done
est: 60
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 7
depends: []
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J07 · ER diagram block and ER to tables mapping.md"
created: 2026-10-17
updated: 2026-10-18
lane: 1
---
# SQL J07 · ER diagram block and ER to tables mapping

## Goal
Build the ER diagram block (Chen and crow's foot) and the ER→relational mapping that DBMS module 01 needs.

## Done when
- [ ] `src/engines/er.js` exports `mapToTables(spec)` → `{ tables: [{ name, columns: [{ name, pk, fk }] }], minTables }` (strong/weak entity, 1:N, 1:1 total side, M:N, multivalued, composite flattened, derived omitted, ISA table-per-subclass); `er.test.mjs` has ≥ 8 cases incl. a recursive relationship and a GATE 'minimum tables' classic; tests pass
- [ ] `ErDiagram.jsx`: Chen (double rect weak, double diamond identifying, double oval multivalued, dashed oval derived, underline key, dashed underline partial key, double line total participation, 1/N/M labels, ISA triangle) and crow's foot, `both`; automatic layout when `layout` is absent; `mapping: true` renders the tables; `ask` graded
- [ ] `content/lab/er.json` has ≥ 3 diagrams (company, university with a weak entity, an ISA); SVG scales to 360 px
- [ ] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J07 --emptyOutDir` passes (then delete `dist-SQL-J07` with node fs.rmSync)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)

## Steps
1. Write er.js + tests first.
2. Build the SVG renderer; ovals spread around their entity without overlap for ≤ 6 attributes.
3. Lab samples, checks, AGENTS.md status table.

## Limits
- May edit: `src/engines/er.js` + test, `ErDiagram.jsx` (+ .css), `content/lab/er.json`, the AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
- 2026-10-18 · lane 1 gave up after 3 mechanic attempts; needs Claude or Dhruv (see jobs/logs/SQL-J07-*.log)
- 2026-10-18 · Reset by Claude: blocked by a free-model outage (Internal Server Error), not by the work; resume from the existing partial work
- 2026-10-18 · ER diagram block (Chen + crow's foot) and ER→tables mapping complete: engine 10 tests pass, lab has 3 diagrams, build clean
- 2026-10-18 · Inspected: pass. All 4 Done when items verified: (1) er.js + 10 tests pass incl. recursive & GATE min-tables; (2) ErDiagram.jsx Chen + crow's foot with all required notations, auto-layout, mapping, ask graded; (3) lab/er.json has 3 diagrams (company, university+weak, ISA); (4) eslint clean, vite build passes, dist deleted.
