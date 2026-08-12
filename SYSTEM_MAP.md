# Space Captain — System Map

A compact ownership map for fresh coding chats.

## High-level layers

### `src/engine/...`
Pure gameplay/domain/runtime truth.

Owns:
- universe/run state
- encounter state
- navigation
- officer commands/tasks/availability
- enemy behavior
- combat actors/weapons/threats
- defense capacitor
- Shield Emitter / Active Shield
- snapshots/events

No Phaser dependencies should leak into engine definitions.

### `src/app/...`
Presentation/application layer.

Owns:
- scenes/controllers
- bridge event bus
- mapping engine snapshots to view payloads
- captain dashboard
- Phaser views/VFX
- persistent `GameRuntime` synchronization

App must not recreate combat rules.

## Encounter composition

`EncounterEngine` is the public facade/composition root.

Important children include:
- state store / snapshot reader
- officer task/command flow
- `CombatRunner`
- `DefenseCapacitorRunner`
- `ShieldEmitterRunner`
- enemy task scheduler/crew logic

Do not split `EncounterEngine` merely because it is central; split only if ownership becomes unclear.

## Combat runner ownership

Physical combat lifecycle is divided by mechanic.

Important current runners:
- missile
- laser
- sticky mine
- spam
- enemy point defense
- player weapon runners
- defense capacitor
- shield emitter

Sticky mines are already symmetrical at the combat-state level: one runner owns both enemy→player and player→enemy attached mines.

## Enemy behavior boundary

### `EnemyDecisionPolicy`
Chooses what an idle enemy role wants to do.

### `EnemyTaskScheduler`
Validates the selected work against physical state, starts the crew task and starts weapon/defense phases.

### `EnemyCrewTaskRunner`
Advances enemy crew tasks and invokes completion callbacks.

### `EnemyThreatObserver` / `EnemyScienceIntelResolver`
Own enemy observation/report behavior; objective combat state stays elsewhere.

This split is intentional. Avoid a new enemy god object.

## Bridge synchronization

### `BridgeEncounterRuntimeSynchronizer`
Encounter → persistent `GameRuntime` state where persistence is appropriate.

### `BridgeEncounterSnapshotSynchronizer`
Continuously changing encounter read models → bridge events/views.

Currently synchronizes:
- player ship dashboard
- active player shield
- incoming/outgoing missiles
- outgoing/player-attached sticky mines
- laser threats
- captain combat context

### `BridgeEncounterEngineEventHandler`
Consumes discrete encounter events and triggers bridge presentation/VFX.

### `BridgeEncounterLoadPresenter`
Load/start presentation extracted from event handler; keep it separate.

## Captain dashboard mapping

### `BridgePlayerWeaponStatusMapper`
Normalizes player weapon state/timing/ammo/catalog details for UI.

### `BridgePlayerShipDashboardMapper`
Builds stable player-ship dashboard rows/actions/status from real command availability.

### `BridgeCaptainCombatContextMapper`
Builds current enemy/threat context.

Current inputs:
- enemy telemetry
- incoming missiles
- laser threats
- Science / Weapons / Engineering available commands

Immediate next extension:
- hostile sticky-mine snapshots + real clear-mine actions

Do not merge these mappers; their responsibilities differ.

## Current combat presentation

Existing views already include:
- incoming missiles
- laser telegraphs/beams
- player laser impacts
- player Active Shield
- enemy/player sticky mines
- spam
- outgoing player weapons
- enemy destruction
- point-defense beam VFX
- captain dashboard combat context

The old viewscreen threat VFX and the captain dashboard are separate presentation surfaces. Reuse engine snapshots; do not make one view read state from another.

## Whole-hull impact anchor seam

`src/app/scenes/game/bridge/view/combat/bridge_player_hull_combat_points.ts`

Currently centralizes:
- hull impact point
- shield impact point

This is a deliberately small presentation seam. It is **not** a general semantic target registry. If real ship-node targeting is designed later, extend architecture from actual requirements.

## Next mine slice — exact files to inspect

Engine:
- `src/engine/content/presets/ships.ts`
- `src/engine/content/presets/sticky_mine_dispensers.ts`
- `src/engine/encounter/combat/weapons/sticky_mine/CombatStickyMineRunner.ts`
- `src/engine/encounter/combat/enemy/EnemyDecisionPolicy.ts`
- `src/engine/encounter/combat/enemy/EnemyTaskScheduler.ts`
- `src/engine/encounter/combat/queries/get_sticky_mine_snapshots.ts`
- `src/engine/encounter/commands/handlers/clear_sticky_mine_command_handler.ts`

App:
- `src/app/scenes/game/bridge/controller/captain_dashboard/BridgeCaptainCombatContextMapper.ts`
- `src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer.ts`
- `src/app/scenes/game/bridge/events/bridge_event.ts`
- `src/app/scenes/game/bridge/view/captain_dashboard/combat_context/...`

Tests:
- search every mapper/synchronizer caller before widening required input types
- there have historically been duplicate mapper tests under different paths; search, do not assume one test file
