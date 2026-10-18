# content/answers — answer payloads

One JSON file per module: `content/answers/<module>.json`. Merged into the generated
"Sourced Problem Set" section by `scripts/sync-problems.mjs` (additive, idempotent).

Shape:

```json
{
  "<problemId>": {
    "statement": "optional problem statement",
    "hints": ["hint 1", "hint 2", "hint 3"],
    "approaches": [
      { "name": "Brute", "idea": "intuition in 1-2 lines",
        "code": { "code": "SELECT ...", "mysql": "...only if it differs..." },
        "cost": "concrete cost", "pitfalls": "optional" },
      { "name": "Optimal", "idea": "...", "code": { "code": "..." }, "cost": "..." }
    ],
    "exercise": { "prompt": "...", "datasets": ["hr", "hr_edge"], "solution": "SELECT ...", "orderMatters": false },
    "followups": [{ "q": "...", "a": "..." }],
    "complexity": "Time O(n). Space O(1)."
  }
}
```

Rules:
- Keys must be problem ids that exist in `content/problems.json` for that module (check-provenance errors otherwise).
- Drills (platform "drill") may carry `approaches` directly in the lesson JSON instead.
- `approaches` needs 2 entries minimum when a naive approach exists, 3 when a "Better" middle step teaches something. Names: Brute / Better / Optimal.
- Every approach that has `code` must run on the exercise datasets and agree with the graded result (check-exercises).
- The optimal approach is the one graded by `exercise`.
```