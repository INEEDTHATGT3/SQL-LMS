# Contributing to SQL Layered Study System

Thanks for taking the time to contribute. This is primarily a personal study project, but bug reports, corrections, and small improvements are welcome.

## Ground rules

- Be respectful; see the [Code of Conduct](CODE_OF_CONDUCT.md).
- Open an issue before starting large or structural changes, so we can agree on the approach first.
- Keep pull requests focused: one fix or feature per PR.

## Getting set up

```bash
git clone https://github.com/INEEDTHATGT3/SQL-LMS.git
cd SQL-LMS
npm install
npm run dev
```

Requires Node.js 20+.

## Making a change

1. Fork the repo and create a branch off `main`:
   ```bash
   git checkout -b fix/short-description
   ```
2. Make your change. Keep commits small and focused.
3. Before opening a PR, run the same checks CI runs:
   ```bash
   npm run lint
   npm run test:engines
   npm run check:exercises
   npm run build
   ```
4. Push your branch and open a pull request against `main`, describing what changed and why. Reference any related issue.

## Content rules

Lessons live in `content/<module>/L1..L4.json` and follow [`docs/STYLE.md`](docs/STYLE.md) (hook, one idea per segment, Brute → Optimal approach ladder with a dry run, a trap, interviewer follow-ups, graded drills). Block shapes are documented in [`content/BLOCKS.md`](content/BLOCKS.md). A few invariants are enforced by the build:

- Never invent a sourced problem. Without a verifiable `platform` + `ref` + `url` it is a drill (`"platform": "drill"`).
- Never change a problem `id`: ids key learners' saved progress.
- Edit `content/problems.json`, not the generated "Sourced Problem Set" section, then run `npm run sync:problems`.
- Every SQL claim must hold on PostgreSQL unless it is labelled with its dialect.
- An exercise's solution and every approach must return the same rows on both its visible and `_edge` datasets (`npm run check:exercises`).

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). For a grading bug, include the exact query you submitted and the dataset named in the FAIL message.

## Code style

- Follow the existing ESLint configuration (`npm run lint`); CI rejects unlinted code.
- Keep `src/lib`, `src/pages` and generic components free of SQL-specific assumptions: subject details belong in `content/subject.json` and `content/modules.json`.
- Match the conventions already used in the file you're editing rather than introducing a new style.
