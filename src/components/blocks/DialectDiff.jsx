/* dialect-diff: one column per dialect the block actually carries, rendered
   with the shared Code highlighter; columns wrap, so phones stack them. A field
   that is empty or comment-only shows a "same as SQL" chip instead of an empty
   panel — any author note (comment lines) stays visible under the chip. */
import { Code, MD } from '../md.jsx';
import './DialectDiff.css';

const DIALECTS = [
  { id: 'sql', label: 'ANSI SQL', lang: 'sql' },
  { id: 'pg', label: 'PostgreSQL', lang: 'sql' },
  { id: 'mysql', label: 'MySQL', lang: 'sql' },
  { id: 'py-pandas', label: 'Python (pandas)', lang: 'py' },
  { id: 'py-sqlalchemy', label: 'Python (SQLAlchemy)', lang: 'py' },
];

/* empty, or every non-blank line is a -- / # comment */
function sameAsSQL(v) {
  const lines = String(v ?? '').split('\n').map(l => l.trim()).filter(Boolean);
  return lines.every(l => l.startsWith('--') || l.startsWith('#'));
}

export default function DialectDiff({ b }) {
  const avail = DIALECTS.filter(d => Object.prototype.hasOwnProperty.call(b, d.id));
  if (!avail.length) return <div className="callout warn">dialect-diff block missing dialect code</div>;
  return (
    <div className="blk dialect-diff">
      {b.title && <div className="blk-title">{b.title}</div>}
      <div className="dd-grid">
        {avail.map(d => {
          const v = String(b[d.id] ?? '');
          const same = sameAsSQL(v);
          return (
            <div className="dd-panel" key={d.id}>
              <div className="dd-head">
                <span className="badge">{d.label}</span>
                {same && <span className="dd-chip">same as SQL</span>}
              </div>
              {same
                ? (v.trim() && <p className="dd-note dim small">{v.trim()}</p>)
                : <Code code={v} lang={d.lang} />}
            </div>
          );
        })}
      </div>
      {b.note && <p className="dd-note dim small"><MD text={b.note} /></p>}
    </div>
  );
}
