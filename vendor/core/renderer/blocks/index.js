/**
 * @layered-study/core - Built-in Block Registry
 * Core blocks that every skill gets by default
 */

// Re-export block renderers for skills that want to extend them
export const builtinBlocks = {
  // These are the default block types handled inline in render.js
  // Custom blocks from skills are merged on top of these
  // 
  // prose, heading, list, mantra, callout, code, trace, visual,
  // compare, quiz, problem, problems, followup
};

export const blockTypes = [
  'prose', 'heading', 'list', 'mantra', 'callout',
  'code', 'trace', 'visual', 'compare', 'quiz',
  'problem', 'problems', 'followup'
];