import { getDb, run } from '../../engines/sqlrunner.js';
export default function SqlExercise({ b }) {
  return <button type="button" onClick={async () => { const db = await getDb('x', async () => 'create table t(a int); insert into t values (1);'); console.log(await run(db, 'select * from t')); }}>test {b.type}</button>;
}
