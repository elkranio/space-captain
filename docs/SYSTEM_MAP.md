# Space Captain — System Map

Durable ownership/data-flow map. This file describes boundaries, not gameplay history or a catalog of every class.

## Main flow

```text
content / definitions
-> engine/domain state + runners
-> detached snapshots / one-shot events
-> bridge controllers / mappers
-> Phaser views
```

## Engine/domain

`src/engine/**` owns gameplay truth:

- encounter state and mutation;
- officer tasks and command availability;
- weapon/defense lifecycles;
- target validation;
- damage, control and resource rules;
- enemy decision/execution state;
- presentation-safe read models/snapshots.

The engine must not depend on Phaser/app types.

A gameplay fact should have one authoritative owner and one clear mutation path. Do not duplicate mutable truth in a
controller/view merely because presentation also needs it.

### Physical system ownership

Officer work and physical system lifecycles may overlap without sharing ownership.

Typical shape:

```text
officer task
    -> owns crew busy/progress

weapon / defense runner
    -> owns physical commitment, release/fire/deployment and cooldown

projectile / attached effect
    -> may continue after the officer is free
```

Concrete example: Sticky Mine targeting is Gunner work, but the Mine runner owns the physical single release. After
release the Mine fuse and dispenser cooldown are independent of Gunner.

Do not infer a generic phase machine from one weapon family; concrete runners own their real lifecycle edges.

## Snapshot / event boundary

Use the distinction consistently:

```text
event     = something happened once
snapshot  = current state is this
```

Current-state UI should not reconstruct truth from event history. Do not emit duplicate events to mirror data that
already belongs in a snapshot.

Hidden enemy/objective truth may cross to presentation only through an explicitly safe read model.

## Bridge app layer

`src/app/scenes/game/bridge/**` adapts engine truth to Phaser presentation.

Controllers/mappers may:

- translate detached engine snapshots into UI-friendly models;
- route user intent into engine commands;
- coordinate presentation-only selection/animation state.

They must not recreate cooldowns, target legality, hit/miss rules, damage rules or hidden information.

### Encounter orchestration

Keep current ordering explicit:

```text
BridgeEncounterController
-> step EncounterEngine
-> read one detached presentation snapshot
-> persist snapshot state
-> sync MY SHIP dashboard
-> drain one-shot engine events
-> sync combat presentation from the same snapshot
```

Supporting boundaries:

- `BridgeEncounterEngineEventHandler` maps drained engine events to presentation effects/events;
- `BridgeEncounterSnapshotSynchronizer` maps detached current-state snapshots;
- `BridgeEncounterPersistenceSynchronizer` persists continuous snapshot state and structural outcomes;
- `EncounterSnapshotReader` is the detached engine read boundary.

Do not merge these merely to reduce class count; event ordering, snapshot truth and persistence are different
contracts.

The internal-effect sink is synchronous and reserved for immediate engine-owner interactions whose result/order
matters at the call site. Do not turn it into a generic global bus/outbox by default.

## Enemy combat ownership

Enemy behavior stays split by responsibility:

```text
perceived / decision facts
-> EnemyDecisionPolicy chooses work
-> EnemyWorkExecutor revalidates and commits work
-> EnemyCrewTaskRunner owns crew task lifecycle
-> concrete system runners own physical resolution
```

Enemy policy should not receive unrestricted mutable encounter state simply because the engine contains it.

Player/enemy physical equipment rules should converge where the hardware is nominally the same; AI/presentation
asymmetry does not justify different cooldown/resource physics.

## Phaser views

Views own:

- visual objects/layout;
- animation/VFX;
- hover/selection affordances;
- input surfaces.

A view may show advisory progress/timing derived from engine state. Engine command availability remains
authoritative. Presentation animation does not pause simulation unless a real gameplay rule explicitly says so.

## Captain combat board

Current persistent state surfaces:

```text
MY SHIP dashboard | first-person viewscreen | ENEMY SHIP dashboard
```

The bridge may also contain a compact **category danger-indicator** area. This is not an individual threat-card
strip.

Ownership:

- MY SHIP = own Hull/CORE/equipment state + equipment interactions;
- ENEMY SHIP = presentation-safe enemy Hull/equipment state + ship target surfaces;
- viewscreen = concrete spatial/visual combat telegraphy;
- danger indicators = broad incoming-problem category only;
- inline equipment interactions = detailed concrete target choice when that system needs it.

Basic enemy Hull, slot placement and installed-equipment integrity/BROKEN state should not require a second mutable
inspection model.

Beam/Shield intended semantic targets are `HULL | BRIDGE | SLOT(slotId)`. `BRIDGE` is a semantic ship target, not a
reason to invent a fake equipment slot or resurrect a removed dashboard column.

Threat-presentation specifics live in `THREAT_PANEL.md`; durable visual language lives in `BRIDGE_ART_DIRECTION.md`.
