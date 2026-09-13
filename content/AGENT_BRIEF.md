# AGENT BRIEF — implementation status for sql-lms

Read [SOURCING.md](./SOURCING.md) and [AUTHORING.md](./AUTHORING.md) first. This file records
the implementation status and acceptance evidence for the curriculum plan.

## State of play

Done and verified — do not redo:

- `problems.json` holds **170 sourced problems** (LeetCode SQL 50 × 50, HackerRank SQL × 58,
  LeetCode Advanced SQL 50 × 50, PGExercises × 12),
  every one carrying `platform` + `ref` + `url`.
- `renderer/sync-problems.mjs` injects them into lesson files. Additive and idempotent — it
  rebuilds a single `"Sourced Problem Set"` section per lesson and never touches drills.
- `renderer/check-provenance.mjs` gates the sourced-vs-drill rule and runs before every build.
- `render.js` was patched to link sourced titles and to accept non-C++ solution keys
  (see `vendor/PATCHES.md` — **re-apply after any core upgrade**).
- Current state: 170 sourced · 228 synthesised · 0 provenance errors · 0 lint errors ·
   36 lesson artifacts plus the hub built.
- `harness/` runs six PostgreSQL plan-shape assertions for the L2 performance drills.
- 20 sourced entries carry documented company tags in `content/company-tags.json`.
- CI verifies, runs the harness, performs weekly strict link checks, and deploys Pages from
   `main`.

## Invariants — breaking any of these is a failed run

1. **Never delete or rewrite a synthesised drill to make room for a sourced problem.** Only
   6 of 36 module×tier cells have enough sourced coverage to meet quota alone. Removal will
   red-lint 30 cells.
2. **Never invent a problem.** No verifiable `platform` + `ref` + `url` → it is not sourced.
   Write it as a drill with a real statement and hints instead.
3. **Never hand-edit the `"Sourced Problem Set"` section.** It is regenerated from the bank on
   every build. Edit `content/problems.json` and re-run `npm run sync:problems`.
4. **Never re-tier a problem to fit a quota.** Tier is a curriculum decision. Moving problems
   to fill cells destroys the property that made the spine worth adopting.
5. **Never change the ID scheme.** Sourced `<LETTER><TIER>-<PLATFORM><REF>`, drills
   `<LETTER><TIER><SEQ>`. IDs are `data-pid` keys — changing one silently resets a learner's
   SOLVED state for that problem.

## Zero sourced coverage — 13 cells

These render with drills only. They are not all bugs; three of the four causes are structural.

| Module | Cells | Cause | Action |
|---|---|---|---|
| `performance` | L1 L2 L3 L4 | No free judge grades an execution plan | Covered by the local harness; drills remain synthesised |
| `timeseries-geo` | L1 L3 L4 | No interview sheet covers PostGIS/H3 | Leave as-is; deliberately off-spine |
| all modules | L4 (×5) | Public sheets do not reach L4 | Leave as-is; L4 is predominantly synthesised |
| `window-functions` | L1 | SQL 50 introduces windows at Medium | Deliberately synthesised beginner drills |
| `advanced-analytics` | L3 | Off-spine module | Deliberately synthesised drills |

## Work items

### W1 — Enumerate LeetCode Advanced SQL 50 *(completed)*

Paywalled, so this is an account task. Open <https://leetcode.com/studyplan/premium-sql-50/>,
list all 50 problems with their sections and difficulties, then append to `problems.json`
under `"sheet": "leetcode-advanced-sql-50"` with ids `<LETTER><TIER>-LC<num>`, and flip
`sources["leetcode-advanced-sql-50"].enumerated` to `true`.

*Acceptance evidence:* 50/50 entries are present, `window-functions` L3 has 15 sourced
entries, and four modules have L3 Advanced SQL 50 coverage.

### W2 — Fill L1 window-functions and L3 filtering from PGExercises *(superseded)*

Free and enumerable. Use the category pages in `sources.pgexercises.categories`. Add with
`"platform": "pgexercises"`, `ref` = the exercise slug, `url` = its page.

*Status:* The final sourcing decision keeps these cells synthesised because PGExercises does
not cover the required window/interview concepts at those curriculum tiers.

### W3 — A gradeable harness for `performance` *(completed)*

The real gap. Every free judge grades a result set, so nothing tests "did you read the EXPLAIN
correctly". Build `harness/` — a seeded Postgres (docker-compose), a fixture schema large
enough that plans actually differ, and a runner that asserts on **plan shape** (`Index Scan`
vs `Seq Scan`, join algorithm, rows estimate within a factor) rather than on output rows.
Then the `performance` drills become executable.

*Acceptance evidence:* `npm run harness` seeds PostgreSQL and runs six plan-node assertions;
the runner checks scan/join shape and estimate error. Reference text:
<https://use-the-index-luke.com/>.

### W4 — Company tags from DataLemur *(completed)*

Add a `company` field to sourced entries where known and surface it in `prob-meta`. Needs a
one-line `render.js` change plus `vendor/PATCHES.md` updated to record it.

*Acceptance evidence:* 20 entries carry `company`, the generated meta line renders it, and
`vendor/PATCHES.md` records the local rendering patch.

### W5 — Link-rot check *(completed)*

`renderer/check-links.mjs` — HEAD every `url` in `problems.json`, report non-200s, exit 1 on
failure. Run it in CI weekly, not on every build.

*Acceptance evidence:* the checker probes all discovered bank, registry, and markdown URLs;
weekly CI uses `--strict` while known judge bot protection is classified explicitly.

### W6 — CI *(completed)*

`.github/workflows/ci.yml` runs verification, the harness, page checks, and build on push/PR;
the scheduled job runs strict link checks and main deploys `site/` to Pages.

*Acceptance evidence:* workflow includes the required Pages permissions, artifact upload, and
`actions/deploy-pages` job.

## Commands

```bash
npm run sync:problems        # bank -> lessons (additive, idempotent)
npm run check:provenance     # sourced-vs-drill gate, exits 1 on error
npm run verify               # provenance + lint
npm run build                # sync -> verify -> render (36 artifacts)
npm run dev                  # build + serve on :3000
```

`npm run sync:problems -- --dry` previews without writing.
Both scripts accept `--only=<moduleId>`.

## Known issues left alone

- `renderProblem` still supports the legacy `p.lc` field from dsa-lms. Harmless, unused here.
- Two duplicate drill IDs were found and renumbered (`A304`→`A305`, `P202`→`P203`). Duplicate
  IDs collide on `data-pid` and corrupt SOLVED state — `check:provenance` now catches them.
