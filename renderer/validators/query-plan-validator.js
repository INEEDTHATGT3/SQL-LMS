/**
 * Custom validator: query-plan-validator
 * Ensures L3 has ≥1 query-plan block, L4 has ≥2
 */

export default async function validateQueryPlanValidator(lesson, quotaConfig) {
  const errors = [];
  const warnings = [];
  
  const custom = quotaConfig?.custom || {};
  const requireQueryPlan = custom.requireQueryPlan || {};
  
  // Count query-plan blocks
  let queryPlanCount = 0;
  (lesson.sections || []).forEach(sec => {
    sec.blocks.forEach(b => {
      if (b.type === 'query-plan') queryPlanCount++;
    });
  });
  
  const required = requireQueryPlan[lesson.level];
  if (required && queryPlanCount < required) {
    errors.push(`L${lesson.level} requires ≥${required} query-plan block(s) (has ${queryPlanCount})`);
  }
  
  return { errors, warnings };
}