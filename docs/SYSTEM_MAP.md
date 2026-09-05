# Space Captain — System Map

Durable ownership map. This file describes boundaries, not a historical list of every class.

## Main flow

```text
content / definitions
    -> engine/domain state + runners
    -> encounter presentation snapshot + events
    -> bridge controller / mapper
    -> Phaser views
```

## Engine/domain

`src/engine/**` owns gameplay truth:

- encounter state and mutation;
- officer tasks and command availability;
- weapon/defense lifecycles;
- hit, damage, interruption and resource rules;
- enemy decision/execution state;
- current read models and presentation snapshots.

The engine must not depend on Phaser/app types.

A gameplay fact should have one authoritative owner and one clear write path. Do not create a second mutable copy in a
controller or view.

### Mine targeting and physical release

`GUNNER_FIRE_STICKY_MINES` owns player targeting time and the target actor. `OfficerTaskRunner` advances its elapsed time;
`PlayerStickyMineDispenserRunner` mirrors progress to installed equipment, commits one Mine and cooldown, and completes
the task. Timed progress does not mean timer-owned completion: the physical weapon runner owns the release edge.

For enemies, `EnemyWorkExecutor` starts `TARGETING`; `CombatStickyMineRunner` advances crew-scaled targeting using the
same officer-task duration. `EnemyCrewTaskRunner` releases Gunner when the weapon returns to COOLDOWN/READY.
`get_enemy_captain_decision_snapshot.ts` reports that same targeting duration as the prospective busy duration.

`CombatStickyMineRunner` owns attachments, Evade resolution, independent world-time fuses, clearing/detonation and target
cleanup in both directions. There is no automatic salvo, dispensing phase, release counter or separate stored salvo target.
`combat_presentation_snapshot.ts` supplies targeting duration and mirrored elapsed time; the dashboard mapper derives
`targetingProgress` and the active task's cancellation id. The equipment tile presents them without a second clock.

## Encounter presentation boundary

The encounter presentation snapshot is a coherent detached frame of what is true now and safe for presentation.

Use the distinction consistently:

```text
event     = something happened once
snapshot  = current state is this
```

Do not force current-state UI to reconstruct truth from event history. Do not emit duplicate events merely
to mirror data that already belongs in a snapshot.

Hidden enemy/objective truth must cross into presentation only through an explicitly safe read model.

## Bridge app layer

`src/app/scenes/game/bridge/**` is the adapter between engine truth and Phaser presentation.

Controllers/mappers may:

- translate engine snapshots into UI-friendly immutable models;
- route user intent into engine commands;
- coordinate presentation-only state/effects.

They must not recreate gameplay legality, cooldowns, hit/miss rules or hidden information.

### Current encounter orchestration

Keep the current bridge encounter responsibilities explicit rather than hiding them behind one generic sync call:

```text
BridgeEncounterController
    -> owns app-layer encounter interactivity and scene-flow decisions
    -> steps EncounterEngine
    -> reads one detached presentation snapshot
    -> persists snapshot state
    -> syncs MY SHIP dashboard from that snapshot
    -> drains one-shot engine events
    -> syncs combat presentation from the same snapshot
```

This is the order in `BridgeEncounterController.step`; task cancellation uses the same post-mutation order.
Keep the two snapshot synchronization stages on their respective sides of event draining.
Source: `src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts`.

Supporting boundaries:

- `BridgeEncounterEngineEventHandler` maps one drained engine event to presentation events/effects; it does not own
  encounter interactivity or scene transitions;
- `BridgeEncounterSnapshotSynchronizer` maps detached current-state snapshots to persistent bridge presentation;
- `BridgeEncounterPersistenceSynchronizer` persists both continuous snapshot state and structural event outcomes;
- `EncounterSnapshotReader` is the detached engine read boundary; `EncounterEngine` intentionally exposes granular query
  façade methods rather than forcing every caller through one giant presentation snapshot.

Do not merge these only to reduce file/class count. Their split is useful because event ordering, snapshot truth and
persistence lifecycle are different contracts.

The encounter internal-effect sink is also intentionally **synchronous**, not an outbox. It exists only for immediate
engine ownership cycles whose result/order matters at the call site.

## Phaser views

Views own visual objects, layout, animation and input surfaces.

A view may show advisory timing/progress derived from engine snapshot data, but engine command availability remains
authoritative. Presentation animation must not pause simulation unless an explicit gameplay rule says so.

## Enemy combat ownership

Enemy behavior remains split by responsibility:

```text
perceived / decision facts
    -> EnemyDecisionPolicy chooses work
    -> EnemyWorkExecutor revalidates and commits work
    -> crew/system runners own lifecycle and physical resolution
```

Enemy policy should not receive unrestricted mutable encounter state just because the engine contains it.

## Captain combat board

The captain combat board consumes mapped encounter presentation data through the same authoritative snapshot/read-model
boundary.

Confirmed target composition:

```text
compact threat strip
MY SHIP dashboard | ENEMY SHIP dashboard
```

MY SHIP is the primary control surface. ENEMY SHIP is the persistent basic state/target surface. Basic enemy
Hull, slot placement and installed-equipment integrity/BROKEN state should not require a separate mutable inspection model.
Slots own spatial identity; installed equipment owns integrity and operational truth.

Both current ship dashboards use a shared HULL/header presentation plus an exact 4x3 equipment grid. The superseded
BRIDGE/HULL special column is gone; do not preserve gameplay semantics for a removed presentation region.

Direct targeting may use visible ship slots, Hull presentation or threat cells as interaction surfaces, but the engine
still owns command availability and exact targets. Views only expose/highlight engine-resolved actions.

Deeper Scientist inspection may add presentation-safe information later without replacing or gating the basic enemy board.

Threat presentation specifics live in `THREAT_PANEL.md`.
