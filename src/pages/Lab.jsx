import { Link } from 'react-router-dom';
import { useProgress, actions } from '../lib/progress.js';
import { Block } from '../components/blocks.jsx';

/* Block gallery: every content/lab/*.json is { title, blocks[] }. Authors use
   it to see a block type before writing it into a lesson; not in the hub. */
const labs = Object.entries(import.meta.glob('/content/lab/*.json', { eager: true }))
  .map(([file, m]) => ({ file, ...m.default }))
  .sort((a, b) => a.file.localeCompare(b.file));

export default function Lab() {
  const p = useProgress();
  const lessonId = 'lab_L1';
  const st = p.lessons[lessonId] || {};
  const ctx = { lessonId, level: 2, store: { mcq: st.mcq || {}, solved: st.solved || {}, blocks: st.blocks || {}, actions } };
  return (
    <div className="container">
      <Link to="/" className="badge">← HUB</Link>
      <h1 className="page-title">Block lab</h1>
      <p className="dim">Every block type with a sample spec (source: <code>content/lab/*.json</code>). Answers here are stored under a throwaway lesson id.</p>
      {labs.map(l => (
        <section key={l.file} className="section">
          <div className="section-header"><span className="section-num">{l.file.split('/').pop()}</span><h2>{l.title}</h2></div>
          {(l.blocks || []).map((b, i) => <Block key={i} b={b} ctx={ctx} />)}
        </section>
      ))}
    </div>
  );
}
