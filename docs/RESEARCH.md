# RESEARCH — why the rebuild looks like this (audit, sources, block research, 2026-09-23)

## Context
- Ask: SQL LMS (`sql-lms/`, static site) is below DSA LMS bar (`DSA/dsa-lms/`, React SPA). Improve it, or transition to DBMS LMS. System also weak for theory- and diagram-heavy topics. Source material from popular teachers, like Striver/Babbar for DSA.
- User decisions: target = SDE placements (DBMS theory + SQL rounds) + data analyst/DE SQL. **Not GATE.** Platform = **shared multi-subject SPA**.
- Evidence: 4-agent audit + research (read-only), key claims spot-checked.

## Verdict: don't convert. Two subjects, one app.
Subjects in shared SPA: `dsa` (existing), `sql` (practice track, ported + repaired), `dbms` (theory track, new).
Why not "SQL → DBMS":
- Every DBMS teacher gives SQL ~15–25% (Gate Smashers Lec 49–68 of 140; Knowledge Gate 39/236; Babbar 2/22; Korth ch 3–5 of 23; CMU 1/25). Yet same teachers keep SQL practice as separate track (Gate Smashers separate 44-video SQL playlist; Apna College separate SQL vs DBMS notes; Stanford split courses).
- Item types differ: SQL = write query, graded by execution. DBMS = recall + procedures (closure, keys, serializability, B+ splits), graded by answer key/algorithm.
- 4 of 9 SQL modules (window-functions, performance, advanced-analytics, timeseries-geo) belong to no DBMS syllabus but matter for analyst/DE roles.
- SQL LMS's best asset = sourcing discipline (170 sourced problems, provenance gate). Keep it.
- DBMS content currently ~absent anyway (ER 0, RA 0, isolation/CC 0, recovery 0, normalization ~one paragraph in basics L4) → DBMS = new writing regardless.

## Audit findings driving the work
SQL LMS (static renderer `sql-lms/vendor/core/renderer/render.js`):
- All 31 `visual` table-diff/schema-diagram blocks render as `''` (render.js:116-130 knows only boxes-array/mem-map/flow). Mermaid never loaded.
- `esc` is a no-op (render.js:15 — entities lost; same in `layered-study-template/packages/core/renderer/render.js:15`).
- Dialect toggle broken; 161 pandas + 26 SQLAlchemy snippets never render (`replace('-','_')` key mismatch, render.js:93); SQL highlighted as C++.
- Quiz keys = build-order counter (render.js:137) — adding a question shifts all later stored answers.
- No SRS, mistakes, notes, sprint, interview, stats, search, streak. Hub has no JS.
- No in-browser SQL, seed data = 95-byte placeholders, 0/228 drills have solutions, 71% drills <15 words, 0 traces.
- Lesson bodies misaligned with injected problem sets (joins L2 teaches join algorithms + pg_hint_plan; its problems need self-joins). Gaps-and-islands never taught.
- Factual errors (fix during port): FULL JOIN = "LEFT UNION RIGHT" (joins L2 :406,:695); PG11 parallel hash join backwards (joins L4 :37,:208); PG "IGNORE NULLS" (window L3 :272); GROUPS frame "PG14+" (actually 11); work_mem "per query"; MySQL CTEs "always materialized" (subq L2 :230); PL/pgSQL examples don't compile (perf L4 :338,:376); `DATE_TRUNC` for MySQL, SRID 4326 "500 m" (timeseries L1 :141,:316); X203 grand-total 100% wrong + integer-division shares (adv-analytics L2 :415); pagination OFFSET off-by-one (basics L1 :329); pandas "latest order" takes earliest (joins L2 :155).
- Harness `init.sql:43` marks 99% orders deleted; schema ≠ lesson schema.

DSA LMS SPA bugs (fix first, all subjects inherit):
- SRS never enrolls: `progress.js:131,144` import `srsActions` from `srs.js`, which doesn't export it → `/review` always empty. Fix: call `srsActionsBridge.onLessonComplete/onSolvedToggle` directly.
- 856/891 MCQ answers = option B; correct option longest in 93%. Fix: shuffle options at render (seeded by qkey) + lint rules for answer-position spread & longest-option bias.
- Python toggle: CSS keys on `body[data-lang]` (theme.css:60), app sets `<html data-lang>` (blocks.jsx:80).
- TOC `#sec-i` links hit 404 under HashRouter (Lesson.jsx:104-106).
- `deps` gating advertised, not implemented (Hub.jsx:16-23). Sprint LeetCode link has no slug (Sprint.jsx:231) + biased shuffle (:61).
- Review shows answer instead of prompting recall (Review.jsx:112-136).
- `DSA/content` + `DSA/renderer` untracked in git; `dsa-lms` has 52 uncommitted changes.

