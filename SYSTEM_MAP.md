# Space Captain — System Map

Compact ownership map for fresh coding chats.

Updated: 2026-08-15
Reference HEAD: `e7fb792e430d6745ae50c7d7ddb84513fe5bc918`

## High-level layers

### `src/engine/...`

Gameplay/domain/runtime truth.

Owns:
- universe/run state;
- encounter state;
- navigation;
- officer commands/tasks/availability;
- enemy behavior;
- combat actors/weapons/threats;
- Power Core;
- Shield Generator / Active Shield;
- Defense Turret;
- hidden missile truth + observer intel;
- snapshots/events.

No Phaser dependencies should leak into engine definitions.

### `src/app/...`

Application/presentation layer.

Owns:
- scenes/controllers;
- bridge event bus;
- mapping safe engine snapshots/events to view payloads;
- captain dashboard;
- Phaser views/VFX;
- persistent `GameRuntime` synchronization.

App must not recreate gameplay rules or read hidden missile truth.

### `tools/content-editor/...`

Local design/content tooling.

Owns:
- collection navigation/grouping;
- schema-driven editing UI;
- dirty/save/delete/add flows;
- whitelisted local server operations;
- referenced-delete validation;
- asset/reference controls where justified.

It edits normal tracked content files; it is not runtime gameplay infrastructure.

## Content data flow

```text
plain JSON content
    -> Zod schema validation
    -> typed/catalog projection
    -> engine/factories

same JSON + schema metadata
    -> local content editor
    -> validated whitelisted save
    -> tracked repo files
```

Do not create a second editor database or duplicate gameplay rules in editor validation.

## Ship Weapon content architecture

```text
missile_launchers.json
beam_cannons.json
spam_projectors.json
sticky_mine_dispensers.json
        ↓
family schemas
        ↓
src/engine/content/catalogs/ship_weapons.ts
        ↓
unified SHIP_WEAPONS
```

Rules:
- editor groups all four under `Ship Weapons`;
- each family has independent CRUD/schema shape;
- `ShipWeaponId = string` allows editor-created IDs;
- stable builtin `SHIP_WEAPON_ID.*` constants remain convenience aliases;
- cross-family duplicate IDs are rejected;
- referenced delete is blocked where real references exist;
- editor grouping does not imply a runtime inheritance hierarchy.

There are no standalone Missile or Sticky Mine content entities.

## Debug Start

`debug_start.json` is the canonical editable development loadout.

Current handoff baseline:
- player maxHull 30;
- player BASIC drive/core/shield/turret;
- player weapon slots = 4 × Missile Launcher;
- enemy BASIC ship/defense;
- enemy weapon slot 1 = Missile Launcher, remaining slots empty.

Runtime install IDs are concrete per installed instance, so duplicate same-kind/player weapon definitions are supported.

Tests should derive mutable Debug Start values when the contract under test is not specifically about that value.

## Encounter composition

`EncounterEngine` is the public facade/composition root.

`EncounterState` is authoritative mutable encounter truth.

Important responsibilities/components include:
- state store/snapshot readers;
- officer task/command flow;
- `CombatRunner`;
- Power Core lifecycle;
- Shield Generator / Active Shield;
- Defense Turret;
- enemy behavior/crew;
- event outbox.

Do not split `EncounterEngine` merely because it is central.

## Encounter presentation snapshot

`EncounterPresentationSnapshot` is the normal detached app-facing frame root and is not a second state.

It composes:
- navigation;
- safe encounter-space geometry/visual IDs;
- player systems/officers;
- enemy telemetry;
- threats;
- real command availability.

Normal bridge frame consumers should reuse one coherent snapshot instead of reconstructing the same frame through unrelated getters.

Events answer **what just happened**.
Snapshots answer **what is true now**.

Hidden missile truth must not leak through either boundary.

## CombatRunner ownership and step order

`CombatRunner` owns top-level combat orchestration and delegates concrete mechanics.

Important current ordering:
1. advance existing shields/system timing as defined;
2. capture IDs for combat objects that existed before the step;
3. integrate pending player combat objects;
4. resolve/advance previously existing projectiles/mines;
5. advance enemy behavior;
6. advance enemy combat systems;
7. synchronize/finalize enemy crew tasks.

This ordering intentionally prevents newly created combat objects from automatically consuming the same step’s entire `deltaMs`.

Physical lifecycle stays mechanic-specific:
- Missile runner;
- Beam Cannon runner;
- Sticky Mine runner;
- SPAM runner;
- Defense Turret runner;
- player weapon runners;
- Power Core / Shield Generator runners.

Do not unify runners solely because they share phase/timing vocabulary.

## Weapon phase vocabulary

`SHIP_WEAPON_PHASE` currently contains:
- READY
- TARGETING
- CHARGING
- CHANNELING
- DISPENSING
- COOLDOWN

This is a shared vocabulary, not a requirement that every weapon traverse every phase.

Known stale current behavior:
- one global `SHIP_WEAPON_TARGETING_DURATION_MS` is used too broadly;
- it comes from `ship_weapon_rules.json -> enemy_targeting.durationMs`;
- both player and enemy runners currently consume it.

