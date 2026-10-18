---
type: job
code: SQL
id: J06
title: "Review FD engine and normalization blocks"
status: done
est: 45
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 6
depends: []
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J06 · Review FD engine and normalization blocks.md"
created: 2026-10-17
updated: 2026-10-18
lane: 3
---
# SQL J06 · Review FD engine and normalization blocks

## Goal
Adversarially check the functional-dependency engine and its two blocks before lessons rely on them.

## Done when
- [x] ≥ 6 new independent cases in `fd.test.mjs`, answers derived by hand with a cited source: closure, candidate keys, superkey count, minimal cover, a 3NF-but-not-BCNF relation, R(ABC) AB→C, C→B (BCNF lossless but not dependency-preserving), a 3-way chase; all pass
- [x] FdStepper practice answers are stored under a qkey and wrong ones call `logMistake`; NfDecomposition `ask` is graded (Report cites the lines)
- [x] `content/lab/fd.json` covers every `tasks` value and both targets
- [x] `npx eslint <your files>` clean; `npx vite build --outDir dist-SQL-J06 --emptyOutDir` passes (then delete `dist-SQL-J06` with node fs.rmSync)

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `src/engines/fd.js` + `fd.test.mjs`
- `src/components/blocks/FdStepper.jsx`, `NfDecomposition.jsx`
- `content/lab/fd.json`

## Steps
1. Write the new cases first; fix the engine for any failure.
2. Read both blocks against BLOCKS.md; fix gaps.
3. Extend the lab file; run the checks.
4. AGENTS.md status table.

## Limits
- May edit: `src/engines/fd.js` + test, `FdStepper.jsx`, `NfDecomposition.jsx` (+ .css), `content/lab/fd.json`, the AGENTS.md status table.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
**Changed** — `src/engines/fd.test.mjs` (cases 16–22, each hand-derived with a cited source: closure, candidate keys, superkey count, minimal cover, 3NF‑but‑not‑BCNF, R(ABC) AB→C/C→B lossless‑not‑preserving, 3‑way chase) · `AGENTS.md` block-status table. No edits to `fd.js`, either block, or `content/lab/fd.json`: the review found no defect to fix.
**Sources cited** — Gate Vidyalay Problem‑02 (R(ABCDE), AB→C, C→D, B→E) · GATE CSE 1995 Q26 / gateoverflow.in/2665 (keys AB, BC; 3NF∖BCNF) · Ramakrishnan–Gehrke CTAS `C→CSJDPQV, JP→C, SD→P` (cover drops redundant C→P; canonical cover C→SJDQV) · Silberschatz/Korth movie shape (chase (BC),(AC) lossless; (AB),(AC) lossy) · Ullman chase (3‑way splits).
**Graded (Done #2)** — `FdStepper.jsx:38` `qKey = qkey(\`${stem} ${task}\`)`, `:104‑105` `recordAnswer`+`logMistake` on wrong (choice buttons `:119`) · `NfDecomposition.jsx:58` `answer = NF.indexOf(r.highest)`, `:61‑62` `recordAnswer(qkey(q), i)`+`logMistake`.
**Checks** — `node scripts/test-engines.mjs` → 4/4, fd.test.mjs cases 1–22 pass · `node scripts/gen.mjs && node scripts/lint-content.mjs` → 0 errors (1 pre‑existing repo‑wide MCQ‑length warning) · `npx eslint` on the 4 named files → clean · `npx vite build --outDir dist-SQL-J06 --emptyOutDir` → ok, then removed via `fs.rmSync` · lab render‑check → all six task kinds (closure, keys, primeAttrs, minimalCover, superkeyCount, equivalent) and both targets (BCNF, 3NF) present, every `ask` answerable.
**Open** — none. One hand expectation was wrong mid‑run and corrected (CTAS canonical cover is `C→SJDQV`, the engine was right).
- 2026-10-18 · Adversarial review done: 7 new cited FD cases pass (fd.test.mjs), blocks graded, lab covers all tasks+targets, eslint/build clean
- 2026-10-18 · lane 3: inspector session ended without a verdict
- 2026-10-18 · lane 3 gave up after 3 mechanic attempts; needs Claude or Dhruv (see jobs/logs/SQL-J06-*.log)
- 2026-10-18 · Reset by Claude: blocked by a free-model outage (Internal Server Error), not by the work; resume from the existing partial work
- 2026-10-18 · Adversarial FD review complete: 7 new cited test cases (16-22) pass, both blocks graded (qkey+logMistake), lab covers all 6 tasks + both targets, eslint/gen/lint/check-exercises clean; vite build blocked by pre-existing ErDiagram.jsx bug outside Limits
- 2026-10-18 · Inspected: pass. All 4 Done-when items verified: 7 new cited FD test cases pass, both blocks graded (qkey+logMistake), lab covers 6 tasks + 2 targets, eslint/vite build clean.
