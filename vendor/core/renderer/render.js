/**
 * @layered-study/core - Renderer with Plugin Architecture
 * Reads content/*.json, applies quota-config.json, renders site/*.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { builtinBlocks } from './blocks/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------- utils ---------------- */
const esc = s => String(s ?? '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');

function md(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

let phCounter = 0;
const nu = () => `u${Date.now().toString(36)}${(phCounter++).toString(36)}`;

// SQL keywords for highlighting
const kwsSql = 'select from where join inner left right full outer on as group by having order limit offset union except intersect insert update delete create drop alter table index view procedure function trigger case when then else end and or not in like between is null distinct exists with recursive'.split(' ');
const kwsCpp = 'int float double char bool void long short unsigned signed const static inline virtual friend struct class public private protected new delete return if else while for do switch case break continue true false nullptr this namespace using template typename operator sizeof mutable explicit extern goto enum union try catch throw'.split(' ');
const kwsPy = 'def return if elif else for while in not and or None True False import from as class lambda pass break continue with yield try except finally global nonlocal assert del raise is print len range enumerate zip map set dict list tuple int float str bool'.split(' ');

function getKeywords(lang) {
  if (lang === 'sql') return kwsSql;
  if (lang === 'py') return kwsPy;
  return kwsCpp;
}

function highlight(code, lang) {
  const kwAlt = getKeywords(lang).join('|');
  const re = new RegExp(
    '("(?:[^&]|&(?!quot;))*"|\'(?:[^&]|&(?!#39))*\')' + // strings
    '|\\b(' + kwAlt + ')\\b' +                                          // keywords
    '|\\b(\\d+(?:\\.\\d+)?)\\b',                                        // numbers
    'g');
  return esc(code).split('\n').map(line => {
    let cmTok = null;
    let cmIdx = -1;
    if (lang === 'py') {
      cmIdx = line.indexOf('#');
    } else if (lang === 'sql') {
      cmIdx = line.indexOf('--');
    } else {
      const a = line.indexOf('//');
      const b = line.indexOf('/*');
      cmIdx = (a === -1) ? b : (b === -1 ? a : Math.min(a, b));
    }
    if (cmIdx !== -1 && !line.slice(0, cmIdx).includes('"')) {
      cmTok = `<span class="cm">${line.slice(cmIdx)}</span>`;
      line = line.slice(0, cmIdx);
    }
    line = line.replace(re, (m, str, kw, num) =>
      str ? `<span class="st">${str}</span>`
        : kw ? `<span class="kw">${kw}</span>`
        : `<span class="num">${num}</span>`);
    if (lang === 'py' && /^\s*@\w+/.test(line)) line = line.replace(/(@\w+)/, '<span class="pp">$1</span>');
    if (lang === 'cpp' && /^(\s*)#(include|define|ifndef|endif|pragma)/.test(line)) line = line.replace(/^(\s*)(#.*)$/, '$1<span class="pp">$2</span>');
    if (cmTok) line += cmTok;
    return line;
  }).join('\n');
}

/* ---------------- built-in block renderers ---------------- */

function renderCode(b, skillConfig) {
  const languages = skillConfig?.languages || [{id:'cpp', label:'C++'}, {id:'py', label:'Python'}];
  const hasPy = Object.prototype.hasOwnProperty.call(b, 'py');
  const pyNull = hasPy && b.py === null;
  
  // Build language tabs
  const tabs = languages.map(l => 
    `<button data-set="${l.id}">${l.label}</button>`
  ).join('');
  const sw = `<div class="lang-tabs">${tabs}</div>`;
  
  const cppPre = `<pre data-lang="cpp" class="${hasPy ? 'has-py-alt' : ''}"><code>${highlight(b.code, 'cpp')}</code></pre>`;
  let pyPre;
  if (!hasPy || pyNull) pyPre = `<pre data-lang="py" class="py-missing"><code># Python version pending — add after validation.</code></pre>`;
  else pyPre = `<pre data-lang="py"><code>${highlight(b.py, 'py')}</code></pre>`;
  
  // Support other languages from config
  let otherPre = '';
  languages.filter(l => l.id !== 'cpp' && l.id !== 'py').forEach(l => {
    const codeKey = l.id.replace('-', '_'); // py-pandas -> py_pandas
    if (b[codeKey]) {
      otherPre += `<pre data-lang="${l.id}"><code>${highlight(b[codeKey], l.highlight || 'sql')}</code></pre>`;
    }
  });
  
  const note = (!hasPy || pyNull) ? `<div class="py-note has-missing">⏳ Python slot reserved (added after validation)</div>` : '';
  if (b.reveal) {
    const id = nu();
    return `<div class="code-block"><div class="code-label"><span>${esc(b.label || 'solution')}</span>${sw}</div>
      <button class="reveal-btn" data-target="${id}" data-show="Reveal solution" data-hide="Hide solution">Reveal solution</button>
      <div class="reveal-target" id="${id}">${cppPre}${pyPre}${otherPre}</div>${note}</div>`;
  }
  return `<div><div class="code-label"><span>${esc(b.label || '')}</span>${sw}</div>${cppPre}${pyPre}${otherPre}${note}</div>`;
}

function renderTrace(b) {
  const cols = b.columns || ['Step', 'State', 'What happens / why'];
  return `<h4 style="color:var(--text-bright);margin:18px 0 8px;">${md(b.title || 'Dry-run trace')}</h4>
  <table class="trace"><thead><tr>${cols.map(c => `<th>${md(c)}</th>`).join('')}</tr></thead>
  <tbody>${b.steps.map(r => `<tr>${r.map(c => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderVisual(b) {
  const s = b.spec || {};
  if (b.kind === 'boxes-array') {
    return `<div class="arr-vis">${(s.values || []).map((v, i) =>
      `<div class="arr-cell ${(s.highlight || []).includes(i) ? 'hi' : ''}"><div class="arr-val">${esc(v)}</div><div class="arr-idx">${s.labels ? esc(s.labels[i]) : '[' + i + ']'}</div></div>`).join('')}</div>`;
  }
  if (b.kind === 'mem-map') {
    return `<div class="mem-map">${(s.segments || []).map(g =>
      `<div class="mem-seg"><div class="seg-name">${esc(g.name)}</div><div class="seg-desc">${md(g.desc)}</div></div>`).join('')}</div>`;
  }
  if (b.kind === 'flow') {
    return `<div class="flow-steps">${(s.steps || []).map(st => `<div class="flow-step">${md(st)}</div>`).join('')}</div>`;
  }
  return '';
}

function renderCompare(b) {
  return `<table class="generic"><thead><tr><th></th><th>${md(b.leftTitle)}</th><th>${md(b.rightTitle)}</th></tr></thead>
  <tbody>${(b.rows || []).map(r => `<tr><td style="font-family:'Space Mono';font-size:11px;color:var(--text-dim);letter-spacing:1px;">${md(r.label)}</td><td>${md(r.left)}</td><td>${md(r.right)}</td></tr>`).join('')}</tbody></table>`;
}

let quizIdx = 0;
function renderQuiz(b, sectionKey) {
  return (b.items || []).map(it => {
    const key = `${sectionKey}-q${quizIdx++}`;
    return `<div class="quiz-card" data-quiz-key="${key}" data-answer="${it.answer}">
      <div class="quiz-q">${md(it.q)}</div>
      <div class="quiz-opts">${it.options.map((o, i) => `<div class="quiz-opt" data-i="${i}"><span class="opt-key">${'ABCD'[i]}</span><span>${md(o)}</span></div>`).join('')}</div>
      <div class="quiz-explain">${md(it.explain || '')}</div>
      <div class="quiz-score"></div>
    </div>`;
  }).join('');
}

function renderProblem(p, skillConfig) {
  const pid = p.id || nu();
  let hints = '';
  if (p.hints && p.hints.length) {
    hints = `<div class="prob-hints">` + p.hints.map((h, i) => {
      const id = nu();
      return i === 0
        ? `<button class="reveal-btn" data-target="${id}" data-show="Hint ${i + 1}" data-hide="Hide hint ${i + 1}">Hint ${i + 1}</button><div class="reveal-target" id="${id}">${md(h)}</div>`
        : (() => { const prev = nu(); return `<button class="reveal-btn" data-target="${prev}" data-show="Hint ${i + 1}" data-hide="Hide hint ${i + 1}">Hint ${i + 1}</button><div class="reveal-target" id="${prev}">${md(h)}</div>`; })();
    }).join('') + `</div>`;
  }
  let sol = '';
  if (p.solutionCode) sol = renderCode({ ...p.solutionCode, label: p.solutionCode.label || 'reference solution', code: p.solutionCode.code !== undefined ? p.solutionCode.code : (p.solutionCode.sql !== undefined ? p.solutionCode.sql : p.solutionCode.cpp), py: p.solutionCode.py !== undefined ? p.solutionCode.py : null, reveal: true }, skillConfig);
  let fus = '';
  if (p.followups && p.followups.length) {
    fus = `<div class="followup-chain"><div style="font-family:'Space Mono';font-size:10px;letter-spacing:2px;color:var(--accent2);margin-bottom:6px;">INTERVIEWER FOLLOW-UP CHAIN</div>` +
      p.followups.map(f => `<div class="followup-item"><span class="followup-q">↳ ${md(f.q)}</span><div class="followup-a">${md(f.a)}</div></div>`).join('') + `</div>`;
  }
  return `<li class="problem-item">
    <div class="problem-head">
      <span class="diff t${p.tier}">L${p.tier}</span>
      <div><div class="prob-name">${p.url ? `<a class="prob-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--accent2);">${md(p.title)}</a>` : md(p.title)}</div>
        <div class="prob-meta">${esc(p.platform || '')}${p.ref ? ' · #' + esc(p.ref) : (p.lc ? ' · LC ' + p.lc : '')}${p.difficulty ? ' · ' + esc(p.difficulty) : ''}${p.sheet ? ' · ' + esc(p.sheet) : ''}${p.patterns ? ' · ' + p.patterns.join(' + ') : ''}${p.srcFile ? ' · your: CODES/' + p.srcFile : ''}</div></div>
      <div class="prob-actions"><label class="solved-check"><input type="checkbox" data-pid="${pid}"><span>SOLVED</span></label></div>
    </div>
    <div class="prob-body">
      ${p.statement ? md(p.statement) : ''}
      ${hints}${sol}${fus}
    </div></li>`;
}

function renderFollowup(b) {
  return `<div class="followup-chain">${(b.chain || []).map(f =>
    `<div class="followup-item"><span class="followup-q">↳ ${md(f.q)}</span><div class="followup-a">${md(f.a)}</div></div>`).join('')}</div>`;
}

/* ---------------- block renderer registry ---------------- */

function createBlockRegistry(skillConfig) {
  const customBlocks = skillConfig?.customBlocks || {};
  const validators = skillConfig?.customValidators || {};
  
  return {
    prose: (b) => `<p>${md(b.md)}</p>`,
    heading: (b) => `<h3>${md(b.text)}</h3>`,
    list: (b) => `<ul class="notes">${b.items.map(i => `<li>${md(i)}</li>`).join('')}</ul>`,
    mantra: (b) => `<div class="mantra">${md(b.md)}</div>`,
    callout: (b) => `<div class="callout ${b.tone || ''}">${md(b.md)}</div>`,
    code: (b) => renderCode(b, skillConfig),
    trace: renderTrace,
    visual: renderVisual,
    compare: renderCompare,
    quiz: (b, sectionKey) => renderQuiz(b, sectionKey),
    problem: (b) => `<ul class="prob-list">${renderProblem(b, skillConfig)}</ul>`,
    problems: (b) => `<ul class="prob-list">${(b.items || []).map(p => renderProblem(p, skillConfig)).join('')}</ul>`,
    followup: renderFollowup,
    ...customBlocks // custom blocks override or extend
  };
}

/* ---------------- page assembly ---------------- */

function page(lesson, mod, skillConfig) {
  const lvl = lesson.level;
  const siblings = [1, 2, 3, 4].map(L => {
    const meta = mod.levelsMeta[L];
    return `<a class="level-pill ${L === lvl ? 'current' : ''}" data-lesson="${lesson.moduleId}_L${L}" href="${lesson.moduleId}_L${L}.html">${meta.name}</a>`;
  }).join('');

  const placement = (lesson.placementQuiz || []).length ? `
  <section class="section" id="placement">
    <div class="section-header"><span class="section-num">00 //</span><h2>Which layer am I? (placement check)</h2></div>
    <p>Honest answers only. This decides whether <em>this</em> file is your entry point.</p>
    ${renderQuiz({ items: lesson.placementQuiz }, 'place')}
    <div id="placement-result"></div>
  </section>` : '';

  const navSections = lesson.sections.map((s, i) => `<a href="#sec-${i}">${esc(String(i + 1).padStart(2, '0'))} · ${esc(s.title)}</a>`).join('');
  
  const blockRegistry = createBlockRegistry(skillConfig);
  
  const bodySections = lesson.sections.map((s, i) => `
  <section class="section" id="sec-${i}">
    <div class="section-header"><span class="section-num">${String(i + 1).padStart(2, '0')} //</span><h2>${md(s.title)}</h2></div>
    ${s.blocks.map(b => {
      const renderer = blockRegistry[b.type];
      if (!renderer) return `<div class="callout warn">unknown block type: ${esc(b.type)}</div>`;
      return renderer(b, 's' + i, skillConfig);
    }).join('\n')}
  </section>`).join('');

  const revCard = `
  <section class="section" id="revision">
    <div class="section-header"><span class="section-num">${String(lesson.sections.length + 1).padStart(2, '0')} //</span><h2>60-second revision card</h2></div>
    <div class="rev-card"><h4>RE-READ BEFORE ANY INTERVIEW / CONTEST</h4>
      <ul>${(lesson.revisionCard || []).map(r => `<li>${md(r)}</li>`).join('')}</ul></div>
    <h3>Glossary</h3>
    <table class="generic"><tbody>${(lesson.glossary || []).map(g => `<tr><td style="width:220px;"><code>${esc(g.term)}</code></td><td>${md(g.def)}</td></tr>`).join('')}</tbody></table>
  </section>`;

  const watermark = skillConfig?.watermark || 'SKILL';
  const skillName = skillConfig?.skillName || 'Skill';
  const nextLabels = { 1: 'L2 INTERVIEW READY file', 2: 'L3 ADVANCED file', 3: 'L4 EXPERT file', 4: 'next MODULE' };

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(lesson.title)} — L${lvl} ${mod.levelsMeta[lvl].name}</title>
<link rel="stylesheet" href="theme.css"></head>
<body data-level="${lvl}" data-lang="${skillConfig?.defaultLanguage || 'sql'}">
<div class="hero" data-watermark="${watermark}">
  <div class="hero-tag"><span class="badge">MODULE ${esc(mod.num)}</span><span class="badge blue">L${lvl} · ${esc(mod.levelsMeta[lvl].name)}</span><span class="badge green">${esc(lesson.tagline || '')}</span></div>
  <h1>${md(lesson.title)}</h1>
  <div class="promise">${md(mod.levelsMeta[lvl].promise)}</div>
  <div class="level-strip">${siblings}</div>
</div>
<nav class="toc">${navSections}<a href="#revision">REV CARD</a></nav>
<div class="progress-wrap"><div class="progress-bar"></div></div>
<div class="container">
  ${placement}
  ${bodySections}
  ${revCard}
  <div class="complete-box"><button id="mark-complete">MARK ARTIFACT COMPLETE</button>
    <p style="margin-top:10px;font-size:12px;color:var(--text-dim);">Progress saved locally (localStorage). Next up: ${esc(nextLabels[lvl])}</p></div>
</div>
<div class="footer">${skillName.toUpperCase()} LAYERED SYSTEM · MODULE ${esc(mod.num)} · L${lvl}/${esc(mod.levelsMeta[lvl].name)} · GENERATED ${new Date().toISOString().slice(0, 10)}</div>
<script src="lang-toggle.js"></script><script src="recall.js"></script>
<script>initLangToggle();initRecall('${lesson.moduleId}_L${lvl}');</script>
</body></html>`;
}

function nextLabel(lvl) { return ({ 1: 'L2 INTERVIEW READY file', 2: 'L3 ADVANCED file', 3: 'L4 EXPERT file', 4: 'next MODULE' })[lvl]; }

/* ---------------- quota validator ---------------- */

async function validate(lesson, quotaConfig, root) {
  const errs = [], warns = [];
  let traces = 0, quizzes = 0, problems = [];
  const minProblems = quotaConfig?.minProblems || { 1: 8, 2: 10, 3: 6, 4: 5 };
  const minPlacementQuiz = quotaConfig?.minPlacementQuiz || 5;
  const minTraces = quotaConfig?.minTraces || 2;
  const minMcqsTotal = quotaConfig?.minMcqsTotal || 6;
  const minRevisionBullets = quotaConfig?.minRevisionBullets || 4;
  const minGlossaryTerms = quotaConfig?.minGlossaryTerms || 5;
  // Allow skills to define which block types count as traces (e.g., query-plan for SQL)
  const traceTypes = new Set(['trace', ...(quotaConfig?.traceTypes || [])]);

  (lesson.sections || []).forEach(sec => sec.blocks.forEach(b => {
    if (traceTypes.has(b.type)) traces++;
    if (b.type === 'quiz') quizzes += (b.items || []).length;
    if (b.type === 'problem') problems.push(b);
    if (b.type === 'problems') problems.push(...(b.items || []));
  }));

  if ((lesson.placementQuiz || []).length < minPlacementQuiz) errs.push(`placementQuiz needs ≥${minPlacementQuiz} items (has ${(lesson.placementQuiz || []).length})`);
  if (traces < minTraces) errs.push(`needs ≥${minTraces} traced dry-runs (has ${traces})`);
  if (quizzes < minMcqsTotal) errs.push(`needs ≥${minMcqsTotal} MCQs across sections (has ${quizzes})`);
  if (problems.length < minProblems[lesson.level]) errs.push(`needs ≥${minProblems[lesson.level]} problems at L${lesson.level} (has ${problems.length})`);
  if ((lesson.revisionCard || []).length < minRevisionBullets) errs.push(`revisionCard needs ≥${minRevisionBullets} bullets`);
  if ((lesson.glossary || []).length < minGlossaryTerms) errs.push(`glossary needs ≥${minGlossaryTerms} terms`);
  
  // Tier validation
  const tiers = problems.map(p => p.tier);
  if (tiers.some(t => t !== lesson.level)) warns.push(`tier mismatch: L${lesson.level} file contains problems tagged tier ${[...new Set(tiers)].filter(t => t !== lesson.level).join(',')}`);
  
  // Custom validators
  const customValidators = quotaConfig?.customValidators || {};
  for (const [name, validatorPath] of Object.entries(customValidators)) {
    try {
      const fullPath = path.resolve(root, validatorPath);
      const fileUrl = 'file://' + fullPath.replace(/\\/g, '/');
      const validator = await import(fileUrl);
      const result = await validator.default(lesson, quotaConfig);
      if (result.errors) errs.push(...result.errors);
      if (result.warnings) warns.push(...result.warnings);
    } catch (e) {
      console.error(`Validator ${name} error:`, e.stack);
      warns.push(`Custom validator '${name}' failed: ${e.message}`);
    }
  }

  return { errs, warns };
}

/* ---------------- index hub ---------------- */

function emitIndex(mods, built, skillConfig, contentDir, siteDir) {
  let log = [];
  const logPath = path.join(contentDir, 'changelog.json');
  if (fs.existsSync(logPath)) {
    try { log = JSON.parse(fs.readFileSync(logPath, 'utf8')).changelog || []; } catch (e) {}
  }
  const toneMap = { module: 'green', system: 'blue', fix: 'red', note: 'warn' };
  const logHtml = log.length ? `
    <h3 style="color:var(--lvl);margin:32px 0 12px;font-family:'Space Mono';letter-spacing:2px;">UPDATES & ADDITIONS</h3>
    ${log.map(e => `<div class="callout ${toneMap[e.type] || ''}"><strong>${esc(e.date)}</strong> · ${md(e.title)}<br><span style="font-size:13px;color:var(--text-dim);">${md(e.detail || '')}</span></div>`).join('')}` : '';
  
  const cards = mods.modules.filter(m => built[m.id]).map(m => {
    const pills = [1, 2, 3, 4].map(L => `<a class="level-pill" href="${m.id}_L${L}.html">L${L}</a>`).join('');
    return `<div class="card" style="margin-bottom:16px;">
      <div class="card-title">MODULE ${esc(m.num)} ${built[m.id] === 'partial' ? '· IN PROGRESS' : '· COMPLETE'}</div>
      <div style="font-size:20px;font-weight:700;color:var(--text-bright);margin-bottom:4px;">${md(m.title)}</div>
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:14px;">${md(m.subtitle || '')}</div>
      <div class="level-strip" style="margin-top:0;">${pills}</div></div>`;
  }).join('');
  
  const watermark = skillConfig?.watermark || 'SKILL';
  const skillName = skillConfig?.skillName || 'Skill';
  
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${skillName} Layered System — Hub</title><link rel="stylesheet" href="theme.css"></head>
<body data-level="1"><div class="hero" data-watermark="${watermark}"><div class="hero-tag"><span class="badge">LAYERED STUDY SYSTEM</span></div>
<h1>${skillName} <span>Hub</span></h1><div class="promise">Every module × four layers. Progress saved locally in your browser.</div></div>
<div class="container">${logHtml}${cards}
<p style="color:var(--text-dim);font-size:12px;font-family:'Space Mono';margin-top:32px;">REGENERATED ${new Date().toISOString().slice(0, 10)} · layered-study-build</p>
</div></body></html>`;
  fs.writeFileSync(path.join(siteDir, 'index.html'), html);
}

/* ---------------- main export ---------------- */

export async function render(skillConfig, options = {}) {
  const root = options.root || process.cwd();
  const contentDir = options.contentDir || path.join(root, 'content');
  const siteDir = options.siteDir || path.join(root, 'site');
  
  const mods = JSON.parse(fs.readFileSync(path.join(contentDir, 'modules.json'), 'utf8'));
  const levelMeta = {};
  mods.levels.forEach(l => levelMeta[l.level] = l);
  const built = {};
  let count = 0, failed = 0;
  
  // Load quota config
  const quotaConfigPath = path.join(contentDir, 'quota-config.json');
  const quotaConfig = fs.existsSync(quotaConfigPath) ? JSON.parse(fs.readFileSync(quotaConfigPath, 'utf8')) : {};

  // Load custom blocks
  const customBlocks = {};
  if (quotaConfig.customBlocks) {
    for (const [name, blockPath] of Object.entries(quotaConfig.customBlocks)) {
      try {
        const fullPath = path.resolve(root, blockPath);
        const fileUrl = 'file://' + fullPath.replace(/\\/g, '/');
        const mod = await import(fileUrl);
        customBlocks[name] = mod.default;
      } catch (e) {
        console.warn(`Failed to load custom block '${name}':`, e.message);
      }
    }
  }
  
  // Load custom validators
  const customValidators = {};
  if (quotaConfig.customValidators) {
    for (const [name, validatorPath] of Object.entries(quotaConfig.customValidators)) {
      try {
        const fullPath = path.resolve(root, validatorPath);
        const fileUrl = 'file://' + fullPath.replace(/\\/g, '/');
        const mod = await import(fileUrl);
        customValidators[name] = mod.default;
      } catch (e) {
        console.warn(`Failed to load custom validator '${name}':`, e.message);
      }
    }
  }

  const fullSkillConfig = {
    ...skillConfig,
    customBlocks,
    customValidators,
    languages: skillConfig.languages || [{id:'sql', label:'SQL'}],
    defaultLanguage: skillConfig.defaultLanguage || 'sql'
  };

  for (const mod of mods.modules) {
    if (mod.status !== 'active') continue;
    const candidates = [path.join(contentDir, mod.id), path.join(contentDir, `${mod.num}_${mod.id}`)];
    const dir = candidates.find(c => fs.existsSync(c));
    if (!dir) continue;
    for (const f of fs.readdirSync(dir).filter(x => /^L\d+\.json$/.test(x))) {
      const lesson = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      lesson.moduleId = mod.id;
      const modWithLevels = { ...mod, levelsMeta: levelMeta };
      const { errs, warns } = await validate(lesson, quotaConfig, root);
      console.log(`\n◆ ${mod.id}/L${lesson.level} — ${lesson.title}`);
      warns.forEach(w => console.log(`  ⚠ ${w}`));
      if (errs.length) { errs.forEach(e => console.log(`  ✗ FAIL: ${e}`)); failed++; continue; }
      const html = page(lesson, modWithLevels, fullSkillConfig);
      const out = path.join(siteDir, `${mod.id}_L${lesson.level}.html`);
      fs.writeFileSync(out, html);
      built[mod.id] = built[mod.id] ? 'full' : 'partial';
      const kb = (fs.statSync(out).size / 1024).toFixed(1);
      console.log(`  ✓ built ${path.relative(root, out)} (${kb} KB)`);
      count++;
    }
  }
  mods.modules.forEach(m => { if (!built[m.id]) delete built[m.id]; });
  Object.keys(built).forEach(k => {
    const dir = [path.join(contentDir, k), path.join(contentDir, `${mods.modules.find(m => m.id === k).num}_${k}`)].find(c => fs.existsSync(c));
    built[k] = fs.readdirSync(dir).filter(f => /^L\d+\.json$/.test(f)).length >= 4 ? 'full' : 'partial';
  });
  emitIndex(mods, built, fullSkillConfig, contentDir, siteDir);

  // auto-changelog
  const logPath = path.join(contentDir, 'changelog.json');
  let log = [];
  try { log = (JSON.parse(fs.readFileSync(logPath, 'utf8')).changelog) || []; } catch (e) {}
  const today = new Date().toISOString().slice(0, 10);
  let dirty = false;
  for (const m of mods.modules) {
    if (built[m.id] !== 'full') continue;
    if (!log.some(e => e.type === 'module' && e.title.includes(`Module ${m.num} `))) {
      log.unshift({ date: today, type: 'module', title: `Module ${m.num} ${m.title} live`, detail: m.subtitle || '' });
      console.log(`+ changelog entry: Module ${m.num}`);
      dirty = true;
    }
  }
  if (dirty) fs.writeFileSync(logPath, JSON.stringify({ changelog: log }, null, 2));

  console.log(`\n=== ${count} artifact(s) built + index.html, ${failed} quota failure(s) ===`);
  process.exit(failed ? 1 : 0);
}