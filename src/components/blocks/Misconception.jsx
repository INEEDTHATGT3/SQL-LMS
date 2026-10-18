/* misconception: Tippett-style refutation text. Optional true/false poll first
   (commit before reading), then explicit cue -> refutation -> correct model ->
   evidence block. Poll answer stored as blocks['mis:' + qkey(claim)] = bool;
   believing the misconception is logged as a mistake so it comes back in Review. */
import { qkey } from '../../lib/qkey.js';
import { logMistake } from '../../lib/progress.js';
import { Block } from '../blocks.jsx';
import { MD } from '../md.jsx';
import { Source } from './Question.jsx';
import './Misconception.css';

export default function Misconception({ b, ctx }) {
  const key = 'mis:' + qkey(b.claim);
  const said = ctx.store.blocks?.[key];
  const voted = said !== undefined;
  const truth = b.verdict === true;               // a misconception is false unless stated
  const ask = b.askFirst !== false;
  const open = !ask || voted;
  const cue = b.cue || (truth ? 'This is actually true.' : 'This is false.');
  const vote = v => {
    if (voted) return;
    ctx.store.actions.saveBlock(ctx.lessonId, key, v);
    if (v !== truth) logMistake(ctx.lessonId, `True or false: ${b.claim}`, `${truth ? 'True' : 'False'}. ${b.correctModel || b.refutation}`);
  };
  return (
    <div className="blk mis">
      <div className="blk-title">Common misconception</div>
      <p className={'mis-claim' + (open && !truth ? ' refuted' : '')}>“<MD text={b.claim} />”</p>
      {ask && (
        <div className="action-row" role="group" aria-label="Is this claim true or false?">
          <span className="dim small">True or false?</span>
          {[true, false].map(v => (
            <button key={String(v)} type="button" className={'reveal-btn' + (said === v ? ' on' : '')}
              aria-pressed={said === v} aria-disabled={voted} onClick={() => vote(v)}>{v ? 'True' : 'False'}</button>
          ))}
        </div>)}
      <div aria-live="polite">
        {open && <>
          {voted && <p className={'small mono ' + (said === truth ? 'ok' : 'warn-text')}>
            {said === truth ? '✓ You called it.' : `✗ You said ${said ? 'true' : 'false'}. Most people do; read why.`}
          </p>}
          <div className={'callout ' + (truth ? 'blue' : 'red')}><strong>{cue}</strong> <MD text={b.refutation} /></div>
          {b.correctModel && <div className="callout"><strong>Correct model:</strong> <MD text={b.correctModel} /></div>}
        </>}
      </div>
      {open && b.evidence && (
        <div className="mis-evidence">
          <div className="blk-title">Evidence</div>
          <Block b={b.evidence} ctx={ctx} />
        </div>)}
      {open && <Source src={b.source} />}
    </div>
  );
}
