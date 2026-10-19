---
type: job
code: SQL
id: J19
title: "Docs for the SPA rebuild"
owner: opencode
agent: mechanic
status: open
est: 30
workdir: 'C:\MEGA NZ\SKILLS MATERIAL\sql-lms'
created: 2026-10-17
updated: 2026-10-17
related: "[[SQL LMS — CARD]]"
---
# SQL J19 · Docs for the SPA rebuild

## Goal
Make every doc describe the React app, not the retired static renderer.

## Done when
- [ ] README.md: features, commands (each exists in package.json), curriculum, sources, `/#/lab`
- [ ] content/AUTHORING.md rewritten: layer contract, quotas from subject.json, link to BLOCKS.md, author → lint → check-exercises → build loop; AGENT_BRIEF.md state of play points to AGENTS.md
- [ ] CHANGELOG.md 3.0.0 entry and a `content/changelog.json` entry (shown on the hub)
- [ ] `grep -rn "renderer/\|vendor/\|site/" README.md content/*.md` returns nothing stale

## Inputs
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\AGENTS.md` (repo rules, verify commands, block contract)
- `C:\MEGA NZ\SKILLS MATERIAL\sql-lms\content\BLOCKS.md` (block JSON shapes)
- `README.md`, `CHANGELOG.md`, `content/AUTHORING.md`, `content/AGENT_BRIEF.md`, `content/changelog.json`, `package.json`

## Steps
0. From the vault root run `python .obs-studio/comms.py jobs SQL --all`; if J18 is not `done`, set this card `blocked` with that reason and stop.
1. Rewrite the docs.
2. Run the grep check.

## Limits
- May edit: `README.md`, `CHANGELOG.md`, `content/AUTHORING.md`, `content/AGENT_BRIEF.md`, `content/changelog.json`.
- Never DECISIONS, ACTIONS, the CARD or hub notes. No commits, no new npm dependencies unless listed.

## Report
%% The agent writes here: what changed, files touched, checks run, what is still open. %%
