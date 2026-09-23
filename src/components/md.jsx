/* md-lite + syntax highlight shared by every block. */
import { useMemo } from 'react';

const escape = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* `code`, **bold**, *italic*, [text](https://url), line breaks. Input is escaped
   first, so authored content can never inject markup. */
export function mdToHtml(text) {
  let s = escape(text);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/\n/g, '<br/>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}
export function MD({ text }) {
  const html = useMemo(() => mdToHtml(text), [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

const KW = {
  sql: 'select from where and or not in is null like ilike between exists all any some join inner left right full outer cross natural lateral on using group by having order asc desc nulls first last limit offset fetch next rows only union intersect except distinct as case when then else end with recursive insert into values update set delete returning create table view index unique primary key foreign references constraint check default alter add drop column cascade restrict truncate begin commit rollback savepoint transaction over partition window range groups preceding following unbounded current row filter within cast coalesce nullif count sum avg min max explain analyze materialized if exists function procedure trigger returns language declare return for each execute before after instead of grant revoke true false interval date time timestamp integer int bigint numeric decimal text varchar char boolean serial'.split(' '),
  py: 'def return if elif else for while in not and or None True False import from as class lambda pass break continue with yield try except finally global nonlocal assert del raise is print len range enumerate zip'.split(' '),
  cpp: 'int float double char bool void long short unsigned signed const static inline virtual struct class public private protected new delete return if else while for do switch case break continue true false nullptr this namespace using template typename operator sizeof enum try catch throw auto'.split(' ')
};
const COMMENT = { sql: '--', py: '#', cpp: '//' };
const RE = {};
function kwRe(lang) {
  return RE[lang] ||= new RegExp(
    '("[^"]*"|\'[^\']*\')|\\b(' + (KW[lang] || KW.cpp).join('|') + ')\\b|\\b(\\d+(?:\\.\\d+)?)\\b',
    lang === 'sql' ? 'gi' : 'g');
}
/* first comment marker outside a string literal, or -1 */
function commentAt(line, marker) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (line.startsWith(marker, i)) return i;
  }
  return -1;
}
export function highlight(code, lang = 'sql') {
  const re = kwRe(lang);
  return String(code ?? '').split('\n').map(raw => {
    const ci = commentAt(raw, COMMENT[lang] || '//');
    const body = ci === -1 ? raw : raw.slice(0, ci);
    const cm = ci === -1 ? '' : `<span class="cm">${escape(raw.slice(ci))}</span>`;
    let out = '', last = 0;
    for (const m of body.matchAll(re)) {
      out += escape(body.slice(last, m.index));
      const cls = m[1] ? 'st' : m[2] ? 'kw' : 'num';
      out += `<span class="${cls}">${escape(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + escape(body.slice(last)) + cm;
  }).join('\n');
}
export function Code({ code, lang }) {
  const html = useMemo(() => highlight(code, lang), [code, lang]);
  return <pre><code dangerouslySetInnerHTML={{ __html: html }} /></pre>;
}
