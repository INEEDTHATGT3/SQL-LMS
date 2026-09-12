/**
 * Custom block: dialect-diff
 * Renders side-by-side SQL dialect comparison
 */

export default function renderDialectDiff(block, sectionKey, skillConfig) {
  const dialects = ['sql', 'pg', 'mysql', 'py-pandas', 'py-sqlalchemy'];
  const data = {};
  
  dialects.forEach(d => {
    if (block[d]) data[d] = block[d];
  });
  
  if (Object.keys(data).length === 0) {
    return `<div class="callout warn">dialect-diff block missing dialect code</div>`;
  }

  const labels = {
    'sql': 'ANSI SQL',
    'pg': 'PostgreSQL',
    'mysql': 'MySQL',
    'py-pandas': 'Python (pandas)',
    'py-sqlalchemy': 'Python (SQLAlchemy)'
  };

  let html = `<div class="dialect-diff"><div class="dialect-diff-grid">`;
  
  dialects.filter(d => data[d]).forEach(d => {
    const code = data[d];
    const highlightLang = d.startsWith('py') ? 'python' : 'sql';
    html += `
      <div class="dialect-panel">
        <div class="dialect-panel-header">
          <span class="badge">${labels[d] || d}</span>
        </div>
        <pre class="has-py-alt"><code class="language-${highlightLang}">${code}</code></pre>
      </div>`;
  });
  
  html += `</div></div>`;

  return html;
}