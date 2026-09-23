/* Block type registry shared by the app (blocks.jsx) and the content linter.
   REQUIRED lists the fields a block of that type must carry. */
export const REQUIRED = {
  prose: ['md'],
  heading: ['text'],
  list: ['items'],
  mantra: ['md'],
  callout: ['md'],
  code: ['code'],
  trace: ['title', 'columns', 'steps'],
  visual: ['kind'],
  compare: ['leftTitle', 'rightTitle', 'rows'],
  quiz: ['items'],
  problems: ['items'],
  problem: ['id', 'title', 'tier', 'platform'],
  followup: ['chain'],
  // lazy blocks
  'question': ['kind', 'q', 'answer'],
  'flashcards': [],                                  // cards[] and/or fromGlossary
  'sql-exercise': ['id', 'prompt', 'datasets', 'solution'],
  'query-trace': ['dataset', 'stages'],
  'schedule': ['ops'],
  'fd-stepper': ['attrs', 'fds', 'tasks'],
  'nf-decomposition': ['relation', 'target'],
  'er-diagram': ['entities'],
  'misconception': ['claim', 'refutation'],
  'predict': ['prompt', 'answer', 'reveal'],
  'explain-back': ['prompt', 'modelAnswer'],
  'table-diff': ['before'],
  'schema-diagram': ['tables'],
  'query-plan': ['plan'],
  'dialect-diff': []
};
export const BLOCK_TYPES = Object.keys(REQUIRED);
export const VISUAL_KINDS = ['boxes-array', 'mem-map', 'flow', 'table-diff', 'schema-diagram', 'er-diagram'];

/* blocks that count toward the per-lesson problem quota */
export const PROBLEM_TYPES = ['problems', 'problem', 'sql-exercise'];
