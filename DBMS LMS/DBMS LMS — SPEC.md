---
tags: [lms, dbms, spec]
created: 2026-10-17
related: "[[DBMS LMS — CARD]] · [[SQL LMS — SPEC]]"
---
# DBMS LMS — SPEC

> [!info] Brief
> **OBJECTIVE:** a DBMS theory LMS for SDE placement interviews on the shared layered-study engine.
> **DONE WHEN:** `dbms-lms` builds · modules 00 and 01 authored L1–L4 and lint-clean · modules 02–13 routed.
> **FORMAT:** job cards `DBMS J01–J05` for OpenCode; later modules get cards after the pilot.
> **CAP:** each job ≤ 60 agent-minutes; one module half (two lessons) per content job.

## 1 · Decisions already made
- SQL and DBMS are sibling subjects, not one merged course: every DBMS teacher gives SQL only 15–25% of the subject, yet keeps SQL practice as its own track. DBMS module 06 and 09 link out to the SQL LMS for practice.
- Target: placement interviews + DE/analyst theory. Not GATE. GATE questions are only numeric practice reps for procedures.
- Engine: copy `sql-lms` (`src/`, `scripts/`, configs) after SQL J08. Only `content/` differs. A merged multi-subject app comes later in a new repo.

## 2 · Source stack (who fixes what)
- **Order (Striver-A2Z role):** Gate Smashers DBMS roadmap — https://www.gatesmashers.com/roadmaps/dbms-sql · playlist https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y
- **Tie-breaker for interview-only modules:** takeUforward DBMS prep — https://takeuforward.org/prep-hub/dbms-interview-prep · free SDE core sheet https://takeuforward.org/interviews/must-do-questions-for-dbms-cn-os-interviews-sde-core-sheet
- **Interview recall reps (Babbar-450 role for placements):** InterviewBit https://www.interviewbit.com/dbms-interview-questions/ · GfG https://www.geeksforgeeks.org/dbms/commonly-asked-dbms-interview-questions/ → flashcards and explain-back.
- **Numeric reps:** GATE Overflow by stable id, `https://gateoverflow.in/<id>` (tags: er-diagram, database-normalization, transaction-and-concurrency, b-tree, indexing, relational-algebra, sql). Cite as `source: { platform: "gateoverflow", ref: "<id>", url }`. Never invent an id: no verified id → write it as an unsourced question.
- **Explanation references:** Love Babbar CodeHelp DBMS https://www.youtube.com/playlist?list=PLDzeHZWIZsTpukecmA2p5rhHM14bl2dHU (placement viva, NoSQL/scaling tail) · Jenny's Lectures https://www.youtube.com/playlist?list=PLdo5W4Nhv31b33kF46f9aFjoJPOkdlsRc (FDs) · Neso Academy https://www.youtube.com/playlist?list=PLBlnK6fEyqRi_CUQ-FXxgzKQ1dwr_ZJWZ (diagrams) · NPTEL https://nptel.ac.in/courses/106105175
- **Depth (L4):** Korth 7e https://www.db-book.com/ (free practice-exercise solutions) · CMU 15-445 https://15445.courses.cs.cmu.edu/fall2025/schedule.html · Berkeley CS186 notes https://cs186berkeley.net/notes/ · DDIA https://dataintensive.net/ · Petrov https://www.databass.dev/ · Use The Index, Luke https://use-the-index-luke.com/
- **Link-out visual tools:** RelaX https://dbis-uibk.github.io/relax/ · USFCA B+ tree https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html · ARIES simulator https://mwhittaker.github.io/aries/

## 3 · Modules (id · letter · focus · main blocks)
00. `foundations` F — file system vs DBMS, 3-schema architecture, data independence, 2/3-tier, data models, DDL/DML/DCL/TCL · flashcards, compare, misconception
01. `er-model` E — entities, attributes, cardinality, participation, weak entities, ISA, ER→tables (min tables) · er-diagram, question nat
02. `relational-model` K — super/candidate/primary/foreign keys, integrity constraints, referential actions · flashcards, predict
03. `relational-algebra` R — σ π ρ ⋈ × ∪ − ∩ ÷, RA↔SQL, light TRC · trace, question nat (tuple counts), RelaX link
04. `functional-dependencies` D — Armstrong axioms, closure, candidate keys, minimal cover, equivalence · fd-stepper
05. `normalization` N — anomalies, 1NF–BCNF, 4NF, lossless join, dependency preservation, 3NF synthesis · nf-decomposition, misconception
06. `sql-theory` S — 3-valued logic, bag semantics, correlated subqueries, views, triggers; practice links to SQL LMS · predict, sql-exercise
07. `file-indexing` I — blocking factor, heap/sequential/hash files, primary/clustering/secondary, dense/sparse, multilevel, I/O cost · question nat, trace
08. `btree-hashing` B — B/B+ tree order, insert/delete splits, static/extendible/linear hashing · trace (until a bptree-stepper exists), question
09. `query-processing` Q — selection/join algorithms and cost, external sort, equivalence rules, EXPLAIN; links to SQL `performance` · query-plan, trace
10. `transactions` T — ACID, states, conflict/view serializability, recoverable/cascadeless/strict · schedule
11. `concurrency` C — locks, 2PL variants, deadlock, wait-die/wound-wait, timestamp ordering, Thomas rule, MVCC, isolation levels and anomalies · schedule, misconception
12. `recovery` V — WAL, log-based undo/redo, checkpoints, shadow paging, ARIES at L4 · trace, explain-back
13. `distributed` X — NoSQL types, CAP/PACELC, replication, sharding, partitioning, 2PC · compare, explain-back

## 4 · Layer contract (theory variant)
- **L1 CONCEPTS:** definitions, one canonical diagram per concept, misconceptions first, everyday analogies.
- **L2 PROCEDURES:** hand-run the algorithms (closure, keys, NF test, precedence graph, splits, recovery): worked → faded → practice.
- **L3 REASONING:** why it is correct, edge cases, interleaved mixed questions, interviewer follow-up chains, compare blocks.
- **L4 SYSTEMS:** how PostgreSQL and InnoDB really do it (MVCC, ARIES, buffer pool, latch crabbing), sources CMU/Korth/DDIA.

## 5 · Quotas (in `content/subject.json` → `quotas`)
Per lesson: placement quiz ≥ 5 · questions ≥ 6 · at least 1 step-by-step block (`trace`, `fd-stepper`, `nf-decomposition`, `schedule`) · revision card ≥ 4 · glossary ≥ 5. Via `minBlocks` (added in SQL J08): diagrams (`er-diagram`, `schedule`, `nf-decomposition`, `visual`, `compare`) L1 ≥ 2, L2 ≥ 2, L3 ≥ 1, L4 ≥ 1 · `flashcards` L1 ≥ 1 · `misconception` or `predict` ≥ 1 every level · `explain-back` L3 ≥ 1, L4 ≥ 1 · `question` with `nat` or `msq` L2 ≥ 2, L3 ≥ 2. `minProblems` = 0 (theory questions replace LeetCode-style problems).

## 6 · Authoring rules
- Write for a placement interview: every L3 lesson ends with an interviewer follow-up chain.
- Every factual claim must hold for PostgreSQL 16 / MySQL 8 / textbook definitions (Korth); cite the textbook section for definitions that vary (e.g. B+ tree "order").
- Questions taken from a bank carry `source`; questions you write carry none. Never copy question text verbatim from a paid source.
- Block shapes: `sql-lms/content/BLOCKS.md` (copied into dbms-lms by J01).
