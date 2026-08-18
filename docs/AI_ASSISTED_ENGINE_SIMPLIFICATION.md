# Space Captain — AI-Assisted Engine Simplification

Status: **ACTIVE TEMPORARY ENGINE REFACTOR HANDOFF**

Audit baseline: `cd2e37d1cf489e6e27f07eecbc0764c9214f6f64`

Delete or merge this document after the slice is complete. It exists so a fresh
chat can resume the work without reconstructing the discussion from history.

## Why this slice exists

The repository already completed a large cognitive-load refactor sprint. This
follow-up is narrower.

The question is not:

> Is the architecture academically clean?

The question is:

> How much code/context must an AI coding agent reconstruct before it can safely
> change one behavior?

For this project, lower AI cognitive cost means:

- fewer files required to understand one behavior;
- fewer dependencies whose real target is hidden behind callback wrappers;
- fewer plausible-but-wrong paths for the same concept;
- obvious owners and mutation paths;
- synchronous ordering visible from code structure;
- boring direct code rather than dependency-injection ceremony.

The normal project rule still dominates: **prefer the simplest implementation
that satisfies the current concrete requirement.**

## Audit result

A read-only AST audit scanned:

```text
296 TypeScript/TSX files
src/app/**
src/engine/**
```

The audit intentionally over-reported candidates. Its score is not a quality
metric.

Important manual conclusions:

### GREEN — do not "fix" these because of the audit

- `BridgeEncounterEngineEventHandler` scored highest because it emits many
  presentation events. It remains a linear, discoverable translation switch.
  Do not split it merely because it is large.
- Bridge event subscriptions are mostly real event semantics with matching
  `on/off` lifecycle. They are not the callback problem being addressed here.
- `emit: (event: EncounterEvent) => void` is a legitimate public event-outbox
  sink.
- `random: () => number` is a legitimate deterministic-test/seed seam.
- Tween/animation `onComplete` and UI callbacks are real callback semantics.
- `EncounterSnapshotReader.read(select)` is intentionally a function-based read
  API.
- Wide math/rendering signatures are not automatically debt.
- File/import count alone is not a reason to split code.

Audit sanity checks also found only three anonymous listener subscriptions and no
`.bind(this)` calls. The problem is not "callbacks everywhere".

### YELLOW — separate presentation concern

`BridgeObjectsAnimationContext` has 10 members, 8 of them functions, and
`BridgeObjectsView`/`BridgeObjectsAnimationSequencer` build wrapper callbacks
around shared animation state.

This may be worth simplifying later, but it is **not part of the current engine
slice**. Do not mix it into the encounter refactor.

### RED — encounter callback knot

The real cognitive debt is concentrated around:

```text
EncounterEngine
CombatRunner
OfficerTaskRunner
OfficerTaskEffects
PlayerWeaponRunner
EnemyBehaviorRunner
EnemyCrewTaskRunner
```

Several callbacks are not true event/listener boundaries. They are synchronous
calls to a stable neighboring owner, threaded through intermediate layers to
avoid object dependency cycles.

That makes the real target of an operation expensive to discover.

## Current callback knot

Simplified current graph:

```text
                    EncounterEngine
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
  OfficerTaskRunner   CombatRunner   PlayerWeaponRunner
          ^               ^               ^
          |               |               |
          +---- callback knot / cross-owner calls -----+
                          |
                  EnemyBehaviorRunner
                          |
                  EnemyCrewTaskRunner
```

### Officer tasks -> combat

`OfficerTaskRunner` / `OfficerTaskEffects` receive callbacks for:

```text
purgeSpamChannel(channelId)
clearStickyMine(mineId)
```

The real owner is `CombatRunner` and its concrete combat-family runners.

### Combat -> officer tasks

Damage from the current Beam/Sticky-Mine paths can call:

```text
OfficerTaskRunner.interruptRandomTaskByDamage()
```

The callback is currently threaded through `CombatRunner` and concrete physical
runners.

This reverse edge creates an ownership cycle with the previous task -> combat
edge.

### Player weapons -> combat

Player weapon-family runners receive callback wrappers for physical work such as:

```text
queuePlayerMissileLaunch(...)
queuePlayerStickyMineAttach(...)
```

The real owner is `CombatRunner`.

### Player weapons -> officer tasks

Player weapon-family runners receive:

```text
completeOfficerTask(taskId)
```

The real owner is `OfficerTaskRunner`.

### Enemy behavior -> player weapon SPAM

Enemy Science finishing PURGE SPAM currently threads a callback through:

```text
CombatRunner
-> EnemyBehaviorRunner.step(...)
-> EnemyCrewTaskRunner.advance(...)
-> advanceActorTasks(...)
-> advanceTimedTask(...)
-> advancePurgeSpam(...)
```

and eventually reaches:

```text
PlayerWeaponRunner.purgeSpamChannel(...)
```

This is the clearest high-cost callback chain.

### EnemyCrewTaskRunner completion callbacks

`EnemyCrewTaskRunner` currently receives completion callbacks for:

```text
shield deployment completed
sticky-mine clearing completed
threat identification completed
```

and receives SPAM purge completion as an additional per-`advance()` callback.