Selected cleanup:
- Missile uses TARGETING/LOCKING;
- Beam skips TARGETING and starts CHARGING;
- SPAM skips TARGETING and starts CHANNELING;
- Mines skip TARGETING and start DISPENSING;
- warning/telegraph comes from real weapon-start phases.

Do not solve this by setting the global duration to zero and leaving a dead semantic phase everywhere.

## Enemy behavior boundary — CURRENT

The current enemy behavior path is:

```text
EncounterState + actor
    ↓
getEnemyCaptainDecisionSnapshot(...)
    ↓
detached/perceived decision facts
    ↓
EnemyDecisionPolicy
    ↓
one EnemyWorkIntent
    ↓
EnemyWorkExecutor
    ↓
authoritative revalidation / resource commit / task or system start
    ↓
EnemyCrewTaskRunner + specialized physical runners
```

### `EnemyDecisionPolicy`

Chooses WHAT work to attempt from detached decision context.

It does not own full mutable `EncounterState`.

### `EnemyWorkExecutor`

Physical command boundary.

Owns:
- authoritative revalidation;
- resource commitment;
- starting concrete crew/system work;
- starting the physical weapon phase appropriate to the command.

Do not reintroduce the old `EnemyTaskScheduler` name into docs/code. Current implementation uses `EnemyWorkExecutor`.

### `EnemyCrewTaskRunner`

Owns lifecycle/occupancy of enemy crew tasks and synchronizes them with the physical system phase.

### `EnemyThreatObserver`

Owns the perception boundary between objective combat truth and what enemy Science/captain can know.

Do not bypass this boundary for convenience.

## Missile epistemic boundary

```text
Missile Launcher physical definition
    ↓ launch
Missile projectile
    physical snapshot + hidden runtime signature
    ↓
observer / Science intel
    UNKNOWN | UNCERTAIN | CONFIRMED
    ↓
interception resolver
    correct hypothesis => guaranteed
    wrong/no hypothesis => blind turret chance
    ↓
safe presentation
```

Rules:
- objective projectile signature stays engine-only;
- concrete internal hypothesis stays engine-only;
- app gets only allowed player-visible intel;
- current BASIC blind intercept chance = 0.4.

### Orphan projectile ownership

Do not reconstruct missile hostility/actionability by looking up the current source actor.

Once a missile exists and targets `PLAYER_SHIP`, it remains a valid physical threat after source actor destruction.

## Enemy destruction / simulation ownership

Enemy death has two independent concerns:

### Engine/domain
- actor is destroyed/removed as defined;
- surviving physical threats continue;
- encounter simulation continues.

### App/presentation
- local destruction/explosion view may run for ~600 ms;
- the visual completion event may clean up presentation;
- it must not pause `EncounterEngine.step()`;
- it must not own `isEncounterInteractive = true/false`.

Do not create a global combat pause/end state to solve a presentation animation problem.

## Bridge synchronization

### `BridgeEncounterPersistenceSynchronizer`

Single owner for encounter -> persistent `GameRuntime / RunState` write-back.

Snapshot-backed persistence includes current persistent ship/system/loadout/navigation state where defined.

Event-backed persistence includes discrete mutations such as hull damage/destroyed persistent enemy actor where defined.

### `BridgeEncounterSnapshotSynchronizer`

Continuously changing frame -> bridge presentation events/views.

Responsibilities include:
- player ship dashboard;
- player/enemy shields;
- incoming/outgoing missiles;
- sticky mines;
- Beam Cannon threats;
- SPAM;
- captain context.

### `BridgeEncounterEngineEventHandler`

Consumes discrete encounter events and maps them to bridge presentation/VFX events.

Important:
- it must not make presentation animation own engine simulation;
- generic targeting-warning ownership is selected for cleanup alongside weapon-specific targeting semantics.

## Captain dashboard mapping

### `BridgePlayerWeaponStatusMapper`

Normalizes concrete installed player weapon state/timing/ammo/catalog information.

Duplicate same-kind weapons are separate rows/objects keyed by runtime installed weapon ID.

### `BridgePlayerShipDashboardMapper`

Builds stable OUR SHIP status/actions from engine-derived state and real commands.

### `BridgeCaptainCombatContextMapper`

Builds enemy/threat context from safe presentation snapshots plus real command availability.

Do not merge these mappers merely because one screen consumes them.

## Threat presentation architecture

Current long horizontal threat rows are implementation scaffolding, not domain architecture.

Selected visual direction is a compact fixed-footprint threat object:
- one object per concrete threat;
- icon + countdown;
- compact intel code;
- stable action slots;
- supports roughly 4–5 objects in one horizontal row;
- visual grouping must not aggregate or erase runtime threat identity.

Keep specialized threat views/mappers while interactions differ. Do not build a generic threat framework prematurely merely because the tiles share geometry.

## Crew progress effects

`getActiveCrewProgressEffects()` is the canonical read model for active crew-progress modifiers including SPAM.

Extend it only when a real new modifier needs the same semantics.

## Local content editor seams

Current useful seams:
- JSON + Zod -> runtime catalog;
- collection registry metadata;
- cross-content references/delete validation;
- generic content reference dropdown metadata;
- asset buckets;
- family-specific CRUD.

Do not return to generic editor architecture work unless a concrete combat/content workflow requires it.
