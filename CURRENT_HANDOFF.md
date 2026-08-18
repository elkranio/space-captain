# Space Captain — Current Handoff

Date: 2026-08-18

Always re-fetch current `master` before preparing a patch.

## Current state

The cognitive-load refactor sprint is complete and the repository is green.

The rebuilt bridge is the current presentation baseline.

Durable gameplay rules live in `docs/GAMEPLAY_CONTRACTS.md`.
Architecture/ownership lives in `docs/SYSTEM_MAP.md`.
Permanent workflow rules live in `docs/WORKING_RULES.md`.

## Next active slice

The canonical combat sequence lives in `docs/COMBAT_PLAYTEST_ROADMAP.md`.

The next implementation target is the **enemy dashboard redesign**.

After that:
1. player dashboard functional redesign;
2. Science enemy scan;
3. Beam Cannon semantic node targeting;
4. shared combat-effect model;
5. starter/basic gun experiment;
6. weapon hit-effects pass;
7. EMP experiment;
8. second Helm combat command.

## Temporary/debug context worth preserving

- The opening disruption pulse is a real one-shot mechanic. Automatic use is
  currently controlled from the app-side combat-start debug boundary while
  combat behavior is being tested. Do not delete the mechanic as dead code.
- The disposable bridge debug layer is still intentionally retained. Its cleanup
  is tracked in `docs/BACKLOG.md`.

## Startup

Follow `docs/WORKING_RULES.md`:
1. read this handoff;
2. read every Markdown document in `docs/`;
3. re-fetch current `master`;
4. inspect the current source/tests touched by the next atom.
