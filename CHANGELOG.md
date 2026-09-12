# Changelog

All notable changes to SQL-LMS. Releases map to the phase plan; see
`content/SOURCING.md` and `content/problems.json.gaps` for sourcing context.

## 2.2.0 — 2026-09-12 — sourced spine extended

### Added
- **LeetCode Advanced SQL 50** fully enumerated (50/50) into `content/problems.json`
  with `sources["leetcode-advanced-sql-50"].enumerated = true`. Zero `(platform, ref)`
  collisions with the free SQL 50 rows already in the bank.
- **PGExercises** first 12 problems (Basic SELECT ×6, Working with Timestamps ×6)
  against the standard `cd` schema; `pgexercises` sheets now enumerated at 12.
- Bank grows 108 → **170 sourced problems**.
- `renderer/maintain-sourcing.mjs` — idempotent recompute of `modules.json.sourced`
  and `problems.json.coverage` from the bank.
- `renderer/check-links.mjs` (`npm run check:links`) — external link probe with
  bot-protection classification for judge domains.
- `.github/workflows/ci.yml` — provenance + lint + pages + build on push/PR, plus a
  nightly link-rot report.
- DataLemur overlay hints now carry tier ranges in `problems.json.coverage`.

### Changed
- `problems.json.gaps` rewritten: window-functions gap closed (6 → 23); timeseries-geo
  now medium (6 L2 date problems); L4 gap restated at 6 sourced; version 2.2.0.
- README + SOURCING.md refresh: enumerated counts, closed gaps, re-scoped module focus.

## 2.1.0 — 2026-09-12 — dedupe/identity sweep (Phase 3)

### Added
- `renderer/check-page-scripts.mjs` (`npm run check:pages`) — guards the
  `initLangToggle` / `initRecall` inline bootstrap on every built page.

### Fixed
- Full dedupe gate: 0 identical cross-lesson question strings, 0 verbatim cross-module
  code blocks, 0 same-lesson mirrors, all placement escalation at 0% overlap.
- advanced-analytics re-scoped to BI/OLAP identity (L1–L4): metrics & grain, rollups,
  share-of-total, cohorts & funnels, time intelligence, pivot, custom window aggregates,
  triggers — drills re-authored in place.
- basics re-scoped (L3 types/NULL 3VL/DML/transactions/eval order; L4 constraints/
  normalization/views/RLS).
- performance re-anchored (L2 planner-cost & enterprise indexes; L4 storage engine —
  vacuum/bloat, buffer cache, index-only scans, fillfactor; stored-procs kept verbatim).
- Theme fixes carried from 2.0.0: precomputed L4 accent, `initLangToggle` binding,
  language storage key.

## 2.0.0 — 2026-09-12 — restructure to LMS spine

### Changed
- Rebuilt the site skeleton under the layered-study spine: 9 modules × 4 tiers,
  problem bank (108 sourced), provenance, sourcing + authoring governance.
- window-functions L3/L4 factual pass: CTE materialization/pushdown consistency, real
  monitor views, GUC naming.

## 1.x / 0.x — pre-spine

Single-file versions of the site. Superseded by 2.0.0; no longer maintained.