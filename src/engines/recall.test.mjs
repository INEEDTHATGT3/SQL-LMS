import assert from 'node:assert/strict';
import {
  normalize, wordCount, stem, mentions, keywordHits, overlap, matchesText,
  parseNum, natRange, checkAnswer, correctText, sourceText, rubricScore
} from './recall.js';
import { answerKey, isCorrect } from '../lib/grade.js';

/* --- normalization --- */
assert.equal(normalize('  SELECT *\nFROM  Emp; '), 'select from emp');
assert.equal(normalize('B+ tree'), 'b+ tree');
assert.equal(wordCount('A relation is in BCNF if, for every FD X → Y, X is a superkey.'), 15);
assert.equal(wordCount('   '), 0);

/* --- plural folding: singular and plural collapse to one root --- */
for (const [a, b] of [['keys', 'key'], ['dependencies', 'dependency'], ['indexes', 'index'],
  ['caches', 'cache'], ['attributes', 'attribute'], ['tuples', 'tuple'], ['anomalies', 'anomaly']])
  assert.equal(stem(a), stem(b), `${a} ~ ${b}`);
assert.equal(stem('status'), 'status');      // -us is not a plural
assert.equal(stem('analysis'), 'analysis');  // -is is not a plural

/* --- keyword hits on a real 3NF explanation (Korth, Normalization) --- */
const why3nf = 'BCNF requires every non-trivial functional dependency X -> Y to have X as a superkey. '
  + '3NF relaxes this: Y may instead be a prime attribute, i.e. part of some candidate key. '
  + 'So every BCNF relation is in 3NF, but dept_advisor(s_ID, i_ID, dept_name) is 3NF and not BCNF.';
assert.ok(mentions(why3nf, 'Functional Dependencies'));    // case + plural
assert.ok(mentions(why3nf, 'candidate keys'));
assert.ok(mentions(why3nf, 'prime attributes'));
assert.ok(!mentions(why3nf, 'transitive dependency'));
assert.ok(!mentions('the superkeys were fine', 'key'));      // whole words only
assert.ok(!mentions('key candidate', 'candidate key'));      // phrase order matters
assert.deepEqual(keywordHits(why3nf, ['superkey', 'prime attribute', 'lossless join']),
  { hit: ['superkey', 'prime attribute'], miss: ['lossless join'] });

/* --- flashcard type-mode overlap: stop words ignored --- */
const back = 'A minimal superkey';                           // candidate key definition
assert.equal(overlap('minimal superkey', back), 1);
assert.equal(overlap('a superkey', back), 0.5);
assert.equal(overlap('', back), 0);

/* --- free-text predictions (isolation anomalies, ANSI SQL-92) --- */
const nonRep = ['non-repeatable read', 'fuzzy read'];
assert.ok(matchesText('Non-Repeatable Read', nonRep));
assert.ok(matchesText('nonrepeatable read', nonRep));
assert.ok(matchesText('  fuzzy   READ. ', nonRep));
assert.ok(!matchesText('phantom read', nonRep));
assert.ok(!matchesText('', nonRep));

/* --- numeric parsing --- */
assert.equal(parseNum('8'), 8);
assert.equal(parseNum(' 1,024 '), 1024);
assert.equal(parseNum('1 024'), 1024);
assert.equal(parseNum('−5'), -5);
assert.equal(parseNum('2.5e3'), 2500);
assert.equal(parseNum('.5'), 0.5);
assert.ok(Number.isNaN(parseNum('')));
assert.ok(Number.isNaN(parseNum('8 keys')));
assert.ok(Number.isNaN(parseNum('1.2.3')));

/* --- NAT ranges --- */
assert.deepEqual(natRange(8), { min: 8, max: 8 });
assert.deepEqual(natRange(0.5, 0.01), { min: 0.49, max: 0.51 });
assert.deepEqual(natRange({ min: 49, max: 51 }), { min: 49, max: 51 });
assert.throws(() => natRange('8'));

