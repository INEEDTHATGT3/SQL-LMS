/**
 * Custom block: table-diff
 * Renders before/after data tables with diff highlighting
 */

export default function renderTableDiff(block, sectionKey, skillConfig) {
  const { before = [], after = [], highlight = [], caption = '' } = block;
  
  if (!before.length && !after.length) {
    return `<div class="callout warn">table-diff block missing data</div>`;
  }

  // Get all columns from both datasets
  const allCols = new Set();
  [...before, ...after].forEach(row => Object.keys(row).forEach(k => allCols.add(k)));
  const columns = Array.from(allCols);

  function renderTable(data, label) {
    if (!data.length) return `<p class="callout" style="font-size:12px;">${label}: (empty)</p>`;
    
    let html = `<div class="table-diff-container">
      <div class="table-diff-caption">${label}</div>
      <table class="table-diff"><thead><tr>`;
    columns.forEach(col => {
      const isHighlighted = highlight.includes(col);
      html += `<th class="${isHighlighted ? 'highlight-col' : ''}">${col}</th>`;
    });
    html += `</tr></thead><tbody>`;
    
    data.forEach((row, rowIdx) => {
      html += `<tr>`;
      columns.forEach(col => {
        const val = row[col] ?? '';
        const isHighlighted = highlight.includes(col);
        const display = val === null ? '<span class="null-val">NULL</span>' : String(val);
        html += `<td class="${isHighlighted ? 'highlight-col' : ''}">${display}</td>`;
      });
      html += `</tr>`;
    });
    
    html += `</tbody></table></div>`;
    return html;
  }

  return `
<div class="code-block">
  <div class="code-label"><span>${caption || 'Table Diff'}</span></div>
  <div class="table-diff-wrapper">
    ${renderTable(before, 'BEFORE')}
    ${renderTable(after, 'AFTER')}
  </div>
  <style>
    .table-diff-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .table-diff { width: 100%; border-collapse: collapse; font-size: 12px; }
    .table-diff th, .table-diff td { border: 1px solid var(--border); padding: 6px 8px; text-align: left; }
    .table-diff th { background: var(--surface2); color: var(--lvl); font-family: 'Space Mono', monospace; font-size: 10px; }
    .table-diff .highlight-col { background: var(--lvl-rgba); }
    .table-diff .null-val { color: var(--text-dim); font-style: italic; }
    .table-diff-caption { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-bottom: 4px; }
    @media (max-width: 700px) { .table-diff-wrapper { grid-template-columns: 1fr; } }
  </style>
</div>`;
}