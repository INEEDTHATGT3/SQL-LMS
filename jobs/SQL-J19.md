---
type: job
code: SQL
id: J19
title: "Docs for the SPA rebuild"
status: open
est: 30
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
seq: 28
depends: [SQL-J22, SQL-J23, SQL-J24, SQL-J25, SQL-J26, SQL-J27, SQL-J28, SQL-J29]
vault: "DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS/JOBS/SQL J19 · Docs for the SPA rebuild.md"
created: 2026-10-17
updated: 2026-10-17
---
# SQL J19 · Docs for the SPA rebuild

## Goal
Make every doc describe the React app, not the retired static renderer.

## Done when
- [ ] README.md already has the dsa-lms GitHub layout (badges, screenshots in `docs/screenshots/`, features, curriculum, sourcing). Keep that layout and update facts in place: features (mirror `docs/PARITY.md`), commands (each exists in package.json), counts, `/#/lab`. Update CHANGELOG 3.0.0 "Fixed" with the modules J09–J17 actually fixed.
- [ ] content/AUTHORING.md rewritten: layer contract, quotas from subject.json, link to BLOCKS.md, author → lint → check-exercises → build loop; AGENT_BRIEF.md state of play points to AGENTS.md
- [ ] CHANGELOG.md 3.0.0 entry and a `content/changelog.json` entry (shown on the hub)
- [ ] `grep -rn "renderer/\|vendor/\|site/" README.md content/*.md` returns nothing stale

## Inputs
- `AGENTS.md` (repo rules, verify commands, block contract)
- `content\BLOCKS.md` (block JSON shapes)
- `README.md`, `CHANGELOG.md`, `content/AUTHORING.md`, `content/AGENT_BRIEF.md`, `content/changelog.json`, `package.json`

## Steps
0. Run `node jobs/status.mjs show SQL-J19`; if it prints UNMET depends, stop and tell Dhruv which card to run first.
1. Rewrite the docs.
2. Run the grep check.

## Limits
- May edit: `README.md`, `CHANGELOG.md`, `content/AUTHORING.md`, `content/AGENT_BRIEF.md`, `content/changelog.json`.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