/* GATE CS 2014 (Set 2): max superkeys of R(E,F,G,H) with key E = 2^3 = 8 */
const superkeys = { kind: 'nat', q: 'superkeys', answer: 8 };
assert.ok(checkAnswer(superkeys, 8));
assert.ok(checkAnswer(superkeys, '8'));
assert.ok(!checkAnswer(superkeys, 16));
assert.ok(!checkAnswer(superkeys, 'eight'));
// no tolerance => agrees with the analytics answer key from grade.js
assert.equal(checkAnswer(superkeys, 8), isCorrect(answerKey(superkeys), 8));
// tolerance widens only the UI check
assert.ok(checkAnswer({ kind: 'nat', answer: 0.5, tolerance: 0.01 }, '0.505'));

/* --- other kinds delegate to grade.js --- */
// GATE CS 2012: "Every relation in BCNF is also in 3NF" is the TRUE option
const nf = { kind: 'mcq', options: ['Every 3NF relation is in BCNF', 'No relation is in both', 'Every BCNF relation is in 3NF'], answer: 2 };
assert.ok(checkAnswer(nf, 2) && !checkAnswer(nf, 0));
// strict 2PL: conflict-serializable, recoverable, cascadeless - not deadlock-free
const s2pl = { kind: 'msq', options: ['Conflict serializable', 'Deadlock-free', 'Cascadeless', 'Recoverable'], answer: [0, 2, 3] };
assert.ok(checkAnswer(s2pl, [3, 0, 2]));
assert.ok(!checkAnswer(s2pl, [0, 1, 2, 3]));
assert.ok(!checkAnswer(s2pl, [0, 2]));
// logical query processing order
const order = { kind: 'order', options: ['SELECT', 'FROM', 'ORDER BY', 'WHERE', 'GROUP BY', 'HAVING'], answer: [1, 3, 4, 5, 0, 2] };
assert.ok(checkAnswer(order, [1, 3, 4, 5, 0, 2]));
assert.ok(!checkAnswer(order, [1, 3, 0, 4, 5, 2]));
// ANSI weakest level preventing each anomaly
const iso = { kind: 'match', left: ['Dirty read', 'Non-repeatable read', 'Phantom'],
  right: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'], answer: [1, 2, 3] };
assert.ok(checkAnswer(iso, [1, 2, 3]));
assert.ok(!checkAnswer(iso, [1, 2, 2]));
assert.ok(checkAnswer({ kind: 'text', answer: nonRep }, 'Fuzzy read'));

/* --- human-readable answers for the mistake log --- */
assert.equal(correctText(nf), 'Every BCNF relation is in 3NF');
assert.equal(correctText(s2pl), 'Conflict serializable; Cascadeless; Recoverable');
assert.equal(correctText({ ...superkeys, unit: 'superkeys' }), '8 superkeys');
assert.equal(correctText({ kind: 'nat', answer: { min: 49, max: 51 } }), '49 to 51');
assert.equal(correctText(order), 'FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY');
assert.equal(correctText(iso), 'Dirty read → READ COMMITTED; Non-repeatable read → REPEATABLE READ; Phantom → SERIALIZABLE');
assert.equal(correctText({ kind: 'text', answer: nonRep }), 'non-repeatable read');

/* --- source line --- */
assert.equal(sourceText({ exam: 'GATE CS', year: 2021, set: 1, q: 34 }), 'GATE CS 2021 · Set 1 · Q34');
assert.equal(sourceText({ platform: 'LeetCode', ref: 1757 }), 'LeetCode #1757');
assert.equal(sourceText({ ref: 'Korth 7e, ch. 7' }), 'Korth 7e, ch. 7');
assert.equal(sourceText('CMU 15-445 L15'), 'CMU 15-445 L15');
assert.equal(sourceText(undefined), '');

/* --- explain-back rubric --- */
const rub = [{ point: 'BCNF: LHS superkey', weight: 2 }, { point: '3NF: RHS prime allowed', weight: 2 }, { point: 'counterexample' }];
assert.equal(rubricScore(rub, [0, 1, 2]), 1);
assert.equal(rubricScore(rub, [0]), 0.4);
assert.equal(rubricScore(rub, [2]), 0.2);
assert.equal(rubricScore([], [0]), 0);
