# AGENTS.md — rules for agents working in sql-lms

## Start here
- Work arrives as **job cards** in `jobs/` (`SQL-J01.md` …). Board: `node jobs/status.mjs` · next runnable: `node jobs/status.mjs next` · status changes only via `node jobs/status.mjs set ID <doing|review|blocked> "note"` (it also updates Dhruv's Obsidian pit wall). Commands: `/next`, `/job ID`, `/inspect ID`, `/jobs`.
- Read only what a card's **Inputs** name. Reference docs: `docs/SPEC-SQL.md` (plan, job map, audit errors per module), `docs/SPEC-DBMS.md`, `docs/STYLE.md` (**how lessons must read: Striver / Love Babbar / Gate Smashers / Ankit Bansal style**), `docs/PARITY.md` (DSA-LMS functions this app must match), `docs/RESEARCH.md` (why), `content/BLOCKS.md` (block shapes).
- Every lesson you write or port follows `docs/STYLE.md`: hook + mantra, one idea per segment then a check, a Brute → Optimal approach ladder with a dry run, a trap, interviewer follow-ups, graded runnable drills.

SQL Layered Study System: React 18 + Vite 5 SPA (branch `spa-engine`). Four tiers (L1–L4) per module. The engine is subject-agnostic: everything subject-specific lives in `content/subject.json` + `content/modules.json`, so the same `src/` will later power `dbms-lms` and a merged multi-subject app. Keep it that way: no "SQL" strings or SQL-only assumptions inside `src/lib`, `src/pages`, generic components.

## Layout
- `content/<module>/L1..L4.json` — lessons (authored directly; no copy step). `content/problems.json` — sourced-problem bank. `content/datasets/*.sql` — PostgreSQL seed scripts for exercises (`hr`, `shop`, `events` + `_edge` variants with identical schema). `content/lab/*.json` — block gallery shown at `/#/lab` (`{ "title", "blocks": [] }`).
- `src/lib/` — store (`progress.js`), SRS (`srs.js`), grading + shuffle (`grade.js`), question keys (`qkey.js`), subject config (`subject.js`), block registry (`block-types.js`).
- `src/components/blocks.jsx` — core blocks + lazy registry. `src/components/blocks/<Name>.jsx` — one lazy block each. `src/engines/<name>.js` — pure logic (no React/DOM) + `<name>.test.mjs`.
- `scripts/` — `gen.mjs` (answer keys + search index), `lint-content.mjs`, `check-provenance.mjs`, `sync-problems.mjs`, `maintain-sourcing.mjs`, `check-links.mjs`, `test-engines.mjs`, `check-exercises.mjs`.

## Verify (run what applies before reporting)
```
node scripts/test-engines.mjs        # all src/engines/*.test.mjs
node scripts/gen.mjs && node scripts/lint-content.mjs
node scripts/check-provenance.mjs
node scripts/check-exercises.mjs     # every exercise solution runs on its datasets (PGlite in Node)
npx eslint src scripts
npx vite build --outDir dist-<CARD-ID> --emptyOutDir   # then delete it (one dir per card: lanes run in parallel)
```
`npm run build` = sync problems + provenance + content lint + gen + vite build. `npm run dev` serves on :5173.

## Block contract
- Component: default export in `src/components/blocks/<Name>.jsx`, props `({ b, ctx })`. `ctx = { lessonId, level, store: { mcq, solved, blocks, actions } }`.
- `actions`: `recordAnswer(lessonId, qKey, value)`, `setSolved(lessonId, pid, bool)`, `saveBlock(lessonId, key, value)`. From `src/lib/progress.js`: `logMistake(lessonId, questionText, correctAnswerText)`, `srsActions.rateFlashcard(lessonId, cardId, 0..3)`.
- Graded answers: store key `qkey(b.q)` (or the stem the block documents), value shape per `grade.js isCorrect` (mcq index · msq index[] · nat number · order/match array). Wrong answer → `logMistake`.
- Text: render via React or `<MD text>` from `src/components/md.jsx` (escapes first). Code: `<Code code lang>` (`sql` | `py` | `cpp`).
- Styles: reuse `theme.css` classes (`.blk .blk-title .quiz-card .quiz-opt .reveal-btn table.trace .table-scroll .callout .cell-add .cell-del .cell-chg .null .dim .small .mono .ok .bad-text .warn-text .action-row .row-between`). Block-specific CSS goes in a co-located `<Name>.css`. Do not edit `theme.css`.
- SVG: `viewBox`, `max-width:100%`, works at 360px wide (no horizontal page scroll), colours only via CSS vars (`--lvl --text --text-dim --border --surface2 --green --red --warn --accent2 --accent3`), `role="img"` + `aria-label`. Toggle buttons: `type="button"` + `aria-pressed`.
- New block type: add its required fields to `REQUIRED` in `src/lib/block-types.js` and a lazy entry in `blocks.jsx` `LAZY` (both already done for all planned types).
- No new npm dependencies without a job card that says so (no mermaid: diagrams are hand-built SVG).

## Block status (keep this table current when you finish a block)
| Block | State |
| :-- | :-- |
| question, flashcards, misconception, predict, explain-back | done, verified (`content/lab/recall.json`) |
| fd-stepper, nf-decomposition (+ `engines/fd.js`) | built, not yet reviewed (`content/lab/fd.json`) |
| schedule engine (`engines/schedule.js`) | built + tests; UI `Schedule.jsx` is a stub |
| `engines/sqlrunner.js` (+ worker), `content/datasets/*` | built, not yet verified; `resultcompare.js` missing |
| sql-exercise, query-trace, table-diff | stub / missing |
| query-plan, dialect-diff, schema-diagram, er-diagram (+ `engines/er.js`) | stub |

## Content invariants (breaking one is a failed job)
1. Never delete or rewrite a synthesised drill to make room for a sourced problem.
2. Never invent a sourced problem: no verifiable `platform` + `ref` + `url` → it is a drill (`"platform": "drill"`, no url).
3. Never hand-edit the `"Sourced Problem Set"` section; edit `content/problems.json`, then `node scripts/sync-problems.mjs`.
4. Never re-tier a problem to fit a quota. Never change a problem `id` (ids key learners' SOLVED state).
5. Every SQL claim must hold on PostgreSQL 16 unless labelled with its dialect; dialect fields (`pg`, `mysql`) carry real differences, never "-- same syntax" filler.
6. MCQs: the correct option must not be the uniquely longest one (lint warns above 50% overall; aim < 40%).

## Never
Commit, push, or switch branches unless the job card says so. Touch `node_modules`, `dist`, `src/generated` by hand. Edit files a card doesn't list.
