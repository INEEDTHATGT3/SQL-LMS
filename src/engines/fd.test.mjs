import assert from 'node:assert/strict';
import {
  parseFds, closure, candidateKeys, keySearch, primeAttrs, isSuperkey, superkeyCount, minimalCover,
  isMinimalCover, equivalent, project, nfCheck, highestNF, bcnfDecompose, synthesize3NF,
  losslessBinary, chase, dependencyPreserving, normalizeRelation, stepperTask, parseAnswer,
  checkAnswer, checkBlank, fdStr, NF
} from './fd.js';
import { answerKey, isCorrect } from '../lib/grade.js';

const sorted = ks => ks.map(k => [...k].sort().join('')).sort();

/* 1. Korth 7.4.2: R(A,B,C,G,H,I), F = {A→B, A→C, CG→H, CG→I, B→H}; (AG)+ = ABCGHI */
const KR = 'ABCGHI', KF = [['A', 'B'], ['A', 'C'], ['CG', 'H'], ['CG', 'I'], ['B', 'H']];
const ag = closure('AG', KF, KR);
assert.deepEqual(ag.closure, [...'ABCGHI']);
assert.deepEqual(ag.steps[0], { using: 'A→B', added: ['B'], closure: [...'ABG'] });
assert.deepEqual(ag.steps.map(s => s.using), ['A→B', 'A→C', 'CG→H', 'CG→I']);
assert.deepEqual(candidateKeys(KR, KF), [['A', 'G']]);
assert.ok(isSuperkey('AG', KR, KF) && !isSuperkey('A', KR, KF) && isSuperkey('ABG', KR, KF));

/* 2. GATE classic R(ABCDE), F = {A→B, BC→E, ED→A}: keys ACD, BCD, CDE, all prime, 3NF not BCNF */
const G5 = [['A', 'B'], ['BC', 'E'], ['ED', 'A']];
assert.deepEqual(sorted(candidateKeys('ABCDE', G5)), ['ACD', 'BCD', 'CDE']);
assert.deepEqual(primeAttrs('ABCDE', G5), [...'ABCDE']);
assert.equal(highestNF('ABCDE', G5), '3NF');

/* 3. superkey counts (GATE formulas): one key of size 1 → 2^(n-1);
   keys A, B → 2^(n-1)+2^(n-1)-2^(n-2); keys AB, CD over n=6 → 7·2^(n-4) = 28; no FDs → 1 */
assert.equal(superkeyCount('ABCD', [['A', 'BCD']]), 8);
assert.equal(superkeyCount('ABCD', [['A', 'BCD'], ['B', 'ACD']]), 12);
assert.equal(superkeyCount('ABCDEF', [['AB', 'CDEF'], ['CD', 'ABEF']]), 28);
assert.equal(superkeyCount('ABCD', []), 1);

/* 4. Korth 7.4.3 canonical cover: F = {A→BC, B→C, A→B, AB→C} on (A,B,C) → {A→B, B→C} */
const mc = minimalCover([['A', 'BC'], ['B', 'C'], ['A', 'B'], ['AB', 'C']], 'ABC');
assert.deepEqual(mc.canonical.map(fdStr).sort(), ['A→B', 'B→C']);
assert.ok(mc.steps.some(s => s.phase === 'lhs' && s.fd === 'AB→C' && s.remove));
/* minimal covers are not unique: both orientations accepted */
const cyc = [['A', 'B'], ['B', 'A'], ['A', 'C'], ['B', 'C']];
assert.ok(isMinimalCover([['A', 'B'], ['B', 'A'], ['A', 'C']], cyc, 'ABC'));
assert.ok(isMinimalCover([['A', 'B'], ['B', 'A'], ['B', 'C']], cyc, 'ABC'));
assert.ok(!isMinimalCover(cyc, cyc, 'ABC'));                  // redundant FD left in

/* 5. equivalence (Gate Smashers): F = {A→C, AC→D, E→AD, E→H}, G = {A→CD, E→AH} */
assert.ok(equivalent([['A', 'C'], ['AC', 'D'], ['E', 'AD'], ['E', 'H']], [['A', 'CD'], ['E', 'AH']], 'ACDEH').equivalent);
const ne = equivalent([['A', 'B'], ['B', 'C']], [['A', 'B'], ['A', 'C']], 'ABC');
assert.ok(!ne.equivalent && ne.fCoversG && !ne.gCoversF);

