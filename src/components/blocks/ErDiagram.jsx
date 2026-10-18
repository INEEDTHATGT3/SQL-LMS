import { useState } from 'react';
import { qkey } from '../../lib/qkey.js';
import { isCorrect, answerKey } from '../../lib/grade.js';
import { logMistake } from '../../lib/progress.js';
import { mapToTables } from '../../engines/er.js';
import './ErDiagram.css';

function flattenAttrs(attrs = []) {
  const cols = [];
  for (const a of attrs) {
    if (a.composite && Array.isArray(a.composite)) {
      for (const c of a.composite) {
        cols.push({ name: c.name || c, key: !!c.key, partialKey: !!c.partialKey, multi: !!c.multi, derived: !!c.derived });
      }
    } else {
      cols.push({ 
        name: a.name, 
        key: !!a.key, 
        partialKey: !!a.partialKey, 
        multi: !!a.multi, 
        derived: !!a.derived 
      });
    }
  }
  return cols;
}

function getEntityById(entities, id) {
  return entities.find(e => e.id === id);
}

function TotalParticipationLines({ x, y, nx, ny, entW, entH }) {
  const offset = 5;
  return (
    <>
      <line x1={x + nx * (entW + offset)} y1={y + ny * (entH + offset)} 
            x2={x + nx * (entW + offset + 8)} y2={y + ny * (entH + offset + 8)} 
            className="line total" />
      <line x1={x + nx * (entW - offset)} y1={y + ny * (entH - offset)} 
            x2={x + nx * (entW - offset + 8)} y2={y + ny * (entH - offset + 8)} 
            className="line total" />
    </>
  );
}

function CrowFootTotalLines({ x, y, nx, ny, entW, entH }) {
  return (
    <>
      <line x1={x + nx * (entW + 3)} y1={y + ny * (entH + 3)} 
            x2={x + nx * (entW + 10)} y2={y + ny * (entH + 10)} className="cf-line total" />
      <line x1={x + nx * (entW - 3)} y1={y + ny * (entH - 3)} 
            x2={x + nx * (entW + 4)} y2={y + ny * (entH + 4)} className="cf-line total" />
    </>
  );
}

function CrowFootCrowFoot({ x, y, nx, ny }) {
  const px = -ny * 8;
  const py = nx * 8;
  const footX = x;
  const footY = y;
  return (
    <polyline points={`${footX},${footY} ${footX + px},${footY + py} ${footX},${footY} ${footX - px},${footY - py}`}
              className="cf-crowfoot" fill="none" stroke="var(--text)" strokeWidth="2" />
  );
}

