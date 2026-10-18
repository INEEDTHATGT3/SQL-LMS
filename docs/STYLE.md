# STYLE — teach like the channels learners already trust

The DSA LMS works because it copies how Striver and Love Babbar teach: an ordered sheet, intuition before code, brute force → optimal, a dry run of every approach, and the follow-ups an interviewer actually asks. SQL and DBMS lessons copy the same moves from the teachers who own those subjects. Read this before writing or porting any lesson. Block shapes: `content/BLOCKS.md`.

**Language:** English, spoken-teacher voice. (Decision D1 in the vault may switch L1 to light Hinglish; until it does, English only.)
**Copyright:** never copy a teacher's or platform's text, problem statement or diagram. Paraphrase, use your own sample data, link the original. Never transcribe a video.

## 1 · Who we copy, and what exactly

| Teacher | Copy this |
| :-- | :-- |
| **Striver** (takeUforward A2Z, SDE core sheet) | Fixed order; every problem: intuition → **Brute → Better → Optimal**, each with a dry run, code and cost; "what will the interviewer ask next"; pattern name on every problem |
| **Love Babbar** (CodeHelp DBMS, 450 sheet) | Start from zero, "why" before "how"; everyday Indian examples (IRCTC booking, UPI payment, Swiggy order); many tiny examples instead of one big one; volume practice; crisp viva answers |
| **Gate Smashers** (Varun Singla) | One concept per segment; board-style diagram first, words second; procedures as numbered step tables (closure, keys, NF check, precedence graph); a "trick" line for every procedure; question right after each concept |
| **Ankit Bansal** (Complex SQL, Namaste SQL) | Real interview problem; **create table + insert rows first**; show expected output before solving; solve it 2–3 ways (self-join, subquery, window); walk the output row by row |
| **DataLemur** (Nick Singh) | Company tag + difficulty; hint ladder; explain why the naive query is wrong, not just that it is |
| **techTFQ** | Line-by-line reading of a query against sample data |
| **CMU 15-445 / Use The Index, Luke** (L4 only) | How a real engine does it; diagrams that build up step by step; cost numbers, not adjectives |

## 2 · Lesson skeleton (every tier, every subject)
1. **Hook** — one real interview line ("Asked at Amazon: find users who logged in 3 days in a row") + a `mantra` with the one idea to remember.
2. **Mental model** — Babbar-style analogy (L1) or the precise model (L2+), then one picture: `trace`, `er-diagram`, `schedule`, `table-diff`, `schema-diagram` or `visual`.
3. **Concept segments** — Gate Smashers rhythm, one idea per section: ≤ 5 lines of prose → diagram or step table → one check (`quiz`, `question`, `predict`). Never two new ideas before a check.
4. **Worked problem** — Striver ladder (`approaches`, see §4) on one problem the section just taught, with a `query-trace` dry run of the optimal approach (SQL) or a stepper (DBMS).
5. **Trap** — the classic wrong belief as `misconception`, or a surprising outcome as `predict` (NULL in `NOT IN`, LEFT JOIN + WHERE, "BCNF always preserves FDs", "2PL prevents deadlock").
6. **Interview angle** (L2+) — `followup` chain of 3–5 questions the interviewer asks next, with short model answers; L3/L4 add an `explain-back`.
7. **Problem set** — sourced problems in sheet order, then drills; every runnable drill is a graded `exercise`.
8. **Revision card + glossary** — the 60-second re-read before an interview (separate lesson keys, not blocks).

## 3 · Tier voice
- **L1 (Babbar):** zero assumptions, everyday analogies only, define every term at first use, tiny tables (3–6 rows), one query per idea.
- **L2 (Striver):** standard pattern names, Brute → Optimal ladder on every worked problem, cost stated, LeetCode SQL 50 / interview staples.
- **L3 (Ankit Bansal + Gate Smashers depth):** hard interview problems solved 2–3 ways, edge cases (NULLs, ties, duplicates, empty groups), "why it is correct", mixed-topic questions, follow-up chains.
- **L4 (CMU / Use The Index, Luke):** how PostgreSQL and InnoDB execute it, real `EXPLAIN` output, constraint-driven trade-offs.

## 4 · The approach ladder (Striver format)
Each worked problem and each answer payload carries:
```json
"approaches": [
  { "name": "Brute", "idea": "Correlated subquery per row: easy to read, re-scans orders for every user.",
    "code": { "code": "SELECT …", "mysql": "…only if it differs…", "py-pandas": "…" },
    "cost": "O(n·m) row visits; fine for 1k rows, not 1M", "pitfalls": "Returns NULL rows when …" },
  { "name": "Optimal", "idea": "One pass with ROW_NUMBER() over the partition.", "code": { "code": "…" }, "cost": "one sort on (user_id, ts)" }
]
```
- 2 approaches minimum when a naive one exists, 3 when a "better" middle step teaches something. Name them Brute / Better / Optimal.
- `idea` is the intuition in 1–2 lines, before any code. `cost` is concrete (rows scanned, sorts, index use), never "efficient".
- The optimal approach is the one graded by the `exercise`; the others must also run (check-exercises runs every approach that has `code`).

## 5 · Writing rules
- Second person, short sentences, why before how. Every abstract sentence gets an example within 3 lines.
- Sample data first, query second, output third (Ankit Bansal order). Keep sample tables ≤ 8 rows unless the point is volume.
- Every SQL claim holds on PostgreSQL 16; dialect differences go in `pg` / `mysql` fields or a `dialect-diff`, never "same syntax" filler.
- MCQs: plausible distractors drawn from real mistakes; the correct option is not the longest; every `explain` says why each wrong option is wrong in one clause.
- Hints are a ladder: hint 1 names the pattern, hint 2 names the clause/function, hint 3 is the skeleton. Never the full answer.
- Cite: sourced problems keep `platform/ref/url`; theory questions from a bank carry `source`. Module `refs` hold the explanation videos.

## 6 · Checklist (paste into the job Report, tick honestly)
- [ ] Hook + mantra; one picture per mental model
- [ ] No section introduces two ideas before a check
- [ ] ≥ 1 worked problem per lesson with a Brute → Optimal ladder and a dry run
- [ ] ≥ 1 trap (misconception or predict) per lesson
- [ ] L2+: follow-up chain; L3/L4: explain-back
- [ ] Runnable drills are graded exercises; hints are a ladder
- [ ] No copied text; sample data is our own