/* 6. BCNF classic R(ABC), AB→C, C→B: keys AB, AC; 3NF not BCNF;
   split on C→B → (BC),(AC): lossless, AB→C lost */
const nr = normalizeRelation({ attrs: 'ABC', fds: [['AB', 'C'], ['C', 'B']] }, 'BCNF');
assert.equal(nr.highest, '3NF');
assert.deepEqual(sorted(nr.keys), ['AB', 'AC']);
assert.equal(nr.tree.split, 'C→B');
assert.deepEqual(nr.leaves.map(l => l.attrs.join('')), ['BC', 'AC']);
assert.ok(nr.lossless.ok);
assert.ok(!nr.dep.preserving);
assert.deepEqual(nr.dep.lost, ['AB→C']);
assert.ok(nr.leaves.every(l => l.nf === 'BCNF'));
/* same relation to 3NF: already there, no split */
assert.equal(normalizeRelation({ attrs: 'ABC', fds: [['AB', 'C'], ['C', 'B']] }, '3NF').leaves.length, 1);

/* 7. transitive: R(ABC), A→B, B→C: 2NF only; BCNF split (BC),(AB), lossless + preserving */
assert.equal(highestNF('ABC', [['A', 'B'], ['B', 'C']]), '2NF');
const tr = bcnfDecompose('ABC', [['A', 'B'], ['B', 'C']]);
assert.deepEqual(tr.leaves.map(l => l.attrs.join('')), ['BC', 'AB']);
assert.ok(dependencyPreserving('ABC', ['BC', 'AB'], [['A', 'B'], ['B', 'C']]).preserving);

/* 8. 1NF only: R(ABCD), AB→C, B→D (partial on key AB) */
const p1 = nfCheck('ABCD', [['AB', 'C'], ['B', 'D']]);
assert.equal(p1.highest, '1NF');
assert.ok(!p1.rows[1].nf2.ok && /partial/.test(p1.rows[1].nf2.why));
/* partial dependency only implied: keys AC, BC; A→D follows from A→B, AB→D */
const imp = nfCheck('ABCD', [['A', 'B'], ['B', 'A'], ['AB', 'D']]);
assert.deepEqual(sorted(imp.keys), ['AC', 'BC']);
assert.equal(imp.highest, '1NF');
assert.ok(imp.rows.some(r => r.implied && !r.nf2.ok));

/* 9. Korth 7.4.4 3NF synthesis, cust_banker_branch(customer_id, employee_id, branch_name, type) */
const CB = ['customer_id', 'employee_id', 'branch_name', 'type'];
const CBF = [[['customer_id', 'employee_id'], ['branch_name', 'type']], [['employee_id'], ['branch_name']],
  [['customer_id', 'branch_name'], ['employee_id']]];
const s3 = synthesize3NF(CB, CBF, 'cust_banker_branch');
assert.deepEqual(s3.leaves.map(l => [...l.attrs].sort().join(',')).sort(),
  ['branch_name,customer_id,employee_id', 'customer_id,employee_id,type']);
assert.ok(s3.steps.some(s => /removed/.test(s)));
assert.ok(chase(CB, s3.leaves.map(l => l.attrs), CBF).lossless);
/* synthesis adds a key schema when none holds one: R(ABCD), A→B, C→D → (AB),(CD),(AC) */
const s3k = synthesize3NF('ABCD', [['A', 'B'], ['C', 'D']]);
assert.deepEqual(s3k.leaves.map(l => l.attrs.join('')), ['AB', 'CD', 'AC']);

