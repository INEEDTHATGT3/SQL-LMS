#!/usr/bin/env node
/* Runs every src/engines/*.test.mjs (plain node:assert, no framework). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'engines');
const tests = fs.readdirSync(DIR).filter(f => f.endsWith('.test.mjs')).sort();
let failed = 0;
for (const f of tests) {
  try { await import(pathToFileURL(path.join(DIR, f)).href); console.log(`✓ ${f}`); }
  catch (e) { failed++; console.log(`✗ ${f}\n  ${e.stack || e}`); }
}
console.log(`\n${tests.length - failed}/${tests.length} engine test files passed`);
process.exit(failed ? 1 : 0);
