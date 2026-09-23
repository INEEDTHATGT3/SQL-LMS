import { MODULES, LEVEL_NUMS } from '../lib/subject.js';

/* module + tier pickers shared by interview and sprint setup screens */
export default function PoolFilters({ mod, setMod, tier, setTier }) {
  return (<>
    <label className="field">
      <span className="card-title">MODULE</span>
      <select value={mod} onChange={e => setMod(e.target.value)}>
        <option value="all">All modules</option>
        {MODULES.map(m => <option key={m.id} value={m.id}>{m.num} {m.title}</option>)}
      </select>
    </label>
    <label className="field">
      <span className="card-title">DIFFICULTY TIER</span>
      <select value={tier} onChange={e => setTier(e.target.value)}>
        <option value="any">Any</option>
        {LEVEL_NUMS.map(t => <option key={t} value={t}>L{t} only</option>)}
      </select>
    </label>
  </>);
}
