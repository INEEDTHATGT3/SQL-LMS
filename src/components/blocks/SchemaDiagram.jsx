/* schema-diagram: pure-SVG table cards (PK/FK chips) + FK lines — no mermaid.
   Reads `b.spec ?? b`, so it works standalone and inside visual { kind }.
   Tables may be plain names; FK lines come from explicit relationships and
   from column-level fk "table.col" references. */
import './SchemaDiagram.css';

const CW = 264;   // card width
const HDR = 30;   // header height
const RH = 20;    // column row height
const PADB = 8;   // card bottom pad
const GY = 54;    // gap between stacked cards (FK lines run through it)
const CH0 = 286;  // first FK channel x
const CHSTEP = 16; // channel spacing per relationship

const normTables = t => (Array.isArray(t) ? t : [])
  .map(x => (typeof x === 'string' ? { name: x, columns: [] } : { name: x.name || '?', columns: x.columns || [] }));

/* "}o--||" / "||--o{" → " (N->1)" ; plain "1"/"N" strings get no suffix */
function cardSuffix(c) {
  if (typeof c !== 'string' || !c.includes('-')) return '';
  const l = c.slice(0, c.indexOf('-'));
  const r = c.slice(c.lastIndexOf('-') + 1);
  const f = p => (/[}{]/.test(p) ? 'N' : p.includes('|') ? (p.length > 1 ? '1' : '') : (p.length <= 2 ? p : ''));
  const a = f(l), b = f(r);
  return a && b ? ` (${a}->${b})` : '';
}

function buildRels(spec, cards) {
  const rels = [];
  const seen = new Set();
  const push = (from, to, label, card, fromCol) => {
    const key = `${from}>${to}`;
    if (!from || !to || seen.has(key)) return;
    seen.add(key);
    rels.push({ from, to, text: `${label || ''}${cardSuffix(card)}`.trim(), fromCol });
  };
  for (const r of Array.isArray(spec.relationships) ? spec.relationships : []) {
    push(r.from ?? r[0], r.to ?? r[1],
      r.label ?? (Array.isArray(r) ? r[2] : undefined),
      r.cardinality ?? (Array.isArray(r) ? r[3] : undefined), null);
  }
  for (const c of cards) {
    for (const col of c.columns) {
      if (col.fk) push(c.name, String(col.fk).split('.')[0], col.name, '', col.name);
    }
  }
  return rels;
}

export default function SchemaDiagram({ b }) {
  const spec = b.spec ?? b;
  const cards = normTables(spec.tables);
  if (!cards.length) return <div className="callout warn">schema-diagram block missing tables</div>;

  let y = 4;
  for (const c of cards) {
    c.x = 0;
    c.y = y;
    c.h = HDR + (c.columns.length ? c.columns.length * RH + PADB : 4);
    y += c.h + GY;
  }
  const H = y - GY + 4;

  const rels = buildRels(spec, cards).filter(r => cards.some(c => c.name === r.from) && cards.some(c => c.name === r.to));
  const labelX = CH0 + Math.max(rels.length - 1, 0) * CHSTEP + 10;
  const maxLen = rels.reduce((m, r) => Math.max(m, r.text.length), 0);
  const W = Math.max(300, labelX + maxLen * 6.4 + 10);

  const byName = new Map(cards.map(c => [c.name, c]));
  const rowY = (card, colName) => {
    const i = card.columns.findIndex(c => c.name === colName);
    return i < 0 ? null : card.y + HDR + i * RH + RH / 2;
  };
  const midY = card => card.y + card.h / 2;

  const label = `Schema diagram: ${cards.map(c => c.name).join(', ')} — ${rels.length} relationship${rels.length === 1 ? '' : 's'}`;

  return (
    <div className="blk schema-diagram">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {rels.map((r, i) => {
          const fc = byName.get(r.from);
          const tc = byName.get(r.to);
          const pk = tc.columns.find(c => c.pk);
          const sy = rowY(fc, r.fromCol) ?? midY(fc);
          const ty = (pk ? rowY(tc, pk.name) : null) ?? midY(tc);
          const cx = CH0 + i * CHSTEP;
          const sx = fc.x + CW;
          const tx = tc.x + CW;
          const ly = (sy + ty) / 2;
          return (
            <g key={`${r.from}>${r.to}`}>
              <path className="sd-line" d={`M ${sx} ${sy} H ${cx} V ${ty} H ${tx + 7}`} />
              <polygon className="sd-arrow" points={`${tx},${ty} ${tx + 7},${ty - 3.5} ${tx + 7},${ty + 3.5}`} />
              {r.text && (
                <>
                  <rect className="sd-label-bg" x={labelX - 3} y={ly - 9} width={r.text.length * 6.4 + 6} height={17} rx="3" />
                  <text className="sd-label" x={labelX} y={ly + 3}>{r.text}</text>
                </>
              )}
            </g>
          );
        })}
        {cards.map(card => (
          <g key={card.name} transform={`translate(${card.x},${card.y})`}>
            <rect className="sd-rect" width={CW} height={card.h} rx="6" />
            <path className="sd-hdr" d={`M6 0 H ${CW - 6} A6 6 0 0 1 ${CW} 6 V ${HDR} H 0 V 6 A6 6 0 0 1 6 0 Z`} />
            <text className="sd-name" x="12" y="20">{card.name}</text>
            {card.columns.map((col, i) => {
              const cy = HDR + i * RH + RH / 2;
              const chips = [col.pk && 'PK', col.fk && 'FK'].filter(Boolean);
              return (
                <g key={col.name + i}>
                  {chips.map((t, ci) => (
                    <g key={t}>
                      <rect className={t === 'PK' ? 'sd-pk' : 'sd-fk'} x={8 + ci * 24} y={cy - 6.5} width={20} height={13} rx="3" />
                      <text className="sd-chip-t" x={18 + ci * 24} y={cy + 3.5} textAnchor="middle">{t}</text>
                    </g>
                  ))}
                  <text className="sd-col" x={10 + chips.length * 24} y={cy + 3.5}>{col.name}</text>
                  {col.type && <text className="sd-type" x={CW - 10} y={cy + 3.5} textAnchor="end">{col.type}</text>}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
