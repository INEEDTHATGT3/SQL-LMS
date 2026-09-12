/**
 * Custom block: schema-diagram
 * Renders Mermaid ERD diagram for table relationships
 */

export default function renderSchemaDiagram(block, sectionKey, skillConfig) {
  const { spec } = block;
  const { tables = [], relationships = [], direction = 'TB' } = spec || {};
  
  if (!tables.length) {
    return `<div class="callout warn">schema-diagram block missing tables</div>`;
  }

  // Build Mermaid ERD syntax
  let mermaid = `erDiagram\n`;
  
  // Define entities
  tables.forEach(table => {
    const name = table.name || table;
    const columns = table.columns || [];
    mermaid += `  ${name} {\n`;
    if (columns.length) {
      columns.forEach(col => {
        const pk = col.pk ? ' PK' : '';
        const fk = col.fk ? ' FK' : '';
        const nullable = col.nullable === false ? ' NOT NULL' : '';
        mermaid += `    ${col.type || 'string'} ${col.name}${pk}${fk}${nullable}\n`;
      });
    }
    mermaid += `  }\n`;
  });
  
  // Define relationships
  relationships.forEach(rel => {
    const from = rel.from || rel[0];
    const to = rel.to || rel[1];
    const label = rel.label || '';
    const card = rel.cardinality || '||--o{';
    mermaid += `  ${from} ${card} ${to} : "${label}"\n`;
  });

  const id = `erd-${Date.now().toString(36)}`;
  
  return `
<div class="code-block">
  <div class="code-label"><span>Schema Diagram</span></div>
  <div class="mermaid" id="${id}">${mermaid}</div>
  <script>
    if (typeof mermaid !== 'undefined') {
      mermaid.init(undefined, document.getElementById('${id}'));
    } else {
      document.getElementById('${id}').innerHTML = '<div class="callout warn">mermaid.js not loaded</div>';
    }
  </script>
</div>`;
}