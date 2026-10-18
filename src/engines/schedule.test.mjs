import assert from 'node:assert/strict';
import {
  parseSchedule, conflicts, precedence, analyze, simulate, verdictAsk, opLabel, VERDICTS, NONE_OPTION
} from './schedule.js';
import { isCorrect, answerKey } from '../lib/grade.js';

const run = s => analyze(parseSchedule(s));
const v = (s, k) => run(s).verdicts[k].value;
const kinds = s => run(s).anomalies.map(a => a.kind);

/* --- parsing --- */
assert.deepEqual(parseSchedule('r1(a), W2(B); c1').map(opLabel), ['R1(a)', 'W2(B)', 'C1']);
assert.deepEqual(parseSchedule('S12(acct) X1(A) U1(A)').map(o => [o.kind, o.tx, o.item]), [['S', 12, 'acct'], ['X', 1, 'A'], ['U', 1, 'A']]);
assert.throws(() => parseSchedule('R1A'), /Can't read/);
assert.throws(() => parseSchedule('C1(A)'), /no item/);
assert.throws(() => parseSchedule('R1(A) C1 W1(B)'), /already committed/);
assert.doesNotThrow(() => parseSchedule('X1(A) W1(A) C1 U1(A)'));   // unlock after commit is allowed

/* 1. Korth schedule 3: conflict-equivalent to serial <T1, T2> */
const k3 = 'R1(A) W1(A) R2(A) W2(A) R1(B) W1(B) R2(B) W2(B)';
{
  const a = run(k3);
  assert.equal(a.verdicts.conflictSerializable.value, true);
  assert.deepEqual(a.graph.order, [1, 2]);
  assert.deepEqual(a.graph.edges.map(e => [e.from, e.to, e.items.join()]), [[1, 2, 'A,B']]);
  assert.equal(a.verdicts.viewSerializable.value, true);
  assert.equal(conflicts(parseSchedule(k3)).length, 6);   // 3 on A + 3 on B
}
/* no conflicts at all: every one of the 3! serial orders is equivalent */
assert.equal(precedence(parseSchedule('R1(A) R2(B) W3(C)')).orders.length, 6);

/* 2. Korth schedule 4 (concurrent transfer): cycle T1 -> T2 -> T1, two lost updates */
const k4 = 'R1(A) R2(A) W2(A) R2(B) W1(A) R1(B) W1(B) W2(B)';
{
  const a = run(k4);
  assert.equal(a.verdicts.conflictSerializable.value, false);
  assert.deepEqual(a.graph.cycle, [1, 2, 1]);
  assert.ok(a.graph.edges.every(e => e.onCycle));
  assert.equal(a.verdicts.viewSerializable.value, false);   // no blind writes
  assert.equal(a.anomalies.filter(x => x.kind === 'lost update').length, 2);
}

/* 3. Korth Fig. 14.12: view serializable (= <T1,T2,T3>) but not conflict serializable */
{
  const a = run('R1(A) W2(A) W1(A) W3(A)');
  assert.equal(a.verdicts.conflictSerializable.value, false);
  assert.equal(a.verdicts.viewSerializable.value, true);
  assert.deepEqual(a.verdicts.viewSerializable.order, [1, 2, 3]);
  assert.deepEqual(a.verdicts.viewSerializable.blind.map(opLabel), ['W2(A)', 'W3(A)']);
}
/* blind writes present but still not view serializable (reads-from can't match) */
assert.equal(v('R2(A) W1(A) R2(A) C2 W1(A) C1', 'viewSerializable'), false);

/* 4. Korth Fig. 14.14: T2 reads T1's write and commits first -> nonrecoverable */
assert.equal(v('R1(A) W1(A) R2(A) C2 R1(B) C1', 'recoverable'), false);
assert.match(run('R1(A) W1(A) R2(A) C2 R1(B) C1').verdicts.recoverable.reason, /T2 reads A from T1 but commits before T1/);
/* same reads, commit order fixed -> recoverable, but still not cascadeless */
assert.equal(v('R1(A) W1(A) R2(A) R1(B) C1 C2', 'recoverable'), true);
assert.equal(v('R1(A) W1(A) R2(A) R1(B) C1 C2', 'cascadeless'), false);
/* reader commits, then the writer aborts -> nonrecoverable */
assert.equal(v('W1(A) R2(A) C2 A1', 'recoverable'), false);

/* 5. Korth Fig. 14.15 cascading rollback: T1 aborts after T2, T3 read its data */
{
  const s = 'R1(A) R1(B) W1(A) R2(A) W2(A) R3(A) A1';
  const a = run(s);
  assert.equal(a.verdicts.recoverable.value, true);           // no reader commits
  assert.equal(a.verdicts.cascadeless.value, false);
  assert.match(a.verdicts.cascadeless.reason, /T2 reads A written by uncommitted T1/);
  assert.ok(a.anomalies.some(x => x.kind === 'dirty read' && /T1 later aborts/.test(x.text)));
  assert.deepEqual(a.graph.nodes, [2, 3]);                    // aborted T1 leaves the graph
}
/* cascadeless but not strict: T2 overwrites uncommitted A */
{
  const a = run('W1(A) W2(A) C1 C2');
  assert.equal(a.verdicts.cascadeless.value, true);
  assert.equal(a.verdicts.recoverable.value, true);
  assert.equal(a.verdicts.strict.value, false);
  assert.match(a.verdicts.strict.reason, /T2 writes A written by uncommitted T1/);
}

/* 6. strict schedule: everything holds */
for (const k of Object.keys(VERDICTS)) assert.equal(v('W1(A) C1 R2(A) W2(A) C2', k), true, k);

/* 7. anomalies: lost update + unrepeatable read */
assert.deepEqual(kinds('R1(A) R2(A) W1(A) W2(A) C1 C2'), ['lost update']);
assert.match(run('R1(A) R2(A) W1(A) W2(A) C1 C2').anomalies[0].text, /T1's W1\(A\) is lost/);
assert.deepEqual(kinds('R1(A) R2(A) W2(A) C2 R1(A) C1'), ['unrepeatable read']);
assert.deepEqual(kinds('W1(A) C1 R2(A) W2(A) C2'), []);

/* 8. 2PL with auto-inserted locks: classic deadlock, youngest (T2) is the victim */
{
  const s = parseSchedule('R1(A) R2(B) W1(B) W2(A) C1 C2');
  for (const p of ['2PL', 'strict2PL', 'rigorous']) {
    const r = simulate(s, p);
    assert.equal(r.deadlocks.length, 1, p);
    assert.deepEqual(r.deadlocks[0].cycle, [1, 2, 1], p);
    assert.equal(r.deadlocks[0].victim, 2, p);
    assert.deepEqual(r.aborted, [2], p);
    assert.deepEqual(r.committed, [1], p);
    assert.equal(r.steps.filter(x => x.status === 'wait').length, 2, p);
  }
  // conservative 2PL predeclares locks: T2 simply waits, no deadlock
  const c = simulate(s, 'conservative2PL');
  assert.equal(c.deadlocks.length, 0);
  assert.deepEqual(c.aborted, []);
  assert.deepEqual(c.committed, [1, 2]);
}
/* basic 2PL releases early -> T2 reads dirty A, then T1 aborts -> cascading rollback;
   strict 2PL holds X(A) until commit so T2 just waits */
{
  const s = parseSchedule('W1(A) R1(B) R2(A) A1 C2');
  const b = simulate(s, '2PL');
  assert.deepEqual(b.aborted, [1, 2]);
  assert.ok(b.steps.some(x => /cascading rollback/.test(x.note)));
  const st = simulate(s, 'strict2PL');
  assert.deepEqual(st.aborted, [1]);
  assert.deepEqual(st.committed, [2]);
}
/* lock curve data: T1 grows to 2 locks, lock point at its X(B) */
{
  const r = simulate(parseSchedule('R1(A) W1(B) C1'), 'strict2PL');
  assert.equal(r.lockPoint[1], 1);
  assert.equal(r.steps[1].peak[1], 2);
  assert.equal(r.steps[2].held[1], 0);
}

/* 9. explicit locks validated against the protocol */
{
  const s = parseSchedule('X1(A) R1(A) W1(A) X1(B) U1(A) S2(A) R2(A) R1(B) W1(B) U1(B) C1 U2(A) C2');
  const b = simulate(s, '2PL');
  assert.equal(b.ok, true);
  assert.equal(b.lockPoint[1], 3);
  const st = simulate(s, 'strict2PL');
  assert.equal(st.ok, false);
  assert.match(st.violations[0].text, /releases X\(A\)/);
  const bad = simulate(parseSchedule('X1(A) R1(A) U1(A) X1(B) W1(B) U1(B) C1'), '2PL');
  assert.equal(bad.ok, false);
  assert.equal(bad.violations[0].at, 3);                     // X1(B) after U1(A)
  assert.equal(simulate(parseSchedule('S1(A) R1(A) X1(B) W1(B) C1 U1(A) U1(B)'), 'rigorous').ok, true);
  assert.equal(simulate(parseSchedule('S1(A) R1(A) X1(B) W1(B) C1'), 'conservative2PL').ok, false);
  assert.equal(simulate(parseSchedule('R1(A) C1'), '2PL').ok, true);   // no explicit locks: auto mode
}

/* 10. basic timestamp ordering: TS(T1)=1 < R-TS(A)=2 -> T1 rolled back */
{
  const r = simulate(parseSchedule('R2(A) W1(A) C1 C2'), 'TO');
  assert.deepEqual(r.aborted, [1]);
  assert.equal(r.steps[1].status, 'abort');
  assert.equal(r.steps[2].status, 'skip');
  const w = simulate(parseSchedule('W2(A) R1(A)'), 'TO');   // read too late
  assert.deepEqual(w.aborted, [1]);
  assert.equal(simulate(parseSchedule('R1(A) W1(A) R2(A) W2(A)'), 'TO').ok, true);
  // explicit timestamps flip who is older
  assert.deepEqual(simulate(parseSchedule('R2(A) W1(A)'), 'TO', { T1: 10, T2: 5 }).aborted, []);
}

/* 11. Korth Thomas' write rule example: R1(Q) W2(Q) W1(Q) */
{
  const s = parseSchedule('R1(Q) W2(Q) W1(Q) C1 C2');
  assert.deepEqual(simulate(s, 'TO').aborted, [1]);
  const t = simulate(s, 'thomas');
  assert.deepEqual(t.aborted, []);
  assert.equal(t.steps[2].status, 'ignored');
  assert.equal(t.steps[2].wts.Q, 2);
}

/* 12. wait-die vs wound-wait (T1 older) */
{
  const olderAsks = parseSchedule('W2(A) W1(A) C1 C2');   // older T1 wants T2's lock
  assert.deepEqual(simulate(olderAsks, 'waitDie').aborted, []);          // older waits
  assert.deepEqual(simulate(olderAsks, 'waitDie').committed, [2, 1]);
  assert.deepEqual(simulate(olderAsks, 'woundWait').aborted, [2]);       // older wounds younger
  const youngerAsks = parseSchedule('W1(A) W2(A) C1 C2'); // younger T2 wants T1's lock
  assert.deepEqual(simulate(youngerAsks, 'waitDie').aborted, [2]);       // younger dies
  assert.deepEqual(simulate(youngerAsks, 'woundWait').aborted, []);      // younger waits
  assert.deepEqual(simulate(youngerAsks, 'woundWait').committed, [1, 2]);
  // ts override: T2 is now older
  assert.deepEqual(simulate(youngerAsks, 'waitDie', { T1: 10, T2: 5 }).aborted, []);
  assert.deepEqual(simulate(youngerAsks, 'woundWait', { T1: 10, T2: 5 }).aborted, [1]);
  assert.equal(simulate(olderAsks, 'none'), null);
  assert.throws(() => simulate(olderAsks, 'OCC'), /Unknown protocol/);
}

/* 13. predict-mode ask: derived answer grades through grade.js */
{
  const keys = Object.keys(VERDICTS);
  const s = 'R1(A) W2(A) W1(A) W3(A)';
  const ask = verdictAsk(undefined, run(s).verdicts, keys, s);
  assert.equal(ask.kind, 'msq');
  assert.equal(ask.options.at(-1), NONE_OPTION);
  assert.deepEqual(ask.answer, [1, 2, 3]);                   // view ser., recoverable, cascadeless
  assert.ok(isCorrect(answerKey(ask), [1, 2, 3]));
  const none = 'R2(A) W1(A) R2(A) C2 W1(A) C1';
  assert.deepEqual(verdictAsk(undefined, run(none).verdicts, keys, none).answer, [5]);
  const mcq = verdictAsk({ kind: 'mcq', q: 'Which holds?', options: ['Conflict serializable', 'View serializable'] }, run(s).verdicts, keys, s);
  assert.equal(mcq.answer, 1);
  assert.throws(() => verdictAsk({ options: ['Deadlock free'] }, run(s).verdicts, keys, s), /not a verdict name/);
  assert.equal(verdictAsk({ q: 'x', options: ['a', 'b'], answer: [0] }, run(s).verdicts, keys, s).answer[0], 0);
}

/* --- extra cases (SQL-J05) --- */

/* 14. Gate Smashers: 2PL deadlock with 2 txns (cited: Gate Smashers - Concurrency Control) */
{
  const sDead = parseSchedule('R1(A) R2(A) W1(A) W2(A) C1 C2');
  const r = simulate(sDead, '2PL');
  assert.equal(r.deadlocks.length, 1);
  assert.deepEqual(r.aborted, [2]);
}

/* 15. Korth: Thomas' write rule skips obsolete write (Korth ch 17-18) */
{
  const s = parseSchedule('W1(A) W2(A) W1(A) C1 C2');
  const t = simulate(s, 'thomas');
  assert.equal(t.steps[2].status, 'ignored');
  assert.deepEqual(t.aborted, []);
}

/* 16. Korth: dirty read leads to nonrecoverable if reader commits (Korth ch 17-18) */
{
  const s = 'W1(A) R2(A) C2 A1';
  assert.equal(v(s, 'recoverable'), false);
  assert.equal(v(s, 'cascadeless'), false);
}

/* 17. Korth Fig. 14.12: view serializable with blind writes (Korth ch 17-18) */
{
  const s = 'R1(A) W2(A) W1(A) W3(A) C1 C2 C3';
  const a = run(s);
  assert.equal(a.verdicts.conflictSerializable.value, false);
  assert.equal(a.verdicts.viewSerializable.value, true);
}

/* 18. Wait-die: younger dies when older holds lock (Korth ch 17-18) */
{
  const s = parseSchedule('W1(A) W2(A) C1 C2');
  const r = simulate(s, 'waitDie');
  assert.deepEqual(r.aborted, [2]);
}

/* 19. Wound-wait: older wounds younger when younger holds lock (Korth ch 17-18) */
{
  const s = parseSchedule('W2(A) W1(A) C1 C2');
  const r = simulate(s, 'woundWait');
  assert.deepEqual(r.aborted, [2]);
}