export default function ErDiagram({ b, ctx }) {
  const askKey = b.ask ? qkey(b.ask.q) : null;
  const saved = askKey ? ctx?.store?.mcq?.[askKey] : undefined;
  const [ans, setAns] = useState(saved ?? null);
  const [show, setShow] = useState(saved != null);
  
  const spec = b.spec || b;
  const notation = spec.notation || 'chen';
  const entities = spec.entities || [];
  const relationships = spec.relationships || [];
  const isa = spec.isa || [];
  const layout = spec.layout || {};
  const mapping = spec.mapping;
  
  const getPos = (id) => {
    if (layout[id]) return layout[id];
    const idx = entities.findIndex(e => e.id === id);
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    // Chen needs room for attribute ovals around each entity
    return notation === 'chen' ? [col * 460 + 230, row * 380 + 200] : [col * 220 + 120, row * 180 + 100];
  };

  // Directions already used by relationship lines (and an ISA triangle below a parent).
  const busyAngles = (id) => [
    ...relationships.flatMap(r => {
      const ids = (r.ends || []).map(x => x.entity);
      if (ids.length !== 2 || !ids.includes(id)) return [];
      const [x1, y1] = getPos(id);
      const [x2, y2] = getPos(ids[0] === id ? ids[1] : ids[0]);
      return [Math.atan2(y2 - y1, x2 - x1)];
    }),
    ...(isa.some(i => i.parent === id) ? [Math.PI / 2] : []),
  ];
  // Spread n attribute ovals evenly over the free directions (15° slots, 36° clear of busy ones).
  const attrAngles = (id, n) => {
    const busy = busyAngles(id);
    const gap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    let slots = [...Array(24).keys()].map(k => -Math.PI / 2 + (k * Math.PI) / 12)
      .filter(s => busy.every(r => gap(s, r) > Math.PI / 5));
    if (!slots.length) slots = [-Math.PI / 2];
    return [...Array(n).keys()].map(i => slots[Math.floor(((i + 0.5) * slots.length) / n)]);
  };
  const ovalRx = name => Math.max(45, String(name).length * 4.6 + 16);

  const renderChen = () => {
    const under = [];   // connector lines, drawn first so shapes sit on top
    const elements = [];
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    const fit = (x, y, rx, ry) => {
      minX = Math.min(minX, x - rx); minY = Math.min(minY, y - ry);
      maxX = Math.max(maxX, x + rx); maxY = Math.max(maxY, y + ry);
    };
    const oval = (key, a, cx, cy) => {
      const rx = ovalRx(a.name);
      fit(cx, cy, rx, 22);
      return (
        <g key={key}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={22}
                   className={`attr-oval ${a.multi ? 'multi' : ''} ${a.derived ? 'derived' : ''}`} />
          <text x={cx} y={cy + 4} className="attr-label">{a.name}</text>
          {(a.key || a.partialKey) && (
            <line x1={cx - rx + 18} y1={cy + 12} x2={cx + rx - 18} y2={cy + 12}
                  className={a.partialKey ? 'key-underline partial-key' : 'key-underline'} />
          )}
        </g>
      );
    };

    // Render entities
    for (const e of entities) {
      const [x, y] = getPos(e.id);
      const w = 100, h = 50;
      const isWeak = !!e.weak;

      // Entity rectangle (double for weak)
      elements.push(
        <g key={`entity-${e.id}`}>
          <rect x={x - w/2} y={y - h/2} width={w} height={h}
                className={isWeak ? 'entity-rect weak' : 'entity-rect'}
                role="img" aria-label={e.label || e.id} />
          {isWeak && (
            <rect x={x - w/2 + 4} y={y - h/2 + 4} width={w - 8} height={h - 8}
                  className="entity-rect weak-inner" />
          )}
          <text x={x} y={y + 5} className="label">{e.label || e.id}</text>
        </g>
      );
      fit(x, y, w / 2, h / 2);

      // Attributes: one oval per top-level attribute; composite parts branch off their parent
      const attrs = (e.attrs || []).map(a => (typeof a === 'string' ? { name: a } : a));
      const angles = attrAngles(e.id, attrs.length);
      const rX = 135 + Math.max(0, attrs.length - 4) * 14;
      const rY = 95 + Math.max(0, attrs.length - 4) * 10;
      attrs.forEach((a, i) => {
        const t = angles[i];
        const ax = x + Math.cos(t) * rX, ay = y + Math.sin(t) * rY;
        under.push(<line key={`attr-line-${e.id}-${i}`} x1={x} y1={y} x2={ax} y2={ay} className="line" />);
        elements.push(oval(`attr-${e.id}-${i}`, a, ax, ay));
        const parts = Array.isArray(a.composite) ? a.composite.map(c => (typeof c === 'string' ? { name: c } : c)) : [];
        parts.forEach((c, j) => {
          const tj = t + (j - (parts.length - 1) / 2) * 0.42;
          const cx = x + Math.cos(tj) * rX * 1.85, cy = y + Math.sin(tj) * rY * 1.85;
          under.push(<line key={`part-line-${e.id}-${i}-${j}`} x1={ax} y1={ay} x2={cx} y2={cy} className="line" />);
          elements.push(oval(`part-${e.id}-${i}-${j}`, c, cx, cy));
        });
      });
    }
    
    // Render relationships
    for (const rel of relationships) {
      const ends = rel.ends || [];
      if (ends.length !== 2) continue;
      const [e1, e2] = ends;
      const ent1 = getEntityById(entities, e1.entity);
      const ent2 = getEntityById(entities, e2.entity);
      if (!ent1 || !ent2) continue;
      
      const [x1, y1] = getPos(e1.entity);
      const [x2, y2] = getPos(e2.entity);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      
      const d = 40; // diamond half-size
      const isIdentifying = !!rel.identifying;
      const ent1W = 50, ent1H = 25;
      const ent2W = 50, ent2H = 25;
      const lineStartX1 = x1 + nx * ent1W;
      const lineStartY1 = y1 + ny * ent1H;
      const lineEndX1 = cx - nx * d;
      const lineEndY1 = cy - ny * d;
      const lineStartX2 = x2 - nx * ent2W;
      const lineStartY2 = y2 - ny * ent2H;
      const lineEndX2 = cx + nx * d;
      const lineEndY2 = cy + ny * d;
      
      elements.push(
        <g key={`rel-${rel.id}`}>
          {/* Diamond - double for identifying */}
          <polygon points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
                   className={`relation-diamond ${isIdentifying ? 'identifying' : ''}`} />
          {isIdentifying && (
            <polygon points={`${cx},${cy - d + 4} ${cx + d - 4},${cy} ${cx},${cy + d - 4} ${cx - d + 4},${cy}`}
                     className="relation-diamond identifying-inner" />
          )}
          <text x={cx} y={cy + 5} className="label">{rel.label || rel.id}</text>
          
          {/* Lines from entities to diamond */}
          <line x1={lineStartX1} y1={lineStartY1} x2={lineEndX1} y2={lineEndY1} className="line" />
          <line x1={lineStartX2} y1={lineStartY2} x2={lineEndX2} y2={lineEndY2} className="line" />
          
          {/* Cardinality labels */}
          <text x={x1 + nx * 70} y={y1 + ny * 45} className="card-label">{e1.card}</text>
          <text x={x2 - nx * 70} y={y2 - ny * 45} className="card-label">{e2.card}</text>
          
          {/* Total participation (double line) */}
          {e1.total && <TotalParticipationLines x={x1} y={y1} nx={nx} ny={ny} entW={ent1W} entH={ent1H} />}
          {e2.total && <TotalParticipationLines x={x2} y={y2} nx={-nx} ny={-ny} entW={ent2W} entH={ent2H} />}
        </g>
      );
      fit(cx, cy, d, d);
    }
    
    // Render ISA hierarchies
    for (const is of isa) {
      const [px, py] = getPos(is.parent);
      const children = is.children || [];
      if (children.length === 0) continue;
      const cy = py + 120;
      const startX = px - (children.length - 1) * 100;
      
      const isaElements = [
        <polygon key={`isa-triangle-${is.parent}`} points={`${px},${py + 60} ${px - 30},${cy - 20} ${px + 30},${cy - 20}`}
                 className="isa-triangle" />,
        <text key={`isa-label-${is.parent}`} x={px} y={cy - 30} className="card-label">ISA</text>
      ];
      
      children.forEach((cid, i) => {
        const childEnt = getEntityById(entities, cid);
        const cx = startX + i * 200;
        const cy2 = cy + 80;
        
        isaElements.push(
          <line key={`isa-line-${cid}`} x1={px} y1={cy - 20} x2={cx} y2={cy2 - 30} className="line" />
        );
        
        isaElements.push(
          <g key={`isa-child-${cid}`}>
            <rect x={cx - 50} y={cy2 - 30} width={100} height={50} className="entity-rect" />
            <text x={cx} y={cy2 - 5} className="label">{childEnt?.label || cid}</text>
          </g>
        );
        fit(cx, cy2 - 5, 50, 25);
      });
      
      elements.push(<g key={`isa-${is.parent}`}>{isaElements}</g>);
    }
    
    const pad = 24;
    return { elements: [...under, ...elements], x0: minX - pad, y0: minY - pad,
             width: maxX - minX + 2 * pad, height: maxY - minY + 2 * pad };
  };
  
  const renderCrowsFoot = () => {
    const elements = [];
    let maxY = 0;
    let maxX = 0;
    
    // Render entities as rectangles
    for (const e of entities) {
      const [x, y] = getPos(e.id);
      const w = 140, h = 60;
      
      elements.push(
        <g key={`cf-entity-${e.id}`}>
          <rect x={x - w/2} y={y - h/2} width={w} height={h} className="cf-entity-rect" />
          <text x={x} y={y - h/2 - 10} className="cf-entity-label">{e.label || e.id}</text>
        </g>
      );
      maxX = Math.max(maxX, x + w/2);
      maxY = Math.max(maxY, y + h/2);
      
      // Attributes inside entity box for crow's foot
      const attrs = flattenAttrs(e.attrs || []);
      attrs.forEach((a, i) => {
        const ay = y - h/2 + 25 + i * 22;
        elements.push(
          <g key={`cf-attr-${e.id}-${i}`}>
            <text x={x - w/2 + 10} y={ay} className="cf-attr-text">
              {a.key ? 'PK ' : a.partialKey ? 'PK(part) ' : ''}{a.name}
            </text>
            {a.multi && <text x={x + w/2 - 30} y={ay} className="cf-attr-multi">[M]</text>}
            {a.derived && <text x={x + w/2 - 50} y={ay} className="cf-attr-derived">[D]</text>}
          </g>
        );
      });
      maxY = Math.max(maxY, y + h/2 + attrs.length * 22);
    }
    
    // Render relationships as lines with crow's foot symbols
    for (const rel of relationships) {
      const ends = rel.ends || [];
      if (ends.length !== 2) continue;
      const [e1, e2] = ends;
      const ent1 = getEntityById(entities, e1.entity);
      const ent2 = getEntityById(entities, e2.entity);
      if (!ent1 || !ent2) continue;
      
      const [x1, y1] = getPos(e1.entity);
      const [x2, y2] = getPos(e2.entity);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      
      const w = 70, h = 30;
      const lineStartX1 = x1 + nx * (w/2);
      const lineStartY1 = y1 + ny * (h/2);
      const lineEndX1 = cx - nx * 20;
      const lineEndY1 = cy - ny * 20;
      const lineStartX2 = x2 - nx * (w/2);
      const lineStartY2 = y2 - ny * (h/2);
      const lineEndX2 = cx + nx * 20;
      const lineEndY2 = cy + ny * 20;
      
      const e1Card = e1.card === '1' ? '1' : e1.card === 'N' ? 'N' : 'M';
      const e2Card = e2.card === '1' ? '1' : e2.card === 'N' ? 'N' : 'M';
      
      elements.push(
        <g key={`cf-rel-${rel.id}`}>
          {/* Main relationship line */}
          <line x1={lineStartX1} y1={lineStartY1} x2={lineEndX1} y2={lineEndY1} className="cf-line" />
          <line x1={lineStartX2} y1={lineStartY2} x2={lineEndX2} y2={lineEndY2} className="cf-line" />
          
          {/* Cardinality markers */}
          <text x={x1 + nx * (w/2 + 15)} y={y1 + ny * (h/2 + 15)} className="cf-card">{e1Card}</text>
          <text x={x2 - nx * (w/2 + 15)} y={y2 - ny * (h/2 + 15)} className="cf-card">{e2Card}</text>
          
          {/* Crow's foot at entity 2 side if N or M */}
          {(e2.card === 'N' || e2.card === 'M') && (
            <CrowFootCrowFoot x={x2 - nx * (w/2 + 5)} y={y2 - ny * (h/2 + 5)} nx={nx} ny={ny} />
          )}
          
          {/* Crow's foot at entity 1 side if N or M */}
          {(e1.card === 'N' || e1.card === 'M') && (
            <CrowFootCrowFoot x={x1 + nx * (w/2 + 5)} y={y1 + ny * (h/2 + 5)} nx={-nx} ny={-ny} />
          )}
          
          {/* Relationship label */}
          <text x={cx} y={cy - 10} className="cf-rel-label">{rel.label || rel.id}</text>
          
          {/* Total participation - double line near entity */}
          {e1.total && <CrowFootTotalLines x={x1} y={y1} nx={nx} ny={ny} entW={w/2} entH={h/2} />}
          {e2.total && <CrowFootTotalLines x={x2} y={y2} nx={-nx} ny={-ny} entW={w/2} entH={h/2} />}
        </g>
      );
      maxX = Math.max(maxX, Math.max(x1, x2) + w/2);
      maxY = Math.max(maxY, Math.max(y1, y2) + h/2);
    }
    
    // ISA in crow's foot - simplified
    for (const is of isa) {
      const [px, py] = getPos(is.parent);
      const children = is.children || [];
      if (children.length === 0) continue;
      const cy = py + 140;
      const startX = px - (children.length - 1) * 120;
      
      elements.push(
        <g key={`cf-isa-${is.parent}`}>
          <text x={px} y={py + 80} className="cf-card">ISA</text>
          {children.map((cid, i) => {
            const cx = startX + i * 240;
            const cy2 = cy + 60;
            return (
              <line key={`cf-isa-line-${cid}`} x1={px} y1={py + 90} x2={cx} y2={cy2 - 30} className="cf-line" />
            );
          })}
        </g>
      );
    }
    
    return { elements, x0: 0, y0: 0, width: Math.max(600, maxX + 80), height: Math.max(500, maxY + 80) };
  };
  
  const { elements, x0, y0, width, height } = (notation === 'crowsfoot') ? renderCrowsFoot() : renderChen();
  const mappingResult = mapping ? mapToTables(spec) : null;
  
  const submit = () => {
    if (!b.ask) return;
    const ak = answerKey(b.ask);
    const ok = isCorrect(ak, ans);
    if (ans == null) return;
    ctx?.store?.actions?.recordAnswer?.(ctx.lessonId, askKey, ans);
    if (!ok) logMistake(ctx?.lessonId, b.ask.q, b.ask.options?.[b.ask.answer] ?? b.ask.explain ?? "");
    setShow(true);
  };
  
  return (
    <div className="blk er-diagram">
      {b.title && <h3 className="blk-title">{b.title}</h3>}
      <div className="er-diagram">
        <svg viewBox={`${x0} ${y0} ${width} ${height}`} width={width} className="er-svg" role="img" aria-label="ER diagram">
          {elements}
        </svg>
      </div>
      {mapping && mappingResult && (
        <div className="mapping">
          <h4>Relational Mapping (Tables)</h4>
          <div className="table-scroll">
            {mappingResult.tables.map((t, i) => (
              <div key={i} style={{ marginBottom: '1rem' }}>
                <strong>{t.name}</strong>
                <table className="mapping-table">
                  <thead>
                    <tr><th>Column</th><th>PK</th><th>FK</th></tr>
                  </thead>
                  <tbody>
                    {t.columns.map((c, j) => (
                      <tr key={j}>
                        <td>{c.name}</td>
                        <td>{c.pk ? '✓' : ''}</td>
                        <td>{c.fk ? `${c.fk.table}.${c.fk.col}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div><strong>Min tables:</strong> {mappingResult.minTables}</div>
          </div>
        </div>
      )}
      {b.ask && (
        <div className="quiz-card">
          <div className="quiz-q">{b.ask.q}</div>
          {b.ask.kind === 'mcq' && b.ask.options && (
            <div className="quiz-opts">
              {b.ask.options.map((opt, i) => (
                <label key={i} className="quiz-opt">
                  <input type="radio" name={qkey(b.ask.q)} checked={ans === i} onChange={() => setAns(i)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
          <div className="action-row">
            <button type="button" className="reveal-btn" onClick={submit}>Submit</button>
            {show && (
              <span className={isCorrect(answerKey(b.ask), ans) ? 'ok' : 'bad-text'}>
                {isCorrect(answerKey(b.ask), ans) ? 'Correct' : 'Incorrect'}
              </span>
            )}
          </div>
          {show && b.ask.explain && <div className="callout">{b.ask.explain}</div>}
        </div>
      )}
    </div>
  );
}