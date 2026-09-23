import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProgress, srsActions } from '../lib/progress.js';
import { dueCards } from '../lib/srs.js';
import { loadLesson, lessonProblems } from '../lib/content.js';
import { splitLessonId, lessonPath } from '../lib/subject.js';
import { MD } from '../components/md.jsx';
import { CodeBlock } from '../components/blocks.jsx';

/* Review queue: prompt first, answer only after "Show answer" - recall, not re-reading. */
const RATING = [['Again', 0, 'bad'], ['Hard', 1, 'warn'], ['Good', 2, 'ok'], ['Easy', 3, 'easy']];

/* every flashcard reachable in a lesson, incl. glossary-harvested decks */
export function lessonFlashcards(lesson) {
  const out = [];
  for (const s of lesson.sections || [])
    for (const b of s.blocks || []) {
      if (b.type !== 'flashcards') continue;
      out.push(...(b.cards || []));
      if (b.fromGlossary) out.push(...(lesson.glossary || []).map(g => ({ id: g.term, front: g.term, back: g.def })));
    }
  return out;
}

export default function Review() {
  const p = useProgress();
  const due = useMemo(() => dueCards(p.srs), [p.srs]);
  const [data, setData] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const card = due[0];                      // rated card leaves the list, next slides in
  const cardId = card?.[0];
  const c = card?.[1];

  useEffect(() => {
    setRevealed(false); setData(null);
    if (!c) return;
    let live = true;
    loadLesson(...splitLessonId(c.ref.lessonId)).then(L => {
      if (!live) return;
      if (c.type === 'prob') setData({ lesson: L, problem: lessonProblems(L).find(x => x.id === c.ref.pid) });
      else if (c.type === 'fc') setData({ lesson: L, fc: lessonFlashcards(L).find(x => x.id === c.ref.cardId) });
      else setData({ lesson: L });
    }).catch(() => live && setData({ missing: true }));
    return () => { live = false; };
  }, [cardId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c) return (
    <div className="container center pt">
      <h1 className="ok big">✓ Queue clear</h1>
      <p className="dim">Nothing due today. Complete lessons, solve problems or rate flashcards to fill it.</p>
      <Link to="/" className="level-pill">← Hub</Link>
    </div>
  );

  const mistake = c.type === 'mis' ? p.mistakes.find(m => m.id === c.ref.mistakeId) : null;
  function rate(r) {
    if (c.type === 'mis' && r >= 2) srsActions.resolveMistake(c.ref.mistakeId);
    else srsActions.rate(cardId, r);
  }

  return (
    <div className="container pt">
      <div className="row-between mb">
        <Link to="/" className="badge">← HUB</Link>
        <span className="badge blue">{due.length} due</span>
      </div>
      <div className="card review-card">
        <div className="card-title">
          {{ rev: 'REVISION CARD', prob: 'PROBLEM', fc: 'FLASHCARD', mis: 'MISTAKE RETRY' }[c.type] || c.type} ·{' '}
          <Link to={lessonPath(c.ref.lessonId)}>{data?.lesson?.title || c.ref.lessonId}</Link>
          {c.lapses > 0 && <span className="bad-text"> · lapses {c.lapses}</span>}
        </div>

        <Prompt c={c} data={data} mistake={mistake} />
        {!revealed
          ? <button className="reveal-btn big-btn" onClick={() => setRevealed(true)}>Show answer</button>
          : <>
              <Answer c={c} data={data} mistake={mistake} />
              <div className="rating-row">
                {RATING.map(([label, val, cls]) => (
                  <button key={val} className={'reveal-btn rate-' + cls} onClick={() => rate(val)}>{label}</button>
                ))}
              </div>
            </>}
        <p className="dim small center">Answer from memory first. Again = see it again today; Good/Easy stretch the interval.</p>
      </div>
      <p className="dim small mono">next due {c.due}</p>
    </div>
  );
}

function Prompt({ c, data, mistake }) {
  if (data?.missing) return <p className="warn-text">This card’s lesson no longer exists — rate it to move on.</p>;
  if (c.type === 'mis') return mistake ? <p className="prompt"><MD text={mistake.q} /></p> : <p>Loading…</p>;
  if (!data) return <p>Loading…</p>;
  if (c.type === 'rev') return <p className="prompt">From memory: list the key ideas of <strong>{data.lesson.title}</strong> (L{data.lesson.level}).</p>;
  if (c.type === 'fc') return data.fc ? <p className="prompt"><MD text={data.fc.front} /></p> : <p className="warn-text">Card removed from lesson.</p>;
  const pr = data.problem;
  if (!pr) return <p className="warn-text">Problem removed from lesson.</p>;
  return (<>
    <div className="prob-name">{pr.title}</div>
    {pr.statement && <p><MD text={pr.statement} /></p>}
    <p className="dim small">Solve it on paper or in your head, then reveal.</p>
  </>);
}

function Answer({ c, data, mistake }) {
  if (c.type === 'mis') return <div className="rev-card">Correct answer: <MD text={mistake?.correctAnswer} /></div>;
  if (!data || data.missing) return null;
  if (c.type === 'rev') return <div className="rev-card"><ul>{(data.lesson.revisionCard || []).map((r, i) => <li key={i}>{r}</li>)}</ul></div>;
  if (c.type === 'fc') return data.fc ? <div className="rev-card"><MD text={data.fc.back} /></div> : null;
  const pr = data.problem;
  if (!pr) return null;
  return (<>
    {(pr.hints || []).map((h, i) => <div key={i} className="callout blue">Hint {i + 1}: <MD text={h} /></div>)}
    {pr.solutionCode && <CodeBlock b={pr.solutionCode} />}
    {pr.exercise?.solution && <CodeBlock b={{ label: 'reference solution', code: pr.exercise.solution }} />}
    {pr.url && <p><a href={pr.url} target="_blank" rel="noopener noreferrer">Open on {pr.platform} ↗</a></p>}
  </>);
}
