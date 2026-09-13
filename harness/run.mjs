#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('.', import.meta.url);
const COMPOSE = ['compose', '-f', fileURLToPath(new URL('docker-compose.yml', ROOT))];
const KEEP_DB = process.argv.includes('--keep-db');

function command(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', [...COMPOSE, ...args], { cwd: fileURLToPath(new URL('..', ROOT)), ...options });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', data => { stdout += data; });
    child.stderr?.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout.trim()) : reject(new Error(`${args.join(' ')}\n${stderr || stdout}`)));
  });
}

const scenarios = [
  { id: 'P202', name: 'composite index equality plus range', sql: "EXPLAIN (ANALYZE, FORMAT JSON) SELECT id, amount FROM orders WHERE user_id = 123 AND created_at > DATE '2024-01-01';", nodes: ['Index Scan'], factor: 10 },
  { id: 'P203', name: 'partial index for active orders', sql: "EXPLAIN (ANALYZE, FORMAT JSON) SELECT id FROM orders WHERE deleted = false AND user_id = 123;", nodes: ['Index Scan'], factor: 10 },
  { id: 'P204', name: 'covering employee lookup', sql: "EXPLAIN (ANALYZE, FORMAT JSON) SELECT id, email FROM employees WHERE salary BETWEEN 100000 AND 100010;", nodes: ['Index Scan', 'Index Only Scan'], factor: 10 },
  { id: 'P205', name: 'sargable date range', sql: "EXPLAIN (ANALYZE, FORMAT JSON) SELECT count(*) FROM orders WHERE created_at >= DATE '2024-01-01' AND created_at < DATE '2025-01-01';", nodes: ['Index Scan', 'Bitmap Heap Scan', 'Seq Scan'], factor: 10 },
  { id: 'P206', name: 'bitmap combination', sql: "EXPLAIN (ANALYZE, FORMAT JSON) SELECT id FROM employees WHERE dept_id = 1 AND salary > 190000;", nodes: ['BitmapAnd', 'Bitmap Heap Scan'], factor: 10 },
  { id: 'P208', name: 'hash join memory decision', sql: "EXPLAIN (ANALYZE, FORMAT JSON) SELECT count(*) FROM employees e JOIN departments d ON d.id = e.dept_id;", nodes: ['Hash Join'], factor: 10 }
];

function flatten(node, result = []) {
  if (!node || typeof node !== 'object') return result;
  if (node['Node Type']) result.push(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(item => flatten(item, result));
    else if (value && typeof value === 'object') flatten(value, result);
  }
  return result;
}

function planFromPsql(output) {
  const start = output.indexOf('[');
  if (start < 0) throw new Error(`EXPLAIN did not return JSON: ${output}`);
  return JSON.parse(output.slice(start))[0]['Plan'];
}

async function waitForDatabase() {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      await command(['exec', '-T', 'postgres', 'pg_isready', '-U', 'lms', '-d', 'sql_lms_harness']);
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('PostgreSQL did not become ready within 30 seconds.');
}

let failures = 0;
let started = false;
try {
  await command(['up', '-d']);
  started = true;
  await waitForDatabase();
  for (const scenario of scenarios) {
    try {
      const output = await command(['exec', '-T', 'postgres', 'psql', '-U', 'lms', '-d', 'sql_lms_harness', '-Atq', '-c', scenario.sql]);
      const nodes = flatten(planFromPsql(output));
      const types = nodes.map(node => node['Node Type']);
      const expected = scenario.nodes.some(type => types.includes(type));
      const worstError = nodes.reduce((worst, node) => {
        const estimate = Number(node['Plan Rows']);
        const actual = Number(node['Actual Rows']);
        if (!estimate || !actual) return worst;
        return Math.max(worst, Math.max(estimate / actual, actual / estimate));
      }, 1);
      if (!expected) throw new Error(`expected one of [${scenario.nodes.join(', ')}], got [${types.join(', ')}]`);
      if (worstError > scenario.factor) throw new Error(`row estimate error ${worstError.toFixed(2)}x exceeds ${scenario.factor}x`);
      console.log(`PASS ${scenario.id}: ${scenario.name} [${types.join(' -> ')}]`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${scenario.id}: ${scenario.name}\n  ${error.message}`);
    }
  }
} finally {
  if (started && !KEEP_DB) {
    await command(['down']).catch(error => console.error(`WARN cleanup failed: ${error.message}`));
  }
}

console.log(`\n=== Harness: ${scenarios.length - failures} passed · ${failures} failed ===`);
process.exit(failures ? 1 : 0);
