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
    -> owns app-layer encounter interactivity
    -> steps EncounterEngine
    -> persists current snapshot state
    -> syncs current presentation state
    -> drains one-shot engine events in explicit order
```

Supporting boundaries:

- `BridgeEncounterEngineEventHandler` maps one drained engine event to presentation events/effects;
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
Hull/slots/BROKEN state should not require a separate mutable inspection model.

Direct targeting may use visible ship slots or threat cells as interaction surfaces, but the engine still owns command
availability and exact targets. Views only expose/highlight engine-resolved actions.

Deeper Science inspection may add presentation-safe information later without replacing or gating the basic enemy board.

Threat presentation specifics live in `THREAT_PANEL.md`.
