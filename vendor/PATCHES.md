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

## 3. `css/theme.css.mustache` — resolve level accent as template vars

*Why:* the template used Mustache function-call syntax `{{rgba(color, 0.1)}}` which never
resolves — `theme-compiler.js` already precomputes `rgba` (0.1 alpha) and `rgba2` (0.25 alpha)
on each level object, and also attaches `config.rgba` as a JS function (a Mustache lambda that
receives the raw string, not a callable). Result: `--lvl-rgba:;` and `--lvl-border:;` rendered
empty, so level accents collapsed to full-opacity base color (level-4 EXPERT `#0077b6` was
near-invisible on the dark background).

**Before**

```css
--lvl-rgba:{{rgba(levels.0.color, 0.1)}}; --lvl-border:{{rgba(levels.0.color, 0.25)}};
…
body[data-level="{{level}}"]{ --lvl:{{color}}; --lvl-rgba:{{rgba(color, 0.1)}}; --lvl-border:{{rgba(color, 0.25)}}; }
```

**After**

```css
--lvl-rgba:{{levels.0.rgba}}; --lvl-border:{{levels.0.rgba2}};
…
body[data-level="{{level}}"]{ --lvl:{{color}}; --lvl-rgba:{{rgba}}; --lvl-border:{{rgba2}}; }
```

Accompanied by a content-side colour fix: `content/theme-config.json` level 4 moved from
`#0077b6` to `#c084fc` (violet) to separate EXPERT from the cyan L1–L3 family.

## 4. `renderer/render.js` + `renderer/sync-problems.mjs` — render sourced company tags

*Why:* company realism is provenance metadata on sourced problems. The bank-to-lesson
projection must preserve `company`, and the problem meta line must display it without
changing the stable problem ID or source fields.

The local renderer appends `company` to `prob-meta`; the local sync script includes the
field in its generated sourced-problem allowlist.

## 4. `js/language-switcher.js` — expose `window.initLangToggle` + idempotent init

*Why:* the renderer emits `<script>initLangToggle();initRecall('<lesson>');</script>`
(`vendor/core/renderer/render.js:276`) but the generated `lang-toggle.js` never defined
`window.initLangToggle`. The ReferenceError at `initLangToggle()` aborted the whole inline
statement, so **`initRecall` never ran** — quizzes, solved-state, progress bar, and mark-complete
were all unbound on every lesson page (lang toggle only worked by luck of the IIFE's own
auto-init on DOMContentLoaded). Confirmed via runtime audit: `ReferenceError: initLangToggle is
not defined` on all 36 pages.

**Before** (template tail)

```js
  apply(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

**After** — expose the global and guard against the double-run (auto-boot + explicit call):

```js
  apply(saved);
  }

  if (typeof window !== 'undefined') { window.initLangToggle = init; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

plus `var started = false;` with `if (started) return; started = true;` at the top of `init()`,
and a `typeof document === 'undefined'` early-return in `apply()`.

**Companion content-side fix:** `content/language-config.json` `storageKey` was `sql_lms_progress_v1`,
the same key `quota-config.json` uses for the JSON progress object. `lang-toggle.js` wrote a raw
string there and `recall.js` wrote JSON — each overwrote the other, so toggling language wiped all
progress and saving progress reset the language preference. `language-config.json` now uses
`sql_lms_lang_v1`. (The vendored default already separates them: `skill_lang` vs
`skill_progress_v1`; the config had overridden both to one key.)

## Upstreaming

Both `renderer/render.js` patches, the `css/theme.css.mustache` fix, and the
`js/language-switcher.js` fix are skill-agnostic and belong in core. If `@layered-study/core` ever
gets a real release channel, send them upstream and delete this file.
