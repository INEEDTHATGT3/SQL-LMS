# SOURCING — where SQL-LMS problems come from

DSA-LMS is ordered by Striver A2Z with FINAL450 (Babbar) as the volume bank. SQL has no
single equivalent: no one sheet is simultaneously ordered, finite, free, judge-backed and
deep. This file records the substitute — a **spine plus overlays** — and the precedence
rules that keep it from drifting.

## The one-line rule

> **LeetCode SQL 50 fixes the order. Everything else adds reps or realism at an order the spine already set.**

## Source registry

| Source | Role | Count | Access | Enumerated | Analogue in DSA-LMS |
|---|---|---|---|---|---|
| [LeetCode SQL 50](https://leetcode.com/studyplan/top-sql-50/) | **Spine** — order + L1/L2 boundary | 50 | Free | Yes | Striver A2Z |
| [HackerRank SQL](https://www.hackerrank.com/domains/sql) | Volume overlay (L1) | 58 | Free | Yes | Babbar FINAL450 |
| [LeetCode Advanced SQL 50](https://leetcode.com/studyplan/premium-sql-50/) | Spine extension (L3/L4) | 50 | Premium | **No — blocked** | Striver SDE Sheet |
| [DataLemur](https://datalemur.com/questions) | Company realism (L3/L4) | ~80+ free | Freemium | No | company-tagged LC problems |
| [StrataScratch](https://platform.stratascratch.com/coding) | Company realism (L3/L4) | large | Freemium | No | — |
| [PGExercises](https://pgexercises.com/) | Postgres-native + recursive (L2/L3) | 7 categories | Free | No | — |
| [Ankit Bansal](https://www.youtube.com/@ankitbansal6) | **Reference only** | — | Free | n/a | Striver's videos |
| [techTFQ](https://www.youtube.com/@techTFQ) | **Reference only** | — | Free | n/a | Babbar's videos |

The two YouTube channels are the closest match in *teaching style* to Striver and Babbar,
and that is exactly why they are marked reference-only: they have no stable problem IDs,
no judge, and no enumerable list, so they cannot carry ordering authority. They are cited
per-module for intuition, never as the source of a problem.

## Spine → module map

LeetCode SQL 50 has 7 sections. They land on modules 01–06 like this:

| SQL 50 section | n | Lands in | Tier |
|---|---|---|---|
| Select | 5 | `basics`, `filtering` | L1 |
| Basic Joins | 9 | `joins` | L1–L2 |
| Basic Aggregate Functions | 8 | `aggregation`, `filtering` | L1–L3 |
| Sorting and Grouping | 7 | `aggregation` | L1–L2 |
| Advanced Select and Joins | 7 | `joins`, `window-functions`, `filtering` | L1–L3 |
| Subqueries | 7 | `subqueries-ctes`, `window-functions`, `aggregation` | L1–L3 |
| Advanced String Functions / Regex / Clause | 7 | `basics`, `filtering`, `aggregation`, `subqueries-ctes` | L1–L3 |

Section membership is not preserved verbatim. A problem is filed by **what it actually
tests**, not by where LeetCode shelved it — e.g. *1321 Restaurant Growth* sits in LeetCode's
Subqueries section but is a 7-day moving average, so it lands in `window-functions` L3;
*1204 Last Person to Fit in the Bus* is filed as a running-sum frame problem, not an
"advanced join".

## Overlay routing

| Module | HackerRank subdomain | PGExercises | DataLemur filter | Reference |
|---|---|---|---|---|
| 01 basics | Basic Select | basic | Easy | techTFQ |
| 02 filtering | Basic Select, Advanced Select | basic, string | Easy | techTFQ |
| 03 joins | Basic Join, Advanced Join | joins | tag=joins | Ankit Bansal |
| 04 aggregation | Aggregation, Advanced Join | aggregates | tag=aggregate | Ankit Bansal |
| 05 window-functions | Advanced Join | aggregates | tag=window functions | Ankit Bansal |
| 06 subqueries-ctes | Advanced Select | recursive | tag=CTE | techTFQ |
| 07 performance | — | — | — | Use The Index, Luke |
| 08 advanced-analytics | Advanced Select, Alternative Queries | recursive, date | Hard | Ankit Bansal |
| 09 timeseries-geo | — | date | Hard | — |

## What the sourcing does NOT cover

Four honest gaps, recorded in `problems.json.gaps`:

1. **`performance` has zero sourced problems.** Every free judge grades a result set, not a
   plan. Nothing on LeetCode or HackerRank can test "did you read the EXPLAIN correctly".
   This module stays synthesised, graded against a seeded local Postgres by plan shape.
   Reference text: [Use The Index, Luke](https://use-the-index-luke.com/).
2. **`timeseries-geo` has zero sourced problems.** Gap filling, interpolation, PostGIS and
   H3 appear in no interview sheet. Deliberately off-spine.
3. **`window-functions` has only 6.** SQL 50 touches windows in five places. Target is 20+;
   the fill is Advanced SQL 50 plus DataLemur's window-function tag.
4. **L4 has only 3 sourced problems** across the entire bank. L4 is constraint-driven and
   internals-heavy by design — it should stay predominantly synthesised. Do not force it.

## Precedence rules

1. A sourced problem is never invented. Every entry carries `platform` + `ref` + `url`, or it
   does not enter `problems.json`.
2. `tier` is assigned by *this* curriculum. The platform's `difficulty` is recorded as
   provenance only and carries no authority over tiering.
3. The spine fixes order. An overlay may add reps at a tier; it may not introduce a concept
   ahead of the spine.
4. A lesson may cite a sourced problem only if `problems.json` lists it for that module at
   that tier.
5. Synthesised drills remain legal and remain in the lesson files, but must stay labelled
   `"platform": "drill"` so origin is never ambiguous.

## Unblocking Advanced SQL 50

It is paywalled, so enumeration is an account task, not a research task. When available:
open the study plan, list the 50 problems and their sections, append them to
`problems.json` with `"sheet": "leetcode-advanced-sql-50"` and the same ID scheme
(`<LETTER><TIER>-LC<num>`), then set `sources["leetcode-advanced-sql-50"].enumerated = true`.
That single step closes most of gap 3 and roughly half of gap 4.

## ID scheme

- **Sourced** (this file): `<MODULE_LETTER><TIER>-<PLATFORM><REF>` → `J2-LC1731`, `A1-HR042`
- **Synthesised** (in lesson JSON): legacy `<MODULE_LETTER><TIER><SEQ>` → `J201`

The two namespaces cannot collide, and provenance is readable from the ID alone.

Module letters: B basics · F filtering · J joins · A aggregation · W window-functions ·
S subqueries-ctes · P performance · X advanced-analytics · T timeseries-geo

Platform codes: `LC` LeetCode · `HR` HackerRank · `DL` DataLemur · `SS` StrataScratch · `PG` PGExercises