These callbacks are child -> parent completion reporting. They do not need a bus.

### Enemy defense turret -> missile runner

`EnemyDefenseTurretRunner` receives an `interceptPlayerMissile(...)` callback.

The real owner is the already-existing `CombatMissileRunner`.

## Target communication rules

Use this decision order.

```text
same/stable known owner operation
    -> direct owner method call

child synchronously reports completion to its parent
    -> return a result

real event/listener/lifecycle callback or injected RNG
    -> callback stays

direct dependency would create a real ownership cycle
    -> smallest explicit typed synchronous internal effect
```

Do not optimize for zero callbacks. Optimize for **obvious semantics**.

A callback should have a reason to be a callback.

## What NOT to build

Do not solve this slice with:

- a global mutable `EncounterRuntime` singleton;
- a service locator / global dependency bag;
- a generic engine event bus with hidden subscribers;
- an ECS;
- a generic command/message framework;
- a queue where every ordinary method call becomes a message;
- one universal `Context`/`Services` object;
- generic weapon/turret/task lifecycle infrastructure.

A hidden global dependency makes signatures smaller but makes code discovery
worse. For AI-assisted work that is usually a bad trade.

## Internal effect boundary — current preferred shape

After simpler callback removal, two genuine reverse ownership edges are expected
to remain:

```text
Combat -> OfficerTaskRunner
Combat -> PlayerWeaponRunner
```

The preferred escape hatch is **one tiny synchronous typed boundary**, not a
queued bus.

Initial effect vocabulary should describe the exact operation currently
performed, not a broader fact that accidentally changes semantics.

Conceptually:

```ts
type EncounterInternalEffect =
    | {
          kind: "interrupt_random_player_officer_task";
      }
    | {
          kind: "purge_player_spam_channel";
          channelId: string;
          targetActorId: string;
      };
```

The exact names may change during implementation, but the distinctions are real
and therefore justify a discriminated union.

One dispatcher belongs at the encounter composition boundary:

```text
producer
-> typed internal effect
-> ONE obvious synchronous dispatcher
-> real owner
-> return to producer
```

### Why the effect is synchronous

Do **not** default to:

```text
push effect
-> continue the frame
-> flush later
```

Current combat ordering is gameplay-critical. A queued outbox would require
multiple flush checkpoints and would start dictating architecture.

Synchronous dispatch preserves current call-order semantics while still making
the cross-owner escape hatch searchable and explicit.

### Important naming warning

Do not generalize the interruption effect to something like
`PLAYER_SHIP_DAMAGED` without verifying gameplay.

Current code threads officer interruption through specific Beam/Sticky-Mine
paths. Incoming missile damage does not currently use that callback.

A broad "player damaged" effect could silently make missiles interrupt officer
tasks and therefore change gameplay.

Preserve the exact current consequence first.

## Ordering contracts that must not drift

### EncounterEngine step order

Current high-level order is:

```text
PowerCoreRunner
ShieldGeneratorRunner
PlayerDefenseTurretRunner
OfficerTaskRunner
advance actor Evades
PlayerWeaponRunner
player Evade lifecycle completion
CombatRunner
cancel officer tasks with missing targets
```

Do not reorder this slice unless a focused lifecycle test proves the change is
intentional.

### CombatRunner step order

Current high-level order is:

```text
advance existing enemy shield lifetime
capture IDs of combat objects that existed before this combat step
integrate pending player missile/mine objects
resolve only the previously-existing physical combat objects
advance enemy behavior / crew / captain decisions
advance enemy physical combat systems
synchronize enemy crew tasks
```

The queued-player-object rule is especially important:

Player weapon work happens before `CombatRunner`, but newly queued physical
missiles/mines are integrated after the existing-object ID snapshot. Therefore
they exist during the combat step but do **not** consume that step's `deltaMs`.

Do not accidentally make a newly launched object advance immediately.

### Enemy behavior ordering

Enemy crew completion currently happens before the same actor's new captain
decision in that step.

If a crew task finishes a defensive/cleanup action, the consequence must be
applied before the captain decision snapshot that follows.

### Enemy destruction ordering

Enemy destruction is currently synchronous and sensitive to same-step physical
resolution.

A lethal player hit can remove the actor and clean player combat objects
targeting that actor before later same-step resolutions inspect them.

Do not queue/defer enemy destruction casually.

For this reason `destroyEnemyActor` is explicitly **not** an early target for the
internal-effect conversion.

## Target graph

Desired direction after this slice:

```text
                         EncounterEngine
                               ^
                               |
                     tiny synchronous
                    internal-effect sink
                               |
                         CombatRunner
                      /      |       \
                     /       |        \
                    v        v         v
               missiles    mines     beams
                    |
                    +--> EnemyBehaviorRunner
                              |
                              v
                       EnemyCrewTaskRunner
                              |
                       returns completions

OfficerTaskRunner -----------------> CombatRunner

PlayerWeaponRunner ----------------> CombatRunner
       |
       +----------------------------> OfficerTaskRunner
```

The normal graph should be close to a DAG. The very small number of real reverse
edges cross the explicit internal-effect boundary rather than being hidden as
many unrelated callbacks.

