/**
 * @layered-study/core - New Module Scaffold
 * Creates L1-L4.json files for a new module
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// These will be overridden by CLI args
let CONTENT = process.cwd();

const TEMPLATE = {
  level: 1,
  title: 'MODULE_TITLE',
  tagline: 'human-readable hook for this level',
  placementQuiz: [
    { q: 'Question 1?', options: ['A', 'B', 'C', 'D'], answer: 1, explain: 'Explanation.' },
    { q: 'Question 2?', options: ['A', 'B', 'C', 'D'], answer: 1, explain: 'Explanation.' },
    { q: 'Question 3?', options: ['A', 'B', 'C', 'D'], answer: 1, explain: 'Explanation.' },
    { q: 'Question 4?', options: ['A', 'B', 'C', 'D'], answer: 1, explain: 'Explanation.' },
    { q: 'Question 5?', options: ['A', 'B', 'C', 'D'], answer: 1, explain: 'Explanation.' }
  ],
  sections: [
    {
      title: 'Mental Model — Core Concept',
      blocks: [
        { type: 'mantra', md: '**Core principle statement.**' },
        { type: 'prose', md: 'Explanation of the mental model.' }
      ]
    },
    {
      title: 'Fundamentals & Patterns',
      blocks: [
        { type: 'heading', text: 'Key Pattern' },
        { type: 'code', label: 'pattern example', code: '// code here', py: '# python here' },
        { type: 'quiz', items: [] }
      ]
    },
    {
      title: 'Problem Set — L1 Drills',
      blocks: [
        { type: 'problems', items: [] }
      ]
    }
  ],
  revisionCard: [
    'Key takeaway 1',
    'Key takeaway 2',
    'Key takeaway 3',
    'Key takeaway 4'
  ],
  glossary: [
    { term: 'term1', def: 'Definition.' },
    { term: 'term2', def: 'Definition.' },
    { term: 'term3', def: 'Definition.' },
    { term: 'term4', def: 'Definition.' },
    { term: 'term5', def: 'Definition.' }
  ]
};

function createLesson(moduleId, level, moduleTitle) {
  const lesson = JSON.parse(JSON.stringify(TEMPLATE));
  lesson.level = level;
  lesson.title = moduleTitle;
  
  const levelNames = { 1: 'BEGINNER', 2: 'INTERVIEW READY', 3: 'ADVANCED', 4: 'EXPERT' };
  const levelPromises = {
    1: 'Zero-assumption mental models. Everyday analogies only.',
    2: 'Standard patterns. Formal complexity.',
    3: 'Optimization trade-offs. Internals.',
    4: 'Constraint-driven techniques. Heavy machinery.'
  };
  
  lesson.tagline = `the ${levelNames[level].toLowerCase()} view — ${levelPromises[level].toLowerCase()}`;
  
  // Adjust quotas per level
  const minProblems = { 1: 8, 2: 10, 3: 6, 4: 5 };
  const minTraces = { 1: 2, 2: 2, 3: 3, 4: 3 };
  
  // Add TODO comments
  lesson.sections[1].blocks.push({
    type: 'callout',
    tone: 'warn',
    md: `**TODO:** Add ${minTraces[level]} trace block(s), ${minProblems[level]} problem(s), and ${level >= 3 ? 'dialect-diff' : ''} blocks.`
  });
  
  return lesson;
}

export function newModule(moduleId, contentDir) {
  CONTENT = contentDir || process.cwd();
  const mods = JSON.parse(fs.readFileSync(path.join(CONTENT, 'modules.json'), 'utf8'));
  const mod = mods.modules.find(m => m.id === moduleId);
  if (!mod) {
    console.error(`Module '${moduleId}' not found in modules.json`);
    process.exit(1);
  }
  
  const candidates = [path.join(CONTENT, mod.id), path.join(CONTENT, `${mod.num}_${mod.id}`)];
  let dir = candidates.find(c => fs.existsSync(c));
  
  if (!dir) {
    dir = path.join(CONTENT, mod.id);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
  
  for (let level = 1; level <= 4; level++) {
    const lesson = createLesson(mod.id, level, mod.title);
    const filePath = path.join(dir, `L${level}.json`);
    if (fs.existsSync(filePath)) {
      console.log(`⚠ ${filePath} already exists, skipping`);
      continue;
    }
    fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2));
    console.log(`✓ Created ${filePath}`);
  }
  
  console.log(`\nNext steps:`);
  console.log(`1. Edit ${dir}/L1.json through L4.json`);
  console.log(`2. Run: npm run lint -- --only=${mod.id}`);
  console.log(`3. Run: npm run build`);
}