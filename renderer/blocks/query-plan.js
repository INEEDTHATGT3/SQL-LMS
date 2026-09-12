/**
 * Custom block: query-plan
 * Renders EXPLAIN (ANALYZE, FORMAT JSON) output as visual tree
 */

export default function renderQueryPlan(block, sectionKey, skillConfig) {
  const { title, plan, dialect = 'pg' } = block;
  
  if (!plan) {
    return `<div class="callout warn">query-plan block missing plan data</div>`;
  }

  function renderNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    const nodeType = node['Node Type'] || 'Unknown';
    const relation = node['Relation Name'] ? ` on <code>${node['Relation Name']}</code>` : '';
    const alias = node['Alias'] ? ` as <code>${node['Alias']}</code>` : '';
    const cost = node['Startup Cost'] !== undefined && node['Total Cost'] !== undefined 
      ? ` cost=${node['Startup Cost']}..${node['Total Cost']}` : '';
    const rows = node['Plan Rows'] !== undefined ? ` rows=${node['Plan Rows']}` : '';
    const width = node['Plan Width'] !== undefined ? ` width=${node['Plan Width']}` : '';
    const actualTime = node['Actual Startup Time'] !== undefined && node['Actual Total Time'] !== undefined
      ? ` actual time=${node['Actual Startup Time']}..${node['Actual Total Time']}` : '';
    const actualRows = node['Actual Rows'] !== undefined ? ` actual rows=${node['Actual Rows']}` : '';
    const loops = node['Actual Loops'] !== undefined ? ` loops=${node['Actual Loops']}` : '';
    
    let html = `<div class="plan-node" style="margin-left: ${depth * 24}px;">
      <div class="plan-node-header">
        <span class="plan-node-type">${nodeType}</span>${relation}${alias}
        <span class="plan-node-meta">${cost}${rows}${width}${actualTime}${actualRows}${loops}</span>
      </div>`;
    
    // Filter conditions
    const filters = [];
    if (node['Filter']) filters.push(`Filter: ${node['Filter']}`);
    if (node['Index Cond']) filters.push(`Index Cond: ${node['Index Cond']}`);
    if (node['Hash Cond']) filters.push(`Hash Cond: ${node['Hash Cond']}`);
    if (node['Merge Cond']) filters.push(`Merge Cond: ${node['Merge Cond']}`);
    if (node['Join Filter']) filters.push(`Join Filter: ${node['Join Filter']}`);
    if (node['Recheck Cond']) filters.push(`Recheck Cond: ${node['Recheck Cond']}`);
    
    if (filters.length) {
      html += `<div class="plan-node-filters" style="font-size:12px;color:var(--text-dim);margin:4px 0;">${filters.join('; ')}</div>`;
    }
    
    // Children
    if (node.Plans && node.Plans.length) {
      html += node.Plans.map(child => renderNode(child, depth + 1)).join('');
    }
    
    html += `</div>`;
    return html;
  }

  const planHtml = Array.isArray(plan) ? plan.map(p => renderNode(p.Plan || p)).join('') : renderNode(plan.Plan || plan);

  const dialectBadge = dialect === 'pg' ? 'PostgreSQL' : dialect === 'mysql' ? 'MySQL' : 'ANSI';

  return `
<div class="code-block">
  <div class="code-label">
    <span>${title || 'EXPLAIN Plan'}</span>
    <span class="badge blue">${dialectBadge}</span>
  </div>
  <div class="query-plan">${planHtml}</div>
</div>`;
}