# jobs — OpenCode work orders for SQL LMS and DBMS LMS

**Run (Dhruv):** open OpenCode in `C:\MEGA NZ\SKILLS MATERIAL\sql-lms`, then

```
/next              work the next runnable card (or /job SQL-J04 for a specific one)
/inspect SQL-J04   read-only check; passes it to done or sends it back
/jobs              board: status, minutes, what each card waits on
```

Approve the commands the mechanic asks for (`node`, `npm`, `npx` run without asking; anything else asks). One card at a time; cards J04–J07 have no prerequisites and can go in any order.

**Order:** SQL J01–J08 (blocks) → J21 (approach ladder + answer files) → J09–J17 (content, one module each) → J18 (sourcing) → J22–J29 (answer payloads) → J19 (docs) → J20 (final gate). DBMS-J01 runs after SQL-J21 and creates `dbms-lms/` with its own copy of this board; DBMS-J02+ then run from OpenCode opened in `dbms-lms`.

**Status:** open → doing → review → done (or blocked). The mechanic sets doing/review/blocked; only the inspector or Dhruv sets done. `node jobs/status.mjs set` mirrors every change to the Obsidian pit wall (`SQL LMS` / `DBMS LMS` cars), so DO NOW stays current.

**Masters:** cards and SPECs were exported from the vault (`DJ THINKING/PROJECTS ARCHITECTURE/SQL LMS` and `DBMS LMS`). Status and Reports live here; the vault copy gets status + one-line notes.
