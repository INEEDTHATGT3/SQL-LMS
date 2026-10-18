#!/usr/bin/env node
/* Job-card board for OpenCode. Cards: jobs/<CODE>-J<nn>.md with frontmatter
   status (open|doing|review|done|blocked), seq (run order), depends ([IDs]).
     node jobs/status.mjs                       list every card, runnable ones marked ▶
     node jobs/status.mjs next [CODE]           next runnable card: open, all depends done, lowest seq
     node jobs/status.mjs show ID               path, status, unmet depends (exit 2 if any)
     node jobs/status.mjs set ID STATUS ["note"]  set status (+ dated note in ## Report)
   `set` mirrors to Dhruv's Obsidian pit wall (comms.py) when the vault exists;
   override its location with PIT_WALL=<vault path>. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const STATUSES = ['open', 'doing', 'review', 'done', 'blocked'];
const VAULT = process.env.PIT_WALL || 'C:/MEGA NZ/OBSIDIAN NOTES';
const norm = id => String(id || '').trim().toUpperCase().replace(/\s+/, '-');
const today = () => new Date().toLocaleDateString('en-CA');

function parse(file) {
  const text = fs.readFileSync(file, 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const meta = {};
  for (const line of (fm ? fm[1] : '').split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  meta.depends = (meta.depends || '').replace(/[[\]]/g, '').split(',').map(norm).filter(Boolean);
  meta.seq = Number(meta.seq) || 999;
  return { file, text, meta, id: `${meta.code}-${meta.id}` };
}

const cards = fs.readdirSync(DIR).filter(f => /^[A-Z0-9]+-J\d+\.md$/.test(f))
  .map(f => parse(path.join(DIR, f))).sort((a, b) => a.meta.seq - b.meta.seq);
const byId = Object.fromEntries(cards.map(c => [c.id, c]));
const unmet = c => c.meta.depends.filter(d => byId[d]?.meta.status !== 'done');
const runnable = c => ['open', 'doing'].includes(c.meta.status) && !unmet(c).length;

function mirror(c, status, note) {
  const comms = path.join(VAULT, '.obs-studio', 'comms.py');
  if (!fs.existsSync(comms)) return console.log('(pit wall not found; repo card updated only)');
  const py = process.platform === 'win32' ? 'python' : 'python3';
  const run = args => spawnSync(py, [comms, ...args], { cwd: VAULT, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } });
  const r = run(['job-set', c.meta.code, c.meta.id, 'status', status]);
  if (note) run(['job-note', c.meta.code, c.meta.id, note]);
  console.log(r.status === 0 ? `mirrored to pit wall: ${c.id} ${status}` : `pit wall mirror failed: ${(r.stderr || r.stdout).trim().split('\n').pop()}`);
}

const [cmd, a1, a2, ...rest] = process.argv.slice(2);

if (!cmd || cmd === 'list') {
  for (const c of cards) {
    const u = unmet(c);
    console.log(`${runnable(c) ? '▶' : ' '} ${c.id.padEnd(9)} ${c.meta.status.padEnd(7)} ${String(c.meta.est).padStart(3)}m  ${c.meta.title}` +
      (u.length && c.meta.status !== 'done' ? `   (waits on ${u.join(', ')})` : ''));
  }
  const n = cards.find(runnable);
  console.log(n ? `\nNext: /job ${n.id}` : '\nNothing runnable: check review / blocked cards.');
} else if (cmd === 'next') {
  const n = cards.find(c => runnable(c) && (!a1 || c.meta.code === a1.toUpperCase()));
  console.log(n ? n.id : 'none');
} else if (cmd === 'show') {
  const c = byId[norm(a1)];
  if (!c) { console.error(`no card ${a1}`); process.exit(1); }
  const u = unmet(c);
  console.log(`${c.id} · ${c.meta.status} · ${c.meta.est}m · ${c.meta.title}\npath: ${path.relative(process.cwd(), c.file)}\nworkdir: ${c.meta.workdir || '(repo)'}`);
  console.log(u.length ? `UNMET depends: ${u.map(d => `${d} (${byId[d]?.meta.status || 'missing'})`).join(', ')}` : 'depends: all done');
  process.exit(u.length ? 2 : 0);
} else if (cmd === 'set') {
  const c = byId[norm(a1)];
  if (!c || !STATUSES.includes(a2)) { console.error(`usage: set ID ${STATUSES.join('|')} ["note"]`); process.exit(1); }
  const note = rest.join(' ').trim();
  let t = c.text.replace(/^status:.*$/m, `status: ${a2}`).replace(/^updated:.*$/m, `updated: ${today()}`);
  if (note) t = t.replace(/\s*$/, `\n- ${today()} · ${note}\n`);
  fs.writeFileSync(c.file, t);
  console.log(`${c.id} → ${a2}`);
  mirror(c, a2, note);
} else {
  console.error('commands: list | next [CODE] | show ID | set ID STATUS ["note"]');
  process.exit(1);
}
