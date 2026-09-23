import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEARCH_INDEX } from '../lib/content.js';
import { lessonPath } from '../lib/subject.js';

/* Search lessons, section titles, glossary terms, problem titles and patterns. */
export default function SearchBox() {
  const [qRaw, setQ] = useState('');
  const [q, setDeferred] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDeferred(qRaw), 150);
    return () => clearTimeout(id);
  }, [qRaw]);

  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return null;
    const hit = s => String(s || '').toLowerCase().includes(n);
    return SEARCH_INDEX.map(e => {
      const why = hit(e.title) || hit(e.tagline) || hit(e.module) ? null
        : e.sections.find(hit) || e.terms.find(hit)
        || e.problems.find(p => hit(p.t) || hit(p.pat))?.t;
      const any = why !== undefined;
      return any ? { ...e, why } : null;
    }).filter(Boolean);
  }, [q]);

  return (<>
    <input className="search" value={qRaw} onChange={e => setQ(e.target.value)} aria-label="Search"
      placeholder="Search lessons, sections, terms, problems, patterns..." />
    {results && (
      <div className="card mb">
        <div className="card-title">{results.length} RESULT{results.length === 1 ? '' : 'S'}</div>
        {results.length === 0 && <p className="dim small">No hits. Try a pattern name, term or problem title.</p>}
        {results.slice(0, 12).map(r => (
          <Link key={r.id} to={lessonPath(r.id)} className="search-hit">
            <strong className="lvl-text">L{r.level}</strong> {r.title}
            <span className="dim small"> · M{r.num} {r.module}{r.why ? ` · “${r.why}”` : ''}</span>
          </Link>
        ))}
        {results.length > 12 && <p className="dim small">…refine query to narrow</p>}
      </div>
    )}
  </>);
}
