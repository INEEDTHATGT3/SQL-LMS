/**
 * Custom block: seed-data
 * Renders seed data reference card with download link
 */

export default function renderSeedData(block, sectionKey, skillConfig) {
  const { level = 'L1', tables = [], note = '' } = block;
  
  const levelNames = { L1: 'BEGINNER', L2: 'INTERVIEW READY', L3: 'ADVANCED', L4: 'EXPERT' };
  const levelName = levelNames[level] || level;
  
  let html = `
<div class="code-block">
  <div class="code-label">
    <span>Seed Data Reference (${levelName})</span>
  </div>
  <div class="seed-data-card">
    <p style="color:var(--text-dim);margin-bottom:12px;">${note || `Sample data for ${levelName} level exercises.`}</p>
    <ul style="list-style:none;padding:0;">`;
  
  tables.forEach(table => {
    html += `<li style="padding:8px 0;border-bottom:1px solid var(--border);">
      <code style="color:var(--lvl);">${table}</code>
      ${table === tables[0] ? ` <a href="/seed/${table}-${level}.sql" download style="font-size:11px;color:var(--accent3);">↓ download</a>` : ''}
    </li>`;
  });
  
  html += `
    </ul>
    <p style="font-size:11px;color:var(--text-dim);margin-top:12px;">
      Combined: <a href="/seed/combined-${level}.sql" download>download all tables</a>
    </p>
  </div>
</div>`;
  
  return html;
}