## Source stacks (Striver/Babbar equivalents)
**DBMS** — rule: *Gate Smashers fixes the order; interview banks + GATE Overflow add reps; CMU/Korth add depth.*
| Role | Source |
|---|---|
| Spine (A2Z analogue) | Gate Smashers DBMS roadmap (gatesmashers.com/roadmaps/dbms-sql, 140 numbered lectures) |
| Order tie-breaker, interview-only modules | takeUforward DBMS prep hub (23 modules) + free SDE Core Sheet |
| Interview recall bank (primary reps for placements) | InterviewBit 75+, GfG DBMS interview sets, TUF core sheet → flashcards / explain-back |
| Numerical reps (Babbar-450 analogue) | GATE Overflow PYQs by stable numeric id (gateoverflow.in/<id>) — used for procedures (closure, keys, NF, serializability, B+ tree), not exam prep |
| Numbered depth exercises | Korth 7e practice exercises (db-book.com, free solutions) |
| Explanation refs | Gate Smashers (Hindi), Love Babbar CodeHelp 22-lecture series (placement viva + scaling/NoSQL tail), Jenny's Lectures (FD/normalization), Neso/NPTEL (English) |
| Internals (L4) | CMU 15-445 Fall 2025 (Pavlo) lectures/slides/HW, DDIA 2e, Petrov *Database Internals*, Use The Index Luke |
| Visual refs (link out) | USFCA B+ tree, RelaX, mwhittaker ARIES sim, explain.dalibo.com |

**SQL** — keep rule *"LeetCode SQL 50 fixes the order"*; widen overlays: + SQLZoo (free, auto-checked, L1–L2), all 7 PGExercises categories (only 12 used now), DataLemur ordered tutorial (lesson ids 101–312) as explanation spine, StrataScratch free path, Ankit Bansal "Complex SQL" 96-video playlist as L3/L4 reference, CMU HW1 (DuckDB) as L4 capstone, Korth ch 3–5 exercises as DBMS↔SQL bridge.

## DBMS module order (14 modules × 4 tiers = 56 lessons)
00 Foundations (file system vs DBMS, 3-schema, data independence, architectures) · 01 ER/EER + ER→tables · 02 Relational model, keys, integrity constraints · 03 Relational algebra (light calculus; interview depth) · 04 Functional dependencies (closure, candidate keys, minimal cover) · 05 Normalization & decomposition (1NF–BCNF, 4NF, lossless, dep-preservation) · 06 SQL theory (3VL/NULL, bag semantics, correlated subq, views/triggers) → links to `sql` subject · 07 File organization & indexing (clustered/secondary, dense/sparse) · 08 B/B+ trees & hashing · 09 Query processing & optimization → links to `sql/performance` · 10 Transactions & schedules (ACID, serializability, recoverability) · 11 Concurrency control (locks, 2PL, deadlock, timestamps, MVCC, **isolation levels & anomalies**) · 12 Recovery (WAL, checkpoints, ARIES at L4) · 13 Beyond one node (NoSQL, CAP/PACELC, replication, sharding, partitioning, 2PC).