/* 10. chase, Elmasri 15.2: EMP_PROJ 3-way decomposition is lossless */
const EP = ['ssn', 'ename', 'pnumber', 'pname', 'plocation', 'hours'];
const EPF = [[['ssn'], ['ename']], [['pnumber'], ['pname', 'plocation']], [['ssn', 'pnumber'], ['hours']]];
assert.ok(chase(EP, [['ssn', 'ename'], ['pnumber', 'pname', 'plocation'], ['ssn', 'pnumber', 'hours']], EPF).lossless);
/* ...while EMP_LOCS(ename, plocation) + EMP_PROJ1 is lossy (spurious tuples) */
assert.ok(!losslessBinary(['ename', 'plocation'], ['ssn', 'pnumber', 'hours', 'pname', 'plocation'], EPF, EP).lossless);
assert.ok(!chase(EP, [['ename', 'plocation'], ['ssn', 'pnumber', 'hours', 'pname', 'plocation']], EPF).lossless);
/* Ullman 5-way: R(ABCDE), A→C, B→C, C→D, DE→C, CE→A; AD, AB, BE, CDE, AE lossless */
assert.ok(chase('ABCDE', ['AD', 'AB', 'BE', 'CDE', 'AE'], [['A', 'C'], ['B', 'C'], ['C', 'D'], ['DE', 'C'], ['CE', 'A']]).lossless);
assert.ok(!chase('ABCD', ['AB', 'CD'], [['A', 'B'], ['C', 'D']]).lossless);

/* 11. dependency preservation needs the closure test: R(ABCD), A→B, B→C, C→D, D→A
   into (AB),(BC),(CD) still preserves D→A (D→C→B→A across schemas) */
