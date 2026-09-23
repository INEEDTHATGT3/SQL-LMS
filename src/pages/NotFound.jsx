import { Link } from 'react-router-dom';
import { MODULES } from '../lib/subject.js';

export default function NotFound() {
  return (
    <div className="container center pt">
      <h1 className="big lvl-text">404</h1>
      <p className="dim">That lesson doesn’t exist.</p>
      <Link to="/" className="level-pill">← Back to Hub</Link>
      <div className="card mt left">
        <div className="card-title">ALL MODULES</div>
        <ul className="plain-list">
          {MODULES.map(m => <li key={m.id}><Link to={`/lesson/${m.id}/1`}>M{m.num} · {m.title}</Link></li>)}
        </ul>
      </div>
    </div>
  );
}