Layer contract (theory variant, set in subject config): L1 **Concepts** (definitions, one canonical diagram per concept, misconceptions first) · L2 **Procedures** (hand-run algorithms: worked → faded → practice) · L3 **Reasoning/Interview** (why it's correct, edge cases, interleaved mixed questions, follow-up chains, compare blocks) · L4 **Systems** (how Postgres/InnoDB actually do it: MVCC, ARIES, buffer pool, latch crabbing).

## New block types (theory + diagrams)
Architecture: each block = framework-free "island" ES module (`toSVG(spec)` pure + optional `mount(el, spec, hooks)`), mounted by one `<Island>` React component via dynamic `import()` → lazy chunks. Algorithms shared between build-time lint (Node) and browser.
Priority order:
1. `question` — mcq (shuffled) / msq / nat (range) / match / order; `source` for PYQ provenance. Unlocks all numerical reps.
2. `flashcards` — flip/type modes, `fromGlossary:true` auto-harvest; feeds SRS as `fc:<lessonId>:<id>` cards.
3. `sql-exercise` — PGlite (Postgres WASM, Apache-2.0, <3 MB gz, lazy on first Run). Build step runs `solution` in PGlite (Node) → embeds expected `{columns,rows}`; client runs learner SQL in `BEGIN…ROLLBACK` vs visible + hidden edge dataset; multiset compare, NULL-aware; mismatch shown via table-diff; optional live EXPLAIN → existing query-plan renderer.
4. `schedule` — parser `R1(A) W2(A) C1…` → timeline SVG, precedence graph, verdicts (conflict/view serializable, recoverable, cascadeless, strict), `protocol` option (2PL variants, TO, Thomas, wait-die/wound-wait), predict mode.
5. `fd-stepper` + `nf-decomposition` (shared engine) — closure steps, keys, minimal cover; NF check table + decomposition tree + lossless/dep-preserving verdicts.
6. `misconception` (refutation text, true/false poll first) + `predict` (commit before reveal) + `explain-back` (textarea, mustMention keywords, model answer, self-rubric; no LLM).
7. `query-trace` — SQL clause-by-clause intermediate tables (SQL's missing dry-run trace).
8. `er-diagram` — Chen SVG (weak entity, multivalued, derived, total participation) from author-placed grid; crow's foot via lazy mermaid; `mapping:true` → auto ER→tables.
Deferred (link out meanwhile): `bptree-stepper`, `recovery-log`, `ra-tree`, `derivation` (faded proof), `concept-map` (fill-labels / venn).
Existing `table-diff`, `schema-diagram`, `query-plan`, `dialect-diff` → ported as React blocks with escaping fixed.

## Implementation phases
**Phase 0 — safety.** Commit dsa-lms WIP on its own branch; git-track authoring content (move `DSA/content`, `DSA/renderer/answers` into repo under `subjects/dsa/`). Nothing deleted.

**Phase 1 — fix DSA SPA bugs** (list above). Files: `src/lib/progress.js`, `src/components/blocks.jsx`, `src/styles/theme.css`, `src/pages/{Lesson,Hub,Sprint,Review}.jsx`, `renderer/lint.js`.

**Phase 2 — generalize to multi-subject.**
- `subjects/<id>/subject.json` (name, levels + names/promises, languages/dialects, quotas, storage key, block whitelist, total counts) + `subjects/<id>/content/<module>/L*.json`.
- Routes `/:subject/...`; legacy `#/lesson/:m/:l` → `#/dsa/lesson/:m/:l` redirect. Subject picker hub.
- Per-subject storage key; DSA keeps `dsa_progress_v1` (no progress loss). Reuse `progress.js` store/migration/quarantine, `qkey.js`, `srs.js` as-is, parameterized by key.
- Replace hard-coded 76/19/4-levels/"DSA"/C++-Py highlighter with subject config (`content.js:37`, `analytics.js:8`, `Hub.jsx:41,55`, `Stats.jsx:24,34,38`, `Lesson.jsx:163`, `blocks.jsx:26-98`).
- Block dispatcher → registry + `<Island>`; unknown type renders warning, not `null`.
- Generic `lint.js` + `sync-content.mjs` + `scripts/validate-content.mjs` read subject quota config.

**Phase 3 — blocks 1–8** above, each with an `assert` self-check for its engine (closure, precedence graph, grading compare).

**Phase 4 — port SQL subject.** Convert 36 lessons (schema is near-identical); move `problems.json` + provenance/sync scripts; fix all listed factual errors; canonical dataset (`hr`, `shop`, `events`) as JSON → PGlite; add `sql-exercise` solutions for drills (graded), `query-trace` ≥1 at L1–L2; realign lesson bodies to their problem sets (join algorithms → L3); add gaps-and-islands, dedupe near-identical LATERAL sections; move niche PostGIS/H3 to L4-only; widen overlays per source stack. Keep invariants: provenance rules, ID scheme (`data-pid` stability). Old `sql-lms` site → redirect page.

**Phase 5 — author DBMS subject** module by module (00→13), each via workflow: draft from spine order → adversarial fact-check pass → lint. Quotas per theory contract (min diagrams, flashcards, misconceptions, predict, explain-back, procedure drills; PYQ `source` required when sourced).

**Phase 6 — CI + deploy.** One Pages deploy for all subjects; weekly link check (keep `check-links.mjs`).

## Verification
- `npm run lint` + per-subject content lint green; `npm run build` passes.
- Engine self-checks: closure/keys vs known Gate Smashers examples; precedence-graph verdicts vs textbook schedules; `sql-exercise` compare on NULL/duplicate/order cases.
- Browser (preview pane): DSA legacy URL redirects, DSA progress intact after upgrade (load an exported progress JSON), `/review` shows cards after marking complete, options shuffled, Python toggle works, TOC anchors scroll; SQL exercise runs + grades; schedule/ER/FD blocks render in light+dark and at phone width.