## Atom plan

Do not implement several steps at once merely because the target architecture is
known.

### Atom 1 — EnemyCrewTaskRunner reports completions by return value

This is the immediate next atom.

Goal:

Remove child -> parent completion callbacks from `EnemyCrewTaskRunner`.

Current callbacks to eliminate from this child boundary:

```text
onShieldDeploymentCompleted
onStickyMineClearingCompleted
onThreatIdentificationCompleted
onSpamPurgingCompleted
```

Target behavior:

```text
EnemyBehaviorRunner
    -> crewTaskRunner.advance(deltaMs)
    -> receives completed timed task result(s)
    -> handles each completion synchronously
    -> only then continues to captain decision logic
```

For this atom, keep the existing `EnemyBehaviorRunner` outer dependencies
(`deployEnemyShield`, `clearPlayerStickyMine`, `purgePlayerSpamChannel`) if doing
so keeps the change narrow. The goal is to remove callback threading **inside
EnemyCrewTaskRunner**, not solve the entire knot at once.

If a small result type is needed to preserve actor identity plus completed task,
that is a meaningful type and is allowed. Do not invent extra wrapper layers.

Acceptance:

- no completion callbacks in `EnemyCrewTaskRunnerOptions`;
- no SPAM completion callback parameter threaded through `advance`,
  `advanceActorTasks`, `advanceTimedTask`, `advancePurgeSpam`;
- completion side effects still happen synchronously before captain decision;
- behavior/tests remain unchanged.

### Atom 2 — introduce the tiny synchronous internal-effect boundary

Only after Atom 1 is green.

Replace the two high-cost reverse callback paths:

```text
interruptRandomOfficerTask
purgePlayerSpamChannel
```

with the typed synchronous encounter internal-effect boundary.

Expected consequences:

- remove per-step interruption callback parameters from `CombatRunner`;
- stop threading interruption through Beam/Sticky-Mine method signatures;
- remove `purgePlayerSpamChannel` from the `CombatRunner.step` /
  `EnemyBehaviorRunner.step` chain;
- one searchable dispatcher in `EncounterEngine`;
- public `EncounterEvent` outbox remains unchanged;
- no queue/flush/checkpoint system.

### Atom 3 — direct OfficerTask -> Combat owner dependency

After the reverse Combat -> OfficerTask callback is gone, replace:

```text
purgeSpamChannel callback
clearStickyMine callback
```

with a direct reference to the real combat owner.

Expected simplification:

```text
OfficerTaskEffects
-> CombatRunner.purgeSpamChannel(...)
-> CombatRunner.clearStickyMine(...)
```

Do not create a new "combat service interface" just to avoid importing the real
owner unless a concrete cycle proves it necessary.

### Atom 4 — direct PlayerWeapon owner dependencies

After `PURGE_PLAYER_SPAM_CHANNEL` no longer creates a reverse object dependency,
replace obvious wrappers such as:

```text
queuePlayerMissileLaunch
queuePlayerStickyMineAttach
completeOfficerTask
```

with direct stable owner references where they reduce hops.

Prefer:

```text
PlayerWeaponRunner -> CombatRunner
PlayerWeaponRunner -> OfficerTaskRunner
```

over one callback per method.

Do not force `destroyEnemyActor` into this atom.

### Atom 5 — local enemy defense-turret dependency

Replace the local:

```text
interceptPlayerMissile(...)
```

callback with a direct `CombatMissileRunner` dependency if the current source
still supports that simple construction order.

This is a local CombatRunner-owned sibling relationship and does not justify an
event bus.

### Atom 6 — rerun the AI cognitive audit and stop unless RED remains

After the previous atoms:

- rerun the same audit;
- manually inspect remaining callback dependencies;
- compare number of hops, not merely callback count;
- stop the engine slice if the remaining callbacks have honest semantics.

Possible later watch points, not automatic work:

```text
destroyEnemyActor ordering/wiring
BridgeObjectsAnimationContext
```

Do not manufacture more cleanup work.

## Tests and validation strategy

Each atom must preserve behavior.

Use the normal project validation floor from `WORKING_RULES.md`.

For this slice, focused tests should prioritize the exact ordering contracts
touched by the atom, especially:

- enemy crew task completion;
- enemy SPAM purge;
- enemy shield deployment completion;
- enemy sticky-mine clearing completion;
- enemy threat identification completion;
- Beam/Sticky-Mine officer interruption;
- player weapon task completion;
- player missile/mine launch same-step timing;
- target-loss/destruction ordering where touched.

Run full tests before push.

Runtime smoke is required if an atom changes gameplay execution paths even when
the intended behavior is "no behavior change".

## Success condition

This slice is done when a fresh reader can follow encounter cross-system work
mostly as:

```text
direct owner call
or
child returns result
or
one explicit typed cross-cycle effect
```

and no longer needs to climb several layers of callback parameters to discover
the real operation.

Then:

1. remove/merge this temporary document;
2. refresh `CURRENT_HANDOFF.md`;
3. resume `COMBAT_PLAYTEST_ROADMAP.md` with enemy dashboard redesign.
