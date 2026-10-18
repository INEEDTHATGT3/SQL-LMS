---
description: Work the next runnable job card (open, all depends done), optionally for one car, e.g. /next SQL
agent: mechanic
---
Next runnable card: !`node jobs/status.mjs next $ARGUMENTS`

If that printed `none`, show the board (`node jobs/status.mjs`), say what is waiting on review or blocked, and stop.
Otherwise work that card. Follow your mechanic instructions and AGENTS.md.
