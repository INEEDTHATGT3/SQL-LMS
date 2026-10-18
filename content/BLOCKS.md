# BLOCKS — every lesson block type and its JSON shape

Single reference for content authors (SQL LMS now, DBMS LMS later). Live examples: `content/lab/*.json`, rendered at `/#/lab`. Required fields are enforced by `src/lib/block-types.js` + `scripts/lint-content.mjs`. `?` = optional.

## Core (text, code, practice)
| type | shape |
| :-- | :-- |
| prose / mantra | `{ md }` — md-lite: `` `code` ``, `**bold**`, `*italic*`, `[text](https://…)`, newlines |
| heading | `{ text }` |
| list | `{ items: [md] }` |
| callout | `{ tone?: info\|blue\|pink\|red\|warn\|green, md }` |
| code | `{ label?, code, pg?, mysql?, "py-pandas"?, "py-sqlalchemy"?, reveal? }` — one tab per field present; `pg`/`mysql` only for real dialect differences |
| trace | `{ title, columns: [..], steps: [[..]] }` — row length = column count |
| compare | `{ leftTitle, rightTitle, rows: [{ label, left, right }] }` |
| quiz | `{ items: [{ q, options: [..], answer: index, explain }] }` — options are shuffled at render; correct option must not be the uniquely longest |
| problems | `{ items: [problem] }` · problem = `{ id, tier, title, platform, statement?, hints?: [..], patterns?: [..], ref?, url?, sheet?, difficulty?, company?, solutionCode?: <code block>, followups?: [{ q, a }], exercise?: <sql-exercise fields> }` — drills: `platform: "drill"`, no url |
| followup | `{ chain: [{ q, a }] }` |
| visual | `{ kind: boxes-array\|mem-map\|flow\|table-diff\|schema-diagram\|er-diagram, spec }` — the last three are the block types below |

## SQL runtime (PGlite = PostgreSQL in the browser)
- **sql-exercise** `{ id, prompt, datasets: [visible, ...hidden], solution, title?, tier?, setup?, starter?, orderMatters?, floatTol?, checkColumnNames?, hints?: [..], showPlan? }` — graded by running learner SQL and `solution` on every dataset (multiset compare, NULL-aware). Inside a problem item use `exercise: { datasets, solution, ... }` (id comes from the problem). Datasets: `hr`, `shop`, `events` (+ `_edge` twins with the same schema) in `content/datasets/`.
- **query-trace** `{ dataset, stages: [{ label, sql, note? }], title? }` — clause-by-clause dry run (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY); each stage is a full query showing the intermediate table.
- **table-diff** `{ before: [rows], after?: [rows], key?, highlight?: [cols], title? }` — no `after` = single reference table.
- **query-plan** `{ plan: { Plan: {…EXPLAIN FORMAT JSON…} }, title?, dialect?, compareWith? }`.
- **dialect-diff** `{ sql?, pg?, mysql?, "py-pandas"?, "py-sqlalchemy"?, title?, note? }`.
- **schema-diagram** `{ tables: [name \| { name, columns: [{ name, type?, pk?, fk?: "table.col", nullable? }] }], relationships?: [{ from, to, label?, cardinality? }] }`.

## Theory + recall
- **question** `{ kind: mcq\|msq\|nat\|order\|match, q, answer, explain, options?, left?, right?, marks?, negative?, tolerance?, unit?, source?: { exam?, year?, set?, q?, url?, platform?, ref? }, tags? }` — answer: mcq index · msq index[] · nat number or `{ min, max }` (use the range, `tolerance` is display-only) · order: original indices in correct order · match: `answer[i]` = index into `right`.
- **flashcards** `{ cards?: [{ id, front, back, tags? }], fromGlossary?, mode?: flip\|type, deck? }` — rated cards enter spaced review.
- **misconception** `{ claim, refutation, askFirst?: true, verdict?: false, cue?, correctModel?, evidence?: <block>, source? }` — refutation-text order: poll → "This is false" → why → correct model → evidence.
- **predict** `{ prompt, answer: { kind: nat\|mcq\|text, value, options?, tolerance?, unit? }, reveal: [blocks], given?: { text?, sql?, tables?: { name: [rowObjects] } }, commitRequired?: true }`.
- **explain-back** `{ prompt, modelAnswer, minWords?: 40, mustMention?: [terms], rubric?: [{ point, weight? }] }` — self-graded, no LLM.

## Diagrams + procedures (DBMS-heavy)
- **fd-stepper** `{ attrs: "ABCDE" \| [names], fds: [["AB","C"], …] \| [[[lhs..],[rhs..]], …], tasks: ["closure:AB", "keys", "primeAttrs", "minimalCover", "superkeyCount", "equivalent"], mode?: worked\|practice, fadeFrom?, other?: fds, title? }`.
- **nf-decomposition** `{ relation: { name, attrs, fds }, target: BCNF\|3NF, show?: [nfTable, tree, lossless, depPreserving], ask?: { kind: mcq, q }, title? }`.
- **schedule** `{ ops: "R1(A) W2(A) C2 C1", protocol?: none\|2PL\|strict2PL\|rigorous\|conservative2PL\|TO\|thomas\|waitDie\|woundWait, ts?: { T1: 5 }, show?: [timeline, precedence, verdicts, lockCurve, waitsFor], verdicts?: [conflictSerializable, viewSerializable, recoverable, cascadeless, strict], mode?: show\|predict, ask?: { kind: msq\|mcq, q, options?, answer? }, title? }` — ops: R/W/S/X/U need `(item)`, C/A don't.
- **er-diagram** `{ notation: chen\|crowsfoot\|both, entities: [{ id, label?, weak?, attrs: [{ name, key?, partialKey?, multi?, derived?, composite?: [..] }] }], relationships: [{ id, label?, identifying?, attrs?: [..], ends: [{ entity, card: "1"\|"N"\|"M", total?, role? }] }], isa?: [{ parent, children: [..], disjoint?, total? }], layout?: { id: [col, row] }, mapping?, ask?, title? }`.

## Which block for which job
- Definition to memorise → flashcards (or glossary + `fromGlossary`).
- Classic wrong belief → misconception; outcome learners guess wrong → predict.
- Procedure (closure, keys, NF, serializability, B+ splits) → the stepper block, worked at L2, faded/practice at L3.
- "Explain X to an interviewer" → explain-back. Numeric answer → question `nat`; "select all true" → question `msq`.
- Anything that can be run as SQL → sql-exercise, never a text-only drill.