const dp = dependencyPreserving('ABCD', ['AB', 'BC', 'CD'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']]);
assert.ok(dp.preserving && dp.lost.length === 0);

/* 12. projection: F = {A→B, B→C, C→D} onto ACD gives A→C, C→D */
assert.deepEqual(project([['A', 'B'], ['B', 'C'], ['C', 'D']], 'ACD', 'ABCD').map(fdStr).sort(), ['A→C', 'C→D']);

/* 13. named attributes in every accepted form normalize the same way */
assert.deepEqual(parseFds([[['emp_id'], ['name']], ['emp_id', 'dept']], ['emp_id', 'name', 'dept']),
  [{ lhs: ['emp_id'], rhs: ['name'] }, { lhs: ['emp_id'], rhs: ['dept'] }]);
assert.deepEqual(parseFds(['AB->C', 'C→D']), [{ lhs: ['A', 'B'], rhs: ['C'] }, { lhs: ['C'], rhs: ['D'] }]);
assert.equal(highestNF(['emp_id', 'name', 'dept', 'dept_head'],
  [[['emp_id'], ['name', 'dept']], [['dept'], ['dept_head']]]), '2NF');
assert.throws(() => nfCheck('ABC', [['A', 'Z']]), /unknown attribute/);

/* 14. stepper practice answers: order/space/case-insensitive sets */
const cl = stepperTask('closure:AG', KR, KF);
assert.ok(checkAnswer(cl, parseAnswer(cl, 'i h g c b a', KR).value));
assert.ok(!checkAnswer(cl, parseAnswer(cl, 'ABCG', KR).value));
assert.match(parseAnswer(cl, 'ABZ', KR).error, /unknown attribute/);
const ks = stepperTask('keys', 'ABCDE', G5);
assert.ok(checkAnswer(ks, parseAnswer(ks, 'cde, dcb ,ACD', 'ABCDE').value));
assert.ok(!checkAnswer(ks, parseAnswer(ks, 'ACD, BCD', 'ABCDE').value));
const nk = stepperTask('keys', CB, CBF);
assert.ok(checkAnswer(nk, parseAnswer(nk, '{customer_id, employee_id}; {branch_name, customer_id}', CB).value));
const mt = stepperTask('minimalCover', 'ABC', cyc);
assert.ok(checkAnswer(mt, parseAnswer(mt, 'A->B, B->A, B->C', 'ABC').value, 'ABC', cyc));
const sk = stepperTask('superkeyCount', 'ABCDEF', [['AB', 'CDEF'], ['CD', 'ABEF']]);
assert.equal(sk.answer, 28);
assert.ok(checkBlank(sk.rows[2].blank, '−4', 'ABCDEF'));
assert.ok(checkBlank(cl.rows[1].blank, 'gab', KR));
assert.equal(stepperTask('equivalent', 'ABC', [['A', 'B'], ['B', 'C']], [['A', 'B'], ['A', 'C']]).answer, 1);

/* 15. nf-decomposition MCQ is graded by grade.js like any authored mcq */
const idx = NF.indexOf(highestNF('ABCDE', G5));
assert.ok(isCorrect(answerKey({ answer: idx }), 2) && !isCorrect(answerKey({ answer: idx }), 3));

/* ---- SQL-J06 review round: new independent cases, hand-derived, cited ---- */

/* 16. closure (Gate Vidyalay, "Finding Candidate Keys" Problem-02,
   gatevidyalay.com/candidate-key-finding-candidate-key-examples):
   R(ABCDE), F = {AB→C, C→D, B→E}; the page walks {AB}+ = {A,B,C} (AB→C)
   = {A,B,C,D} (C→D) = {A,B,C,D,E} (B→E). Hand: {B}+ = {B,E}; {A,C}+ = {A,C,D}
   (C→D fires, AB→C never gets B). */
const GV = [['AB', 'C'], ['C', 'D'], ['B', 'E']];
const gvb = closure('AB', GV, 'ABCDE');
assert.deepEqual(gvb.closure, [...'ABCDE']);
assert.deepEqual(gvb.steps.map(s => s.using), ['AB→C', 'C→D', 'B→E']);
assert.deepEqual(gvb.steps.map(s => s.added), [['C'], ['D'], ['E']]);
assert.deepEqual(gvb.steps.map(s => s.closure), [['A', 'B', 'C'], ['A', 'B', 'C', 'D'], [...'ABCDE']]);
assert.deepEqual(closure('B', GV, 'ABCDE').closure, ['B', 'E']);
assert.deepEqual(closure('AC', GV, 'ABCDE').closure, ['A', 'C', 'D']);

/* 17. candidate keys + prime (GATE CSE 1995 Q26, gateoverflow.in/2665):
   R(ABC), F = {AB→C, C→A} — asked "show 3NF not BCNF, determine the minimal
   keys"; answers AB and BC. Hand: B on no RHS → essential; A→B? no single
   LHS fires: {A}+ = {A}, {B}+ = {B}, {C}+ = {C,A}; {A,B}+ = {A,B,C} ✓,
   {B,C}+ = {A,B,C} ✓ (C→A then AB→C); no size-1 key, so exactly AB, BC;
   every attribute sits in some key → all prime. */
const G95 = [['AB', 'C'], ['C', 'A']];
assert.deepEqual(candidateKeys('ABC', G95), [['A', 'B'], ['B', 'C']]);
assert.deepEqual(primeAttrs('ABC', G95), [...'ABC']);
const k95 = keySearch('ABC', G95);
assert.deepEqual(k95.essential, ['B']);
assert.deepEqual(k95.pool, ['A', 'C']);

/* 18. superkey count by inclusion–exclusion, hand-enumerated:
   GATE CSE 1995 R(ABC) keys AB, BC → supersets {AB, BC, ABC} = 3 = 2+2−2^0;
   Gate Vidyalay Problem-02 R(ABCDE) sole key AB → 2^(5−2) = 8
   (AB, ABC, ABD, ABE, ABCD, ABCE, ABDE, ABCDE). */
assert.equal(superkeyCount('ABC', G95), 3);
assert.equal(superkeyCount('ABCDE', GV), 8);

/* 19. minimal cover — Ramakrishnan & Gehrke "contracts" CTAS example
   (C→CSJDPQV, JP→C, SD→P; e.g. cs.colostate.edu CS430 slides, SFU 354):
   split to single RHS; C→P is redundant because C+ already contains S and D
   (C→S, C→D) so SD→P derives P; every other FD survives. Canonical cover
   merges the surviving C→* family back into C→SJDQV (no P). */
const CTAS = 'CSJDPQV', CTF = [['C', 'SJDPQV'], ['JP', 'C'], ['SD', 'P']];
const ct = minimalCover(CTF, CTAS);
assert.deepEqual(ct.cover.map(fdStr).sort(), ['C→D', 'C→J', 'C→Q', 'C→S', 'C→V', 'JP→C', 'SD→P']);
assert.ok(ct.steps.some(s => s.phase === 'redundant' && s.fd === 'C→P' && s.remove));
assert.ok(isMinimalCover(ct.cover, CTF, CTAS));
assert.ok(!isMinimalCover(CTF, CTF, CTAS));                 // C→P still redundant inside F
assert.deepEqual(ct.canonical.map(fdStr), ['C→SJDQV', 'JP→C', 'SD→P']); // P dropped by C→P removal
assert.ok(isMinimalCover([['C', 'SJDQV'], ['JP', 'C'], ['SD', 'P']], CTF, CTAS)); // merged RHS ok

/* 20. 3NF but not BCNF (GATE CSE 1995 Q26 again — the NF verdicts):
   C→A has a non-superkey LHS with prime RHS (3NF ok, BCNF violated);
   keys AB, BC are size 2 and {C}+ = {A,C} derives only primes → no partial
   dependency → not 2NF-blocked. BCNF split on C→A → R1 = AC, R2 = BC:
   common {C}, C+ = {A,C} ⊇ AC → lossless; AB→C has its LHS split across the
   two schemas → lost; both leaves BCNF. */
const n95 = normalizeRelation({ attrs: 'ABC', fds: G95 }, 'BCNF');
assert.equal(n95.highest, '3NF');
assert.ok(n95.rows[1].nf3.ok && !n95.rows[1].bcnf.ok);
assert.equal(n95.tree.split, 'C→A');
assert.deepEqual(n95.leaves.map(l => l.attrs.join('')), ['AC', 'BC']);
assert.ok(n95.lossless.ok && !n95.dep.preserving);
assert.deepEqual(n95.dep.lost, ['AB→C']);
assert.ok(n95.leaves.every(l => l.nf === 'BCNF'));

/* 21. R(ABC) AB→C, C→B — BCNF split is lossless but not dependency-preserving
   (Silberschatz/Korth movie-theatre shape: (title,city)→theatre, theatre→city;
   UChicago CS235 slides: "decomposition into BC and AC … cannot check AB→C").
   Chase (BC),(AC) with distinguished a: C→B equates the AC row's B to a →
   row 1 all a's. The (AB),(AC) split stays lossy: AB→C never applies (B
   differs), C→B never applies (C differs). */
const NR2 = [['AB', 'C'], ['C', 'B']];
const ch2 = chase('ABC', [['B', 'C'], ['A', 'C']], NR2);
assert.ok(ch2.lossless && ch2.row === 1);
assert.deepEqual(ch2.tableau, [['b1,1', 'a', 'a'], ['a', 'a', 'a']]);
const ch2l = chase('ABC', [['A', 'B'], ['A', 'C']], NR2);
assert.ok(!ch2l.lossless && ch2l.row === -1);
/* ...and the (BC),(AC) decomposition keeps data but loses AB→C */
const dp2 = dependencyPreserving('ABC', [['B', 'C'], ['A', 'C']], NR2);
assert.ok(!dp2.preserving && dp2.lost.includes('AB→C'));
assert.ok(losslessBinary(['B', 'C'], ['A', 'C'], NR2, 'ABC').lossless);

/* 22. 3-way chase (Ullman method):
   GATE 1995 F on the three-schema split (AB),(BC),(AC): AB→C sees A agree
   across rows 1 and 3, B differs, so C of row 1 becomes a → the AB row is
   all a's (lossless). Horizontal split (A),(B),(C) of R(ABC), F={A→B,B→C}:
   each FD's LHS symbols never agree between two rows, tableau frozen → lossy. */
const ch3 = chase('ABC', [['A', 'B'], ['B', 'C'], ['A', 'C']], G95);
assert.ok(ch3.lossless && ch3.row === 0);
assert.deepEqual(ch3.tableau[0], ['a', 'a', 'a']);
const ch3l = chase('ABC', [['A'], ['B'], ['C']], [['A', 'B'], ['B', 'C']]);
assert.ok(!ch3l.lossless && ch3l.row === -1);
assert.deepEqual(ch3l.tableau, [['a', 'b1,2', 'b1,3'], ['b2,1', 'a', 'b2,3'], ['b3,1', 'b3,2', 'a']]);
