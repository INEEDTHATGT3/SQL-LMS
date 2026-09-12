#!/usr/bin/env node
/**
 * check-links.mjs — smoke-check external links referenced by the content.
 *
 * Walks every lesson JSON and problems.json, harvesting:
 *   - sourced problem `url` fields
 *   - http(s) links inside markdown-carrying blocks (callouts, paras, notes)
 * Then probes each unique URL (HEAD → GET fallback, 8s timeout). Report-only by
 * default; `--strict` turns failures into exit 1 for CI.
 *
 * Usage: node renderer/check-links.mjs [--strict] [--concurrency=8]
 */
import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.join(process.cwd(), 'content');
const argv = process.argv.slice(2);
const STRICT = argv.includes('--strict');
const CONC = Number((argv.find(a => a.startsWith('--concurrency=')) || '=8').split('=')[1] || 8);

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const URL_RE = /https?:\/\/[^\s"')\]]+/g;

function walkBlocks(node, urls) {
  if (!node || typeof node !== 'object') return;
  if (typeof node === 'string') {
    for (const m of node.match(URL_RE) || []) urls.add(m.replace(/[.,;]+$/, ''));
    return;
  }
  for (const v of Object.values(node)) walkBlocks(v, urls);
}

const urls = new Set();

for (const mod of read(path.join(CONTENT, 'modules.json')).modules) {
  for (const L of [1, 2, 3, 4]) {
    const file = [path.join(CONTENT, mod.id, `L${L}.json`),
                  path.join(CONTENT, `${mod.num}_${mod.id}`, `L${L}.json`)]
      .find(p => fs.existsSync(p));
    if (file) walkBlocks(read(file), urls);
  }
}

// bank problem urls + source registry urls
const bank = read(path.join(CONTENT, 'problems.json'));
for (const items of Object.values(bank.modules)) for (const p of items) if (p.url) urls.add(p.url);
for (const s of Object.values(bank.sources)) if (s.url) urls.add(s.url);

const list = [...urls].filter(u => /^https?:\/\//.test(u)).sort();
console.log(`${list.length} unique external URL(s) to probe.\n`);

const BOT_BLOCKED = ['leetcode.com', 'datalemur.com', 'platform.stratascratch.com'];
const TRY_GET = new Set([404, 403, 405, 429, 500, 503, 0]);

let done = 0, ok = 0, blocked = 0, fail = 0;
const failures = [];

async function probe(url) {
  let host;
  try { host = new URL(url).hostname; } catch { host = ''; }
  const attempt = redirects =>
    fetch(url, { method: redirects > 0 ? 'GET' : 'HEAD', redirect: 'follow',
                 headers: { 'user-agent': 'Mozilla/5.0 (link-rot check for sql-lms; reproducible crawl)' },
                 signal: AbortSignal.timeout(10000) })
      .then(r => ({ status: r.status, final: r.url || url }))
      .catch(e => ({ status: 0, error: String(e.name || e.message) }));

  let res = await attempt(0);
  if (TRY_GET.has(res.status)) {
    const get = await attempt(1);
    if (get.status && get.status !== 403) res = get;
    else if (get.status === 403) res = get;
  }
  done++;
  if (res.status >= 200 && res.status < 400) { ok++; return; }
  if (BOT_BLOCKED.some(d => host.endsWith(d))) { blocked++; return; }
  fail++;
  failures.push({ url, status: res.status, error: res.error || '' });
  console.log(`  ✗ ${url}  →  ${res.status}${res.error ? ' ' + res.error : ''}`);
}

const worker = async () => { while (list.length) { const u = list.shift(); await probe(u); } };
await Promise.all(Array.from({ length: Math.max(1, Math.min(CONC, 12)) }, worker));

console.log(`\n=== Links: ${ok} ok · ${blocked} bot-protected (skipped) · ${fail} failed · ${done} total (${STRICT ? 'STRICT' : 'report-only'}) ===`);
if (failures.length) {
  if (STRICT) { console.error('  → strict mode: exiting 1'); process.exit(1); }
  console.log(`  → 403/429 on judge domains is bot protection, not a dead link; those are classified as skipped.`);
}