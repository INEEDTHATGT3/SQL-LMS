/* explain-back: write the idea in your own words, then compare with the model
   answer. State lives in blocks['eb:' + qkey(prompt)] = { text, done, ticks, score }.
   score = ticked rubric weight / total; with no rubric it is the share of
   mustMention terms used. Below 50% the prompt is logged as a mistake. */
import { useEffect, useId, useState } from 'react';
import { qkey } from '../../lib/qkey.js';
import { logMistake } from '../../lib/progress.js';
import { keywordHits, rubricScore, wordCount } from '../../engines/recall.js';
import { MD } from '../md.jsx';
import './ExplainBack.css';

const excerpt = s => (s.length > 280 ? s.slice(0, 277) + '…' : s);

export default function ExplainBack({ b, ctx }) {
  const key = 'eb:' + qkey(b.prompt);
  const st = ctx.store.blocks?.[key] || {};
  const save = patch => ctx.store.actions.saveBlock(ctx.lessonId, key, { ...st, ...patch });
  const [text, setText] = useState(st.text || '');
  const [ticks, setTicks] = useState(st.ticks || []);
  const id = useId();
  const min = b.minWords ?? 40;
  const n = wordCount(text);
  const terms = b.mustMention || [];
  const rubric = b.rubric || [];
  const graded = typeof st.score === 'number';

  // debounced draft save (+ flush on blur); ponytail: rewrites the whole progress blob, fine at this size
  useEffect(() => {
    if (st.done || text === (st.text || '')) return;
    const t = setTimeout(() => save({ text }), 600);
    return () => clearTimeout(t);
  }, [text, st.done]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (patch, score) => {
    save({ text, ...patch, score });
    if (score < 0.5) logMistake(ctx.lessonId, b.prompt, excerpt(String(b.modelAnswer)));
  };
  const submit = () => {
    if (rubric.length || !terms.length) return save({ text, done: true });
    finish({ done: true }, keywordHits(text, terms).hit.length / terms.length);
  };
  const toggle = i => setTicks(t => (t.includes(i) ? t.filter(x => x !== i) : [...t, i]));
  const hits = keywordHits(st.text || text, terms);

  return (
    <div className="blk">
      <div className="blk-title">Explain it back</div>
      <div className="quiz-q" id={id + '-q'}><MD text={b.prompt} /></div>
      <textarea className="eb-text" value={text} readOnly={!!st.done} aria-labelledby={id + '-q'} aria-describedby={id + '-n'}
        placeholder="Explain it as if to a classmate who missed the lecture. No peeking."
        onChange={e => setText(e.target.value)}
        onBlur={() => !st.done && text !== (st.text || '') && save({ text })} />
      <div className="action-row">
        <span id={id + '-n'} className={'mono small ' + (n >= min ? 'ok' : 'dim')}>{n}/{min} words</span>
        {!st.done && <button type="button" className="reveal-btn" disabled={n < min} onClick={submit}>Submit</button>}
      </div>

      {st.done && <>
        {terms.length > 0 && (
          <div className="eb-hits">
            <span className="dim small">Key terms:</span>
            {terms.map(t => {
              const on = hits.hit.includes(t);
              return (
                <span key={t} className={'eb-chip ' + (on ? 'ok' : 'bad-text')}>
                  <span aria-hidden="true">{on ? '✓' : '✗'} </span><span className="sr-only">{on ? 'used' : 'missing'}: </span>{t}
                </span>);
            })}
          </div>)}
        <div className="rev-card"><div className="blk-title">Model answer</div><MD text={b.modelAnswer} /></div>
        {rubric.length > 0 && (
          <fieldset className="eb-rubric" disabled={graded}>
            <legend className="dim small">Tick only what your answer actually covered</legend>
            {rubric.map((r, i) => (
              <label key={i}>
                <input type="checkbox" checked={(graded ? st.ticks || [] : ticks).includes(i)} onChange={() => toggle(i)} />
                <span className="grow"><MD text={r.point} /></span>
                {r.weight != null && r.weight !== 1 && <span className="dim small mono">×{r.weight}</span>}
              </label>))}
          </fieldset>)}
        {rubric.length > 0 && !graded && (
          <div className="action-row">
            <button type="button" className="reveal-btn" onClick={() => finish({ ticks }, rubricScore(rubric, ticks))}>Save self-score</button>
            <span className="mono small dim">{Math.round(rubricScore(rubric, ticks) * 100)}%</span>
          </div>)}
        <div aria-live="polite">
          {graded && <div className={'verdict ' + (st.score >= 0.5 ? 'ok' : 'bad')}>
            SCORE {Math.round(st.score * 100)}%{st.score < 0.5 ? ' · added to your review queue' : ''}
          </div>}
        </div>
      </>}
    </div>
  );
}
