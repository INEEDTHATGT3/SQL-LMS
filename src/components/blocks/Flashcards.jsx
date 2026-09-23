/* flashcards: flip (or type first), then self-rate Again/Hard/Good/Easy.
   Each rating enrolls the card in SRS as fc:<lessonId>:<card.id>; Review
   finds it again via lessonFlashcards() (glossary cards use id = term). */
import { useEffect, useMemo, useRef, useState } from 'react';
import { srsActions } from '../../lib/progress.js';
import { loadLesson } from '../../lib/content.js';
import { splitLessonId } from '../../lib/subject.js';
import { shuffledOrder } from '../../lib/grade.js';
import { overlap } from '../../engines/recall.js';
import { MD } from '../md.jsx';
import './Flashcards.css';

const RATING = [['Again', 0, 'bad'], ['Hard', 1, 'warn'], ['Good', 2, 'ok'], ['Easy', 3, 'easy']];

export default function Flashcards({ b, ctx }) {
  const [gloss, setGloss] = useState(b.fromGlossary ? null : []);   // null = loading
  useEffect(() => {
    if (!b.fromGlossary) return;
    let live = true;
    loadLesson(...splitLessonId(ctx.lessonId))
      .then(L => live && setGloss((L.glossary || []).map(g => ({ id: g.term, front: g.term, back: g.def }))))
      .catch(() => live && setGloss([]));
    return () => { live = false; };
  }, [b.fromGlossary, ctx.lessonId]);

  const cards = useMemo(() => {
    const seen = new Set();
    return [...(b.cards || []), ...(gloss || [])].filter(c => !seen.has(c.id) && seen.add(c.id));
  }, [b.cards, gloss]);

  const [order, setOrder] = useState(null);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState('');
  const box = useRef(null), input = useRef(null);
  const typeMode = b.mode === 'type';
  const seq = order?.length === cards.length ? order : cards.map((_, i) => i);
  const card = cards[seq[pos]];

  const reset = next => {
    setPos(next); setFlipped(false); setTyped('');
    // keep keyboard shortcuts alive after the clicked button unmounts
    setTimeout(() => (typeMode && input.current ? input.current : box.current)?.focus(), 0);
  };
  const rate = r => { srsActions.rateFlashcard(ctx.lessonId, card.id, r); reset(pos + 1); };
  const shuffle = () => { setOrder(shuffledOrder(cards.length, Math.random().toString(16).slice(2, 10))); reset(0); };
  const onKey = e => {
    if (!card || e.target.closest('input, textarea, select')) return;
    if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); setFlipped(f => !f); }
    else if (flipped && ['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); rate(Number(e.key) - 1); }
  };

  const title = <span className="blk-title">Flashcards{b.deck ? ` · ${b.deck}` : ''}</span>;
  if (gloss === null) return <div className="blk">{title}<p className="block-loading">loading glossary…</p></div>;
  if (!cards.length) return <div className="blk">{title}<p className="dim small">No cards{b.fromGlossary ? ' — this lesson has no glossary.' : '.'}</p></div>;

  return (
    <div className="blk fc" ref={box} tabIndex={-1} onKeyDown={onKey}>
      <div className="row-between">
        {title}
        <span className="action-row fc-tools">
          <span className="mono small dim" aria-live="polite">{card ? `card ${pos + 1}/${cards.length}` : `${cards.length}/${cards.length} done`}</span>
          <button type="button" className="reveal-btn" onClick={shuffle}>Shuffle</button>
        </span>
      </div>

      {!card ? (
        <div className="fc-card">
          <p className="ok">Deck done. Rated cards are now in your review queue.</p>
          <button type="button" className="reveal-btn" onClick={() => reset(0)}>Go again</button>
        </div>
      ) : (<>
        <div className={'fc-card' + (flipped ? ' flipped' : '')} onClick={() => !typeMode && setFlipped(f => !f)}>
          <div className="fc-front"><MD text={card.front} /></div>
          <div aria-live="polite">
            {flipped && <div className="fc-back"><MD text={card.back} /></div>}
            {flipped && typeMode && (
              <p className="small mono">
                {typed.trim() ? <>you wrote: <MD text={typed} /> · </> : 'no answer typed · '}
                <span className={overlap(typed, card.back) >= 0.5 ? 'ok' : 'warn-text'}>
                  {Math.round(overlap(typed, card.back) * 100)}% keyword overlap
                </span>
              </p>)}
          </div>
        </div>

        {!flipped && typeMode && (
          <form className="action-row" onSubmit={e => { e.preventDefault(); setFlipped(true); }}>
            <input ref={input} type="text" className="fc-input" value={typed} autoComplete="off"
              aria-label="Your answer" placeholder="type the answer from memory"
              onChange={e => setTyped(e.target.value)} />
            <button type="submit" className="reveal-btn">Check</button>
          </form>)}
        {!flipped && !typeMode && (
          <div className="action-row">
            <button type="button" className="reveal-btn" onClick={() => setFlipped(true)}>Show answer</button>
            <span className="dim small">or press space</span>
          </div>)}
        {flipped && (
          <div className="rating-row" role="group" aria-label="How well did you recall it?">
            {RATING.map(([label, v, cls]) => (
              <button key={v} type="button" className={'reveal-btn rate-' + cls} onClick={() => rate(v)}>
                <span className="dim">{v + 1}</span> {label}
              </button>))}
          </div>)}
      </>)}
      <p className="dim small fc-keys">Keys: space flip · 1–4 rate</p>
    </div>
  );
}
