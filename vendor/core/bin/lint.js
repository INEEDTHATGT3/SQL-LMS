#!/usr/bin/env node
/**
 * layered-study-lint - CLI wrapper
 */

import { lint } from '../renderer/lint.js';
import path from 'path';

const args = process.argv.slice(2);
let onlyModule = null;
if (args.includes('--only')) {
  const idx = args.indexOf('--only');
  onlyModule = args[idx + 1];
}

const contentDir = path.join(process.cwd(), 'content');
lint(onlyModule, contentDir).catch(e => {
  console.error('Lint failed:', e);
  process.exit(1);
});