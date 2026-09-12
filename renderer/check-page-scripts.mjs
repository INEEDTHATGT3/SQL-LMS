import fs from 'fs';
import path from 'path';

const SITE = path.join(process.cwd(), 'site');
const CONTENT = path.join(process.cwd(), 'content');

function refsIn(html) {
  const ids = new Set();
  for (const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(m[0])) {
      const body = m[1];
      for (const id of ['initLangToggle', 'initRecall']) {
        if (new RegExp(`\\b${id}\\s*\\(`).test(body)) ids.add(id);
      }
    }
  }
  return ids;
}

function isDefined(corpus, id) {
  return new RegExp(
    `(function\\s+${id}\\s*\\(|window\\.${id}\\s*[=:]|const\\s+${id}\\s*=|let\\s+${id}\\s*=|var\\s+${id}\\s*=|${id}\\s*=\\s*(function|\\(|window|document))`
  ).test(corpus);
}

let bad = 0;
let pages = 0;
for (const f of fs.readdirSync(SITE)) {
  if (!f.endsWith('.html')) continue;
  pages++;
  const file = path.join(SITE, f);
  let html = fs.readFileSync(file, 'utf8');
  const refs = refsIn(html);
  const localScripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/^https?:/.test(s) && !/^\/\//.test(s));
  let corpus = html;
  for (const s of localScripts) {
    const p = path.join(SITE, s);
    if (fs.existsSync(p)) corpus += '\n' + fs.readFileSync(p, 'utf8');
    else { corpus += '\n/* MISSING ' + s + ' */'; }
  }
  for (const id of refs) {
    if (id === '__page_bootstrap__') continue;
    if (!isDefined(corpus, id)) {
      bad++;
      console.log(`MISSING ${id} on ${f}`);
    }
  }
}
console.log(`checked ${pages} page(s), ${bad} missing global(s)`);
process.exit(bad ? 1 : 0);