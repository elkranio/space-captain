# Space Captain — Current Handoff

Date: 2026-08-18

Always re-fetch current `master` before preparing a patch.

## Current state

The large cognitive-load refactor sprint is complete and green.

The follow-up AI-assisted engine simplification slice is also complete. Its
closeout commit is `d54251573df6554dc4d470b0af7ce52ae8f4e726`; treat that SHA as
historical context and still re-fetch current `master` before new work.

The encounter callback-knot audit was closed after five narrow atoms:

- `EnemyCrewTaskRunner` reports timed completions by return value instead of
  completion callbacks;
- the two genuine reverse ownership edges use one tiny synchronous typed
  `EncounterInternalEffect` boundary;
- officer-task combat effects call the stable `CombatRunner` owner directly;
- player weapon runners hold direct narrow references to `CombatRunner` and
  `OfficerTaskRunner`;
- enemy Defense Turret interception calls `CombatMissileRunner` directly.

The stop-audit found **no remaining RED callback/cognitive-load knot**.

Two local `CombatRunner -> EnemyBehaviorRunner` wrapper callbacks remain for
sticky-mine clearing and shield deployment. They are intentionally left alone:
the target is visible in one constructor, the callbacks do not travel through a
chain, and removing them would be cleanup for cleanup's sake.

`destroyEnemyActor` also remains an encounter-owned synchronous callback because
same-step cleanup/removal/event ordering is part of its contract.

The durable dependency rules and current ownership map are now in
`docs/WORKING_RULES.md` and `docs/SYSTEM_MAP.md`. The temporary engine-audit
handoff has been removed.

## Active slice

Resume the canonical combat roadmap in `docs/COMBAT_PLAYTEST_ROADMAP.md`.

Immediate next target:

**Gate A / Step 1 — enemy dashboard redesign.**

Treat enemy visibility as gameplay. The next implementation/design pass should
make the enemy stop feeling like a black box and expose the combat state the
player is currently allowed to understand.

Before changing presentation code, inspect the current engine snapshots,
captain-dashboard mapping and bridge dashboard/view code. Reuse safe engine
truth; do not recreate enemy gameplay state in the app.

Do not start another engine cleanup pass unless new work exposes concrete
cognitive debt, duplicated truth, unclear ownership or repeated bugs.

## Important engine constraints

- Preserve `EncounterEngine.step()` and `CombatRunner.step()` ordering unless a
  focused behavior change explicitly requires otherwise.
- Newly launched player missiles/mines must not consume the same combat step's
  `deltaMs`.
- Enemy crew completion consequences happen before the same actor's next captain
  decision snapshot.
- Enemy destruction remains synchronous and same-step-sensitive.
- Beam/Sticky-Mine damage may interrupt player officer work on their existing
  specific paths; missile damage does not currently share that consequence.
- Public `EncounterEvent` outbox behavior remains separate from the synchronous
  internal-effect boundary.
- `emit`, injected RNG and real listener/tween callbacks are not cleanup targets.

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
4. inspect the exact current source/tests involved in the enemy-dashboard slice.
