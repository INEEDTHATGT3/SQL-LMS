# SQL Layered Study System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Build: static](https://img.shields.io/badge/Build-static%20site-0077b6)](#commands)

A self-paced SQL curriculum generated as a static site — 9 modules, each written at four
difficulty tiers, so the same topic can be studied as a zero-assumption primer or as
plan-level optimization material. Sibling project to
[dsa-lms](https://github.com/INEEDTHATGT3/dsa-lms).

## Curriculum

Ordered per the **LeetCode SQL 50** study plan for modules 01–06, with modules 07–09 added
as deliberate off-spine extensions that no interview sheet covers. Every module is available
at four tiers.

| Level | Name | Promise |
|---|---|---|
| 1 | BEGINNER | Core syntax, mental models. Tables as grids. One SELECT solves it. |
| 2 | INTERVIEW READY | Joins, grouping, windows. The vocabulary an SQL screen actually tests. |
| 3 | ADVANCED | CTEs, recursion, optimization, dialect differences. You justify the plan. |
| 4 | EXPERT | Execution plans, partitioning, stored procs, triggers. Constraint-driven. |

| # | Module | Focus | Spine position |
|---|---|---|---|
| 01 | SQL Fundamentals | SELECT, types & casting, NULL/3VL, WHERE, ORDER BY, LIMIT, DML & transactions | LC50 §1 Select |
| 02 | Filtering & Conditionals | IN, BETWEEN, LIKE, REGEXP, CASE, NULL handling, evaluation order | LC50 §1 / §7 |
| 03 | Joins & Set Operations | INNER/LEFT/RIGHT/FULL, self-join, semi/anti, UNION, EXCEPT | LC50 §2 Basic Joins |
| 04 | Aggregation & Grouping | GROUP BY, HAVING, conditional agg, rollup, cube, grouping sets | LC50 §3 / §4 |
| 05 | Window Functions | ROW_NUMBER, RANK/DENSE_RANK, LAG/LEAD, frames, running totals | LC50 §5 |
| 06 | Subqueries & CTEs | Correlated, recursive CTEs, materialization | LC50 §6 Subqueries |
| 07 | Performance & Indexing | EXPLAIN, planner cost, indexes, statistics, storage internals, PL/pgSQL | off-spine |
| 08 | Advanced Analytics | Metrics & grain, rollups, time intelligence, cohort & funnel, pivot, triggers | off-spine |
| 09 | Time-Series & Geospatial | Gap filling, interpolation, PostGIS basics, H3 | off-spine |

## Problem sourcing

SQL has no single Striver-equivalent, so the curriculum uses a **spine plus overlays**.
Full rationale, precedence rules and the gap list live in
[`content/SOURCING.md`](content/SOURCING.md); the mapped bank is
[`content/problems.json`](content/problems.json) — **170 sourced problems** across 9 modules.

| Source | Role | Count | Access |
|---|---|---|---|
| [LeetCode SQL 50](https://leetcode.com/studyplan/top-sql-50/) | **Spine** — fixes order and the L1/L2 boundary | 50 | Free |
| [HackerRank SQL](https://www.hackerrank.com/domains/sql) | Volume overlay (L1) | 58 | Free |
| [LeetCode Advanced SQL 50](https://leetcode.com/studyplan/premium-sql-50/) | L3/L4 spine extension — enumerated 50/50 | 50 | Premium |
| [DataLemur](https://datalemur.com/questions) · [StrataScratch](https://platform.stratascratch.com/coding) | Company realism (L3/L4) | — | Freemium |
| [PGExercises](https://pgexercises.com/) | Postgres-native (L2/L3) — 12 enumerated | 12 | Free |
| [Ankit Bansal](https://www.youtube.com/@ankitbansal6) · [techTFQ](https://www.youtube.com/@techTFQ) | Explanation reference only | — | Free |

Every problem is either **sourced** (carries `platform` + `ref` + `url`) or **synthesised**
(`"platform": "drill"`). There is no third kind, and sourced problems are never invented.

Known gaps, recorded rather than papered over: `performance` and `timeseries-geo` have zero
sourced problems — no free judge grades an execution plan, and no sheet covers PostGIS.
Those modules stay synthesised by design.

## Structure

- `content/` — source content (JSON per module/level), plus `SOURCING.md` and `problems.json`
- `renderer/blocks/` — custom block renderers
- `renderer/validators/` — custom lint validators
- `vendor/core/` — vendored `@layered-study/core` build pipeline
- `site/` — generated output (deploy to GitHub Pages)

## Commands

```bash
npm install
npm run new:module -- basics   # scaffold module
npm run lint                   # validate quotas
npm run build                  # generate site/
npm run dev                    # preview at localhost:3000
npm run deploy                 # deploy to GitHub Pages
```

## Custom Blocks

- `query-plan` — EXPLAIN visualization
- `schema-diagram` — Mermaid ERD
- `table-diff` — Before/after data tables
- `dialect-diff` — Multi-dialect comparison
- `seed-data` — Seed data reference card

## Authoring

See [`content/AUTHORING.md`](content/AUTHORING.md) for layer contracts, lint quotas, the
provenance schema every problem must carry, and the ID scheme.

## Deployment

1. Push to GitHub
2. Enable GitHub Pages (source: GitHub Actions)
3. Site deploys automatically on push to main

## Upgrading Core

```bash
npm run upgrade
npm run build
```

## License

[MIT](LICENSE) © 2026 Dhruv Jaiswal
