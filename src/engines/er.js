/* ER diagram engine: map ER to relational tables (pure, no DOM).

   mapToTables(spec) returns { tables: [{ name, columns: [{ name, pk, fk }] }], minTables }
   
   Mapping rules (as specified):
   - strong/weak entity
   - 1:N, 1:1 total side, M:N
   - multivalued attributes
   - composite flattened
   - derived omitted
   - ISA table-per-subclass
   - recursive relationship
*/

function flattenAttrs(attrs = []) {
  const cols = [];
  for (const a of attrs) {
    if (a.composite && Array.isArray(a.composite)) {
      // composite flattened - add each component
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

function getEntityById(entities = [], id) {
  return entities.find(e => e.id === id);
}

export function mapToTables(spec = {}) {
  const entities = spec.entities || [];
  const relationships = spec.relationships || [];
  const isa = spec.isa || [];
  
  const tables = [];
  const tableMap = new Map(); // entityId -> table name
  
  // Handle ISA first - table-per-subclass
  for (const is of isa) {
    const parent = getEntityById(entities, is.parent);
    if (!parent) continue;
    const parentKeys = flattenAttrs(parent.attrs || []).filter(a => a.key);
    for (const childId of is.children || []) {
      const child = getEntityById(entities, childId);
      if (!child) continue;
      const childAttrs = flattenAttrs(child.attrs || []).filter(a => !a.derived && !a.multi);
      const cols = [];
      // Add parent keys as PK and FK
      for (const pk of parentKeys) {
        cols.push({ name: pk.name, pk: true, fk: { table: parent.label || parent.id, col: pk.name } });
      }
      // Add child-specific keys/attrs
      for (const ca of childAttrs) {
        if (ca.key || ca.partialKey) {
          cols.push({ name: ca.name, pk: true });
        } else {
          cols.push({ name: ca.name, pk: false });
        }
      }
      const tname = child.label || childId;
      tables.push({ name: tname, columns: cols });
      tableMap.set(childId, tname);
    }
    // Parent table
    if (!tableMap.has(is.parent)) {
      const parentAttrs = flattenAttrs(parent.attrs || []).filter(a => !a.derived && !a.multi);
      const cols = [];
      for (const pa of parentAttrs) {
        cols.push({ name: pa.name, pk: !!pa.key });
      }
      const tname = parent.label || is.parent;
      tables.push({ name: tname, columns: cols });
      tableMap.set(is.parent, tname);
    }
  }
  
  // Process regular entities
  for (const e of entities) {
    if (tableMap.has(e.id)) continue;
    const isChild = isa.some(is => (is.children || []).includes(e.id));
    if (isChild) continue;
    
    const attrs = flattenAttrs(e.attrs || []);
    const cols = [];
    // Handle multivalued attributes
    const multivalued = attrs.filter(a => a.multi && !a.derived);
    for (const m of multivalued) {
      const mcols = [];
      const ekeys = attrs.filter(a => a.key);
      for (const k of ekeys) {
        mcols.push({ name: k.name, pk: true, fk: { table: e.label || e.id, col: k.name } });
      }
      mcols.push({ name: m.name, pk: true });
      tables.push({ name: `${e.label || e.id}_${m.name}`, columns: mcols });
    }
    
    // Regular attributes
    const reg = attrs.filter(a => !a.multi && !a.derived);
    for (const r of reg) {
      cols.push({ name: r.name, pk: !!r.key || !!r.partialKey });
    }
    if (cols.length > 0 || e.weak) {
      tables.push({ name: e.label || e.id, columns: cols });
      tableMap.set(e.id, e.name || e.label || e.id);
    }
  }
  
  // Process relationships
  for (const rel of relationships) {
    const ends = rel.ends || [];
    if (ends.length !== 2) continue;
    const [e1, e2] = ends;
    const ent1 = getEntityById(entities, e1.entity);
    const ent2 = getEntityById(entities, e2.entity);
    if (!ent1 || !ent2) continue;
    
    const card1 = e1.card;
    const card2 = e2.card;
    const total1 = !!e1.total;
    const total2 = !!e2.total;
    
    // M:N
    if ((card1 === 'M' || card1 === 'N') && (card2 === 'M' || card2 === 'N')) {
      const jcols = [];
      const t1 = tableMap.get(ent1.id) || ent1.label || ent1.id;
      const t2 = tableMap.get(ent2.id) || ent2.label || ent2.id;
      const k1 = flattenAttrs(ent1.attrs || []).filter(a => a.key);
      const k2 = flattenAttrs(ent2.attrs || []).filter(a => a.key);
      for (const k of k1) {
        jcols.push({ name: k.name, pk: true, fk: { table: t1, col: k.name } });
      }
      for (const k of k2) {
        jcols.push({ name: k.name, pk: true, fk: { table: t2, col: k.name } });
      }
      for (const ra of rel.attrs || []) {
        jcols.push({ name: ra.name, pk: false });
      }
      tables.push({ name: rel.label || `${t1}_${t2}`, columns: jcols });
    }
    // 1:1
    else if (card1 === '1' && card2 === '1') {
      const t1 = tableMap.get(ent1.id) || ent1.label || ent1.id;
      const t2 = tableMap.get(ent2.id) || ent2.label || ent2.id;
      const k2 = flattenAttrs(ent2.attrs || []).filter(a => a.key);
      if (total1) {
        const tbl1 = tables.find(t => t.name === t1);
        if (tbl1) {
          for (const k of k2) {
            if (!tbl1.columns.find(c => c.name === k.name)) {
              tbl1.columns.push({ name: k.name, pk: false, fk: { table: t2, col: k.name } });
            }
          }
        }
      } else if (total2) {
        const tbl2 = tables.find(t => t.name === t2);
        if (tbl2) {
          const k1 = flattenAttrs(ent1.attrs || []).filter(a => a.key);
          for (const k of k1) {
            if (!tbl2.columns.find(c => c.name === k.name)) {
              tbl2.columns.push({ name: k.name, pk: false, fk: { table: t1, col: k.name } });
            }
          }
        }
      }
    }
    // 1:N
    else if ((card1 === '1' && (card2 === 'N' || card2 === 'M')) || 
             ((card1 === 'N' || card1 === 'M') && card2 === '1')) {
      const nSide = (card2 === 'N' || card2 === 'M') ? e2 : e1;
      const oneSide = (card2 === 'N' || card2 === 'M') ? e1 : e2;
      const nEnt = getEntityById(entities, nSide.entity);
      const oEnt = getEntityById(entities, oneSide.entity);
      const tN = tableMap.get(nEnt.id) || nEnt.label || nEnt.id;
      const t1 = tableMap.get(oEnt.id) || oEnt.label || oEnt.id;
      const k1 = flattenAttrs(oEnt.attrs || []).filter(a => a.key);
      const tblN = tables.find(t => t.name === tN);
      if (tblN) {
        for (const k of k1) {
          if (!tblN.columns.find(c => c.name === k.name)) {
            tblN.columns.push({ name: k.name, pk: false, fk: { table: t1, col: k.name } });
          }
        }
      }
    }
    // Weak entity
    if (rel.identifying) {
      const weakSide = ends.find(e => getEntityById(entities, e.entity)?.weak);
      const strongSide = ends.find(e => !getEntityById(entities, e.entity)?.weak);
      if (weakSide && strongSide) {
        const weakEnt = getEntityById(entities, weakSide.entity);
        const strongEnt = getEntityById(entities, strongSide.entity);
        const tWeak = tableMap.get(weakEnt.id) || weakEnt.label || weakEnt.id;
        const tStrong = tableMap.get(strongEnt.id) || strongEnt.label || strongEnt.id;
        const kStrong = flattenAttrs(strongEnt.attrs || []).filter(a => a.key);
        const tblWeak = tables.find(t => t.name === tWeak);
        if (tblWeak) {
          for (const k of kStrong) {
            const exists = tblWeak.columns.find(c => c.name === k.name);
            if (exists) {
              exists.pk = true;
              exists.fk = { table: tStrong, col: k.name };
            } else {
              tblWeak.columns.push({ name: k.name, pk: true, fk: { table: tStrong, col: k.name } });
            }
          }
          const wkeys = flattenAttrs(weakEnt.attrs || []).filter(a => a.partialKey || a.key);
          for (const wk of wkeys) {
            const exists = tblWeak.columns.find(c => c.name === wk.name);
            if (exists) exists.pk = true;
          }
        }
      }
    }
  }
  
  const seen = new Set();
  const finalTables = tables.map(t => {
    let name = t.name;
    let i = 1;
    while (seen.has(name)) {
      name = `${t.name}_${i}`;
    }
    seen.add(name);
    return { ...t, name };
  });
  
  return { tables: finalTables, minTables: finalTables.length };
}
