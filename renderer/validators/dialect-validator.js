/**
 * Custom validator: dialect-validator
 * Ensures L3/L4 have at least one dialect-diff block
 */

export default async function validateDialectValidator(lesson, quotaConfig) {
  const errors = [];
  const warnings = [];
  
  const custom = quotaConfig?.custom || {};
  const requireDialectNote = custom.requireDialectNote || {};
  
  // Count dialect-diff blocks
  let dialectDiffCount = 0;
  (lesson.sections || []).forEach(sec => {
    sec.blocks.forEach(b => {
      if (b.type === 'dialect-diff') dialectDiffCount++;
    });
  });
  
  const required = requireDialectNote[lesson.level];
  if (required && dialectDiffCount < 1) {
    errors.push(`L${lesson.level} requires at least 1 dialect-diff block (has ${dialectDiffCount})`);
  }
  
  return { errors, warnings };
}