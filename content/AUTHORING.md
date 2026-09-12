# AUTHORING GUIDE — SQL Layered System

## Layer Contracts

| L | Name | Rules |
|---|------|-------|
| 1 | BEGINNER | No jargon without definition. Everyday analogies. |
| 2 | INTERVIEW READY | Formal patterns. Standard vocabulary. |
| 3 | ADVANCED | Optimization trade-offs. Internals. Dialect differences. |
| 4 | EXPERT | Constraint-driven techniques. Heavy machinery. |

## Quotas (enforced by lint)

- placementQuiz: ≥5 MCQs
- traces: ≥1 per file (ADVANCED/EXPERT need query plans)
- MCQs total: ≥6
- problems: L1≥6 · L2≥8 · L3≥6 · L4≥5
- revisionCard: ≥4 bullets · glossary: ≥5 terms
- tier rule: problem.tier === lesson.level

## Custom Blocks

Use these in lesson JSON:

```json
{ "type": "query-plan", "title": "Seq vs Index Scan", "plan": { ...EXPLAIN JSON... } }
{ "type": "schema-diagram", "spec": { "tables": ["t1", "t2"], "relationships": [] } }
{ "type": "table-diff", "before": [...], "after": [...], "highlight": ["col"] }
{ "type": "dialect-diff", "sql": "...", "pg": "...", "mysql": "..." }
{ "type": "seed-data", "level": "L2", "tables": ["t1", "t2"] }
```

## Problem ID Scheme

- basics: B (e.g., B101, B201...)
- filtering: F
- joins: J
- aggregation: A
- window-functions: W
- subqueries-ctes: S
- performance: P
- advanced-analytics: X
- timeseries-geo: T
- stored-procs: R
- triggers: G

## Workflow

```bash
npm run new:module -- <module-id>
# edit content/<module>/L1-L4.json
npm run lint -- --only=<module-id>
npm run build
```
