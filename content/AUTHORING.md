# AUTHORING GUIDE — SQL Layered System

Problem sourcing is governed by [SOURCING.md](./SOURCING.md) and the bank in
[problems.json](./problems.json). Read those before adding a problem to any lesson.

## Layer Contracts

| L | Name | Rules | Source boundary |
|---|------|-------|-----------------|
| 1 | BEGINNER | No jargon without definition. Everyday analogies. | LC SQL 50 Easy · HR Basic Select/Aggregation |
| 2 | INTERVIEW READY | Formal patterns. Standard vocabulary. | LC SQL 50 Medium · HR Basic/Advanced Join |
| 3 | ADVANCED | Optimization trade-offs. Internals. Dialect differences. | LC SQL 50 Hard · Advanced SQL 50 · DataLemur Hard |
| 4 | EXPERT | Constraint-driven techniques. Heavy machinery. | Predominantly synthesised — no free sheet reaches here |

## Quotas (enforced by lint)

- placementQuiz: ≥5 MCQs
- traces: ≥1 per file (ADVANCED/EXPERT need query plans)
- MCQs total: ≥6
- problems: L1≥6 · L2≥8 · L3≥6 · L4≥5
- revisionCard: ≥4 bullets · glossary: ≥5 terms
- tier rule: problem.tier === lesson.level

## Problem provenance — required

Every problem in a lesson is one of exactly two kinds. There is no third kind.

**Sourced** — exists on a real platform, listed in `problems.json`:

```json
{
  "id": "J2-LC1731",
  "tier": 2,
  "title": "The Number of Employees Which Report to Each Employee",
  "platform": "leetcode",
  "ref": "1731",
  "url": "https://leetcode.com/problems/the-number-of-employees-which-report-to-each-employee/",
  "sheet": "leetcode-sql-50",
  "sheetSection": "Advanced Select and Joins",
  "difficulty": "easy",
  "patterns": ["self-join", "hierarchy"]
}
```

**Synthesised** — written for this curriculum, has no external home:

```json
{
  "id": "J201",
  "tier": 2,
  "title": "Latest Order per Employee (LATERAL)",
  "platform": "drill",
  "patterns": ["lateral-join"],
  "statement": "...",
  "hints": ["..."]
}
```

Rules:

1. A sourced problem is never invented. No `platform` + `ref` + `url` → it is not sourced,
   so label it `"platform": "drill"` and write a real statement and hints for it.
2. `tier` is set by this curriculum. `difficulty` is provenance and carries no authority.
3. A lesson may cite a sourced problem only if `problems.json` lists it for that module at
   that tier. Adding a problem to a lesson means adding it to the bank first.
4. Overlays add reps, never order. Do not pull a DataLemur or HackerRank problem into a tier
   before the spine has introduced the concept.

## ID Schemes

**Sourced:** `<MODULE_LETTER><TIER>-<PLATFORM><REF>` → `J2-LC1731`, `A1-HR042`

**Synthesised:** `<MODULE_LETTER><TIER><SEQ>` → `J201`

Module letters: B basics · F filtering · J joins · A aggregation · W window-functions ·
S subqueries-ctes · P performance · X advanced-analytics · T timeseries-geo

Platform codes: LC LeetCode · HR HackerRank · DL DataLemur · SS StrataScratch · PG PGExercises

## Custom Blocks

Use these in lesson JSON:

```json
{ "type": "query-plan", "title": "Seq vs Index Scan", "plan": { ...EXPLAIN JSON... } }
{ "type": "schema-diagram", "spec": { "tables": ["t1", "t2"], "relationships": [] } }
{ "type": "table-diff", "before": [...], "after": [...], "highlight": ["col"] }
{ "type": "dialect-diff", "sql": "...", "pg": "...", "mysql": "..." }
{ "type": "seed-data", "level": "L2", "tables": ["t1", "t2"] }
```

## Workflow

```bash
npm run new:module -- <module-id>
# check content/problems.json for what is already sourced for that module + tier
# edit content/<module>/L1-L4.json
npm run lint -- --only=<module-id>
npm run build
```

When a module's sourced coverage is thin (see `problems.json.coverage`), fill from the
overlay routing table in SOURCING.md before falling back to synthesised drills.
