# PARITY — every DSA-LMS function, and where SQL/DBMS stand

Reference app: `C:\MEGA NZ\SKILLS MATERIAL\DSA\dsa-lms` (React SPA) + its authoring workspace `DSA\content`, `DSA\renderer`. The engine here is a generalized port of it, so DBMS gets the same functions by copying `src/`. "Job" = card in `jobs/` that closes the gap.

| DSA function | SQL / DBMS state | Where / Job |
| :-- | :-- | :-- |
| Hub: today's plan, streak, due reviews, open mistakes | done | `src/pages/Hub.jsx` |
| Module cards with L1–L4 pills, progress | done (+ soft prerequisite gating DSA lacks) | `Hub.jsx` |
| Placement quiz → "start here / skim / next level" | done | `src/pages/Lesson.jsx` |
| Section TOC, level strip, scroll bar, revision card, glossary | done (TOC links fixed) | `Lesson.jsx` |
| Notes journal per lesson | done (markdown preview works) | `src/components/NotesJournal.jsx` |
| Mark complete → revision card enters spaced review | done (DSA's enrolment is broken; fixed here) | `src/lib/progress.js` |
| Scored MCQs, one attempt, wrong → mistake log | done (options shuffled; DSA leaks answer position) | `src/components/blocks.jsx` |
| Spaced-repetition review queue | done; prompt first, answer on reveal; also flashcards + mistakes as cards | `src/pages/Review.jsx`, `src/lib/srs.js` |
| Mock interview: clock, hint ladder, reference solution, follow-up chain, self-rate | done; approach ladder shown in order after J21 | `src/pages/Interview.jsx` · SQL-J21 |
| Timed sprint 15/30/45 min | done; runnable problems graded in-page | `src/pages/Sprint.jsx` |
| Stats dashboard, export / import progress | done | `src/pages/Stats.jsx` |
| Weakness radar (accuracy per module) | done (MCQ, MSQ, NAT all graded) | `src/lib/analytics.js` |
| Search | done (titles, sections, terms, problems, patterns) | `src/components/SearchBox.jsx` |
| Changelog feed | done | `content/changelog.json` |
| Code language toggle (C++ / Python) | done as SQL / PostgreSQL / MySQL / pandas / SQLAlchemy | `content/subject.json` |
| Problem: progressive hints, reveal solution, complexity, follow-ups | UI done; content missing for most problems | SQL-J09…J17 (drills), SQL-J22…J29 (sourced) |
| **Answer payload files** (`renderer/answers/<mod>-L<n>.mjs`) merged into lessons by `apply-answers.mjs` | done (J21) | `content/answers/<module>.json` merged by `sync-problems.mjs` |
| **Tested answers** (`answers/tests/*.py`, `verify-answers.mjs`) | done (J21) | `check-exercises.mjs` runs every solution + approach on base and `_edge` data |
| **Solution coverage report** (`solution-coverage.mjs`) | done (J21) | `scripts/solution-coverage.mjs` (npm run coverage) |
| Brute → optimal approaches (Striver format) | done (J21) | SQL-J21 (`approaches` field), `docs/STYLE.md` §4 |
| ≥ 2 dry-run traces per lesson | SQL had 0 | SQL-J03 `query-trace` + quota in SQL-J20 |
| Content lint + CI validate + Pages deploy | done | `scripts/lint-content.mjs`, `.github/workflows/ci.yml` |
| Corrupt-progress quarantine, versioned store | done | `src/lib/progress.js` |
| Visual blocks (array boxes, memory map, flow) | done, plus SQL/DBMS diagrams DSA never had | `content/BLOCKS.md` |

**Beyond DSA (keep):** in-browser PostgreSQL with graded exercises and hidden edge datasets; theory blocks (question MSQ/NAT, flashcards, misconception, predict, explain-back); diagram/procedure blocks (schedule, fd-stepper, nf-decomposition, er-diagram, query-plan).
