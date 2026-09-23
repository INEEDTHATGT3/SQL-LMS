import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadLesson, lessonProblems } from '../lib/content.js';
import { moduleById, LEVEL_META, LEVEL_NUMS, MODULES, SUBJECT } from '../lib/subject.js';
import { useProgress, actions } from '../lib/progress.js';
import { qkey } from '../lib/qkey.js';
import { Block, Mcq } from '../components/blocks.jsx';
import NotesJournal from '../components/NotesJournal.jsx';
import NotFound from './NotFound.jsx';

function PlacementQuiz({ items, lessonId, store }) {
  const answered = items.filter(it => store.mcq[qkey(it.q)] !== undefined).length;
  const right = items.filter(it => store.mcq[qkey(it.q)] === it.answer).length;
  const total = items.length;
  return (
    <section className="section" id="placement">
      <div className="section-header"><span className="section-num">00 //</span><h2>Which layer am I?</h2></div>
      <p>Honest answers decide whether this file is your entry point.</p>
      {items.map((it, i) => <Mcq key={i} lessonId={lessonId} item={it} store={store} logWrong={false} />)}
      {answered === total && (
        <div className="placement-result">
          Score {right}/{total} —{' '}
          {right <= Math.floor(total / 3) ? 'START HERE - work this file top to bottom.'
            : right < total ? 'Skim early sections; focus patterns + problem set.'
            : 'Consider the NEXT level file for a challenge.'}
        </div>
      )}
    </section>
  );
}

/* HashRouter owns location.hash, so in-page jumps scroll instead of linking */
const jump = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Lesson() {
  const { moduleId, level } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const mod = moduleById(moduleId);
  const meta = LEVEL_META[+level];
  const progress = useProgress();
  const lessonId = `${moduleId}_L${level}`;
  const st = progress.lessons[lessonId] || {};

  useEffect(() => {
    let live = true;
    setLesson(null); setError(null);
    loadLesson(moduleId, level)
      .then(l => { if (live) setLesson(l); })
      .catch(e => { if (live) setError(e.message); });
    document.body.dataset.level = String(level);
    window.scrollTo(0, 0);
    return () => { live = false; };
  }, [moduleId, level]);

  if (!mod || !meta) return <NotFound />;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!lesson) return <div className="container"><p>Loading…</p></div>;

  const solvedCount = lessonProblems(lesson).filter(p => st.solved?.[p.id]).length;
  const store = { mcq: st.mcq || {}, solved: st.solved || {}, blocks: st.blocks || {}, actions };
  const ctx = { lessonId, store, level: +level };
  const modIdx = MODULES.indexOf(mod);
  const next = +level < Math.max(...LEVEL_NUMS)
    ? { to: `/lesson/${moduleId}/${+level + 1}`, label: `L${+level + 1} ${LEVEL_META[+level + 1].name}` }
    : MODULES[modIdx + 1] && { to: `/lesson/${MODULES[modIdx + 1].id}/1`, label: `M${MODULES[modIdx + 1].num} ${MODULES[modIdx + 1].title}` };

  return (<>
    <div className="hero">
      <div className="hero-watermark" aria-hidden="true">L{level}</div>
      <div className="badge-row">
        <Link to="/" className="badge">← HUB</Link>
        <span className="badge">MODULE {mod.num}</span>
        <span className="badge blue">L{level} · {meta.name}</span>
        {lesson.tagline && <span className="badge green">{lesson.tagline}</span>}
      </div>
      <h1>{lesson.title}</h1>
      <div className="promise">{meta.promise}</div>
      <LevelStrip moduleId={moduleId} level={+level} />
    </div>

    <nav className="toc" aria-label="Lesson sections">
      {lesson.sections.map((s, i) =>
        <button key={i} type="button" onClick={() => jump(`sec-${i}`)}>
          {String(i + 1).padStart(2, '0')} · {s.title.split('—')[0].trim()}
        </button>)}
      <button type="button" onClick={() => jump('revision')}>REV CARD</button>
    </nav>
    <div className="progress-wrap"><div className="progress-bar" id="pbar" /></div>
    <ScrollProgress />

    <div className="container">
      {mod.refs?.length > 0 && (
        <div className="callout blue refs">
          <strong>Learn it from:</strong>{' '}
          {mod.refs.map((r, i) => <span key={r.url}>{i > 0 && ' · '}<a href={r.url} target="_blank" rel="noopener noreferrer">{r.label}</a></span>)}
        </div>
      )}

      {lesson.placementQuiz?.length >= 5 &&
        <PlacementQuiz items={lesson.placementQuiz} lessonId={lessonId} store={store} />}

      {lesson.sections.map((s, i) => (
        <section key={i} className="section" id={`sec-${i}`}>
          <div className="section-header">
            <span className="section-num">{String(i + 1).padStart(2, '0')} {'//'}</span>
            <h2>{s.title}</h2>
          </div>
          {s.blocks.map((b, bi) => <Block key={bi} b={b} ctx={ctx} />)}
        </section>
      ))}

      <section className="section" id="revision">
        <div className="section-header">
          <span className="section-num">{String(lesson.sections.length + 1).padStart(2, '0')} {'//'}</span>
          <h2>60-second revision card</h2>
        </div>
        <div className="rev-card">
          <h4>RE-READ BEFORE THE INTERVIEW</h4>
          <ul>{lesson.revisionCard.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
        <h3>Glossary</h3>
        <div className="table-scroll"><table className="trace"><tbody>
          {lesson.glossary.map(g => (
            <tr key={g.term}><td className="term"><code>{g.term}</code></td><td>{g.def}</td></tr>
          ))}
        </tbody></table></div>
        <p className="dim">Solved problems: <strong className="ok">{solvedCount}</strong></p>
      </section>

      <NotesJournal lessonId={lessonId} />

      <div className="complete-box">
        <button className={st.complete ? 'done' : ''}
          onClick={() => actions.markComplete(lessonId, !st.complete)}>
          {st.complete ? '✓ COMPLETED' : 'MARK LESSON COMPLETE'}
        </button>
        <p className="dim">Completing a lesson schedules its revision card for spaced review.</p>
        {next && <p><Link to={next.to} className="level-pill">Next: {next.label} →</Link></p>}
      </div>
    </div>
    <div className="footer">{SUBJECT.name.toUpperCase()} LAYERED SYSTEM · MODULE {mod.num} · L{level} {meta.name}</div>
  </>);
}

function LevelStrip({ moduleId, level }) {
  const p = useProgress();
  return (
    <div className="level-strip">
      {LEVEL_NUMS.map(L => (
        <Link key={L} to={`/lesson/${moduleId}/${L}`}
          className={'level-pill' + (L === level ? ' current' : '') +
            (p.lessons[`${moduleId}_L${L}`]?.complete ? ' done' : '')}>
          {LEVEL_META[L].name}
        </Link>
      ))}
    </div>
  );
}

/* passive scroll listener writing straight to the DOM (no re-render) */
function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('pbar');
    if (!bar) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        bar.style.width = Math.min(100, h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
