# Local patches to vendored `@layered-study/core`

`vendor/core` is a vendored copy. Re-vendoring or upgrading the core **will overwrite these
patches**. Re-apply them after any upgrade, then re-run `npm run build`.

## 1. `renderer/render.js` → `renderProblem()` — link sourced problems

*Why:* the stock renderer prints `platform` as plain text and has no `href` anywhere. Without
this patch every sourced problem in `content/problems.json` renders as unclickable text, which
removes the entire point of sourcing.

**Before**

```js
<div><div class="prob-name">${md(p.title)}</div>
  <div class="prob-meta">${esc(p.platform || '')}${p.lc ? ' · LC ' + p.lc : ''}${p.patterns ? ' · ' + p.patterns.join(' + ') : ''}${p.srcFile ? ' · your: CODES/' + p.srcFile : ''}</div></div>
```

**After** — wraps the title in an anchor when `p.url` exists, and surfaces `ref`, `difficulty`
and `sheet` in the meta line. Falls back to the legacy `p.lc` field when `p.ref` is absent, so
dsa-lms-style content still renders.

## 2. `renderer/render.js` → `renderProblem()` — non-C++ solution keys

*Why:* the stock renderer reads `p.solutionCode.cpp` — a hardcoded leftover from dsa-lms. A SQL
solution written under a `sql` or `code` key was silently dropped.

**Before**

```js
if (p.solutionCode) sol = renderCode({ label: ..., code: p.solutionCode.cpp, py: ..., reveal: true }, skillConfig);
```

**After** — resolves `code` → `sql` → `cpp` in order, and spreads `p.solutionCode` so
dialect keys (`pg`, `mysql`, `py-pandas`) declared in `language-config.json` pass through.

## Upstreaming

Both patches are skill-agnostic and belong in core. If `@layered-study/core` ever gets a real
release channel, send them upstream and delete this file.
