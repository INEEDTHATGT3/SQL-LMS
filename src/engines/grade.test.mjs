import assert from 'node:assert/strict';
import { answerKey, isCorrect, optionOrder } from '../lib/grade.js';

/* --- options that reference other options keep authored order --- */
assert.deepEqual(optionOrder(['x', 'y', 'z', 'Both B and C'], 'q1a2b'), [0, 1, 2, 3]);
assert.deepEqual(optionOrder(['x', 'y', 'All of the above'], 'q77'), [0, 1, 2]);
assert.deepEqual(optionOrder(['A, B and D only', 'y'], 'q9'), [0, 1]);
assert.equal(optionOrder(['SELECT a', 'B-tree index', 'Hash join', 'Seq scan'], 'q1a2b').length, 4);
assert.notDeepEqual(['q1', 'q2', 'q3', 'q4', 'q5'].map(k => optionOrder(['p', 'q', 'r', 's'], k).join('')).filter(s => s !== '0123'), []);

/* --- mcq passthrough --- */
assert.equal(answerKey({ answer: 2 }, 'mcq'), 2);

/* --- nat: number answer -> point range --- */
assert.deepEqual(answerKey({ answer: 8 }, 'nat'), { k: 'nat', a: { min: 8, max: 8 } });

/* --- nat: number answer + tolerance -> widened range --- */
assert.deepEqual(answerKey({ answer: 0.5, tolerance: 0.01 }, 'nat'), { k: 'nat', a: { min: 0.49, max: 0.51 } });
assert.deepEqual(answerKey({ answer: 0.5 }, 'nat', 0.01), { k: 'nat', a: { min: 0.49, max: 0.51 } });

/* --- nat: explicit range preserved --- */
assert.deepEqual(answerKey({ answer: { min: 49, max: 51 } }, 'nat'), { k: 'nat', a: { min: 49, max: 51 } });

/* --- nat: kind inferred from item.kind --- */
assert.deepEqual(answerKey({ kind: 'nat', answer: 5, tolerance: 0.5 }), { k: 'nat', a: { min: 4.5, max: 5.5 } });

/* --- isCorrect honours the widened range --- */
assert.ok(isCorrect(answerKey({ answer: 0.5, tolerance: 0.01 }, 'nat'), 0.505));
assert.ok(!isCorrect(answerKey({ answer: 0.5, tolerance: 0.01 }, 'nat'), 0.52));
assert.ok(isCorrect(answerKey({ answer: 8 }, 'nat'), '8'));

/* --- other kinds --- */
assert.deepEqual(answerKey({ answer: [1, 2] }, 'msq'), { k: 'msq', a: [1, 2] });
assert.deepEqual(answerKey({ answer: [1, 3, 4, 5, 0, 2] }, 'order'), { k: 'order', a: [1, 3, 4, 5, 0, 2] });
