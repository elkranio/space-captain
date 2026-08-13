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
- power core
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
- `PowerCoreRunner`
- `ShieldEmitterRunner`
- enemy task scheduler/crew logic

Do not split `EncounterEngine` merely because it is central; split only if ownership becomes unclear.

## Combat presentation snapshot

`src/engine/encounter/snapshots/combat_presentation_snapshot.ts`

`EncounterState` remains authoritative mutable truth.

`CombatPresentationSnapshot` is a detached one-frame read model. It aggregates the combat presentation data that must agree within one frame:

- player hull / drive
- DEF presentation state
- Shield Emitter / Active Shield
- player weapons
- officer availability / officer tasks
- enemy ship telemetry/presentation
- incoming/outgoing missiles
- sticky mines
- laser threats
- SPAM channels
- commands by role

It is built on demand and is not cached as a second state.

`EncounterSnapshotReader` / `EncounterEngine` expose the aggregate snapshot. App consumers should prefer the coherent frame snapshot over rebuilding the same frame with many independent getters.

## Combat runner ownership

Physical combat lifecycle is divided by mechanic.

Important current runners:
- missile
- laser
- sticky mine
- spam
- enemy point defense
- player weapon runners
- power core
- shield emitter

Sticky mines are symmetrical at combat-state level: one runner owns both enemy→player and player→enemy attached mines.

## Enemy behavior boundary

### `EnemyDecisionPolicy`

Chooses what idle enemy roles want to do.

It does **not** own `EncounterState`.

Policy receives a small `EnemyDecisionContext`:
- resolved threat decision snapshots
- canonical crew-progress effects

### `EnemyTaskScheduler`

Builds one decision context per current enemy actor, asks policy for work, revalidates the selected physical target, then starts task/weapon/defense phases.

### `EnemyCrewTaskRunner`

Advances enemy crew tasks, validates task targets and invokes completion callbacks.

SPAM lifecycle validation reads canonical `getActiveCrewProgressEffects()`.

### `EnemyThreatDecisionSnapshot`

Small physical decision read model used by policy.

It resolves observation → live physical threat data without exposing hidden epistemic truth that Science has not reported.

### `EnemyThreatObserver` / `EnemyScienceIntelResolver`

Own enemy observation/report behavior. Objective combat state stays elsewhere.

This split is intentional. Avoid a new enemy god object.

## Crew progress effects

`src/engine/encounter/crew_performance/get_active_crew_progress_effects.ts`

Canonical read model for active crew-progress modifiers, including SPAM in both directions.

The old player-specific compatibility query `getActivePlayerSpamChannels()` no longer exists.

New progress modifiers should normally extend the canonical effect query rather than create another player/enemy-specific adapter.

## Bridge synchronization

### `BridgeEncounterRuntimeSynchronizer`

Discrete encounter outcomes → persistent `GameRuntime` where persistence is appropriate.

DEF persistence is no longer driven by a duplicate `PLAYER_POWER_CORE_CHARGE_SPENT` event.

### `BridgeEncounterSnapshotSynchronizer`

Continuously changing combat frame → bridge events/views.

Receives the coherent `CombatPresentationSnapshot` and currently synchronizes:
- player ship dashboard/persistent ship presentation
- active player shield
- incoming/outgoing missiles
- sticky mines
- laser threats
- SPAM
- captain combat context

### `BridgeEncounterEngineEventHandler`

Consumes discrete encounter events and triggers bridge presentation/VFX.

Travel/noninteractive clearing explicitly clears stale enemy shields and captain combat context.

### `BridgeEncounterLoadPresenter`

Load/start presentation extracted from event handler; keep it separate.

## Officer stations

`BridgeOfficerStationsController` now consumes the same combat presentation snapshot for:
- officer tasks
- availability
- enemy telemetry
- command availability

It should not return to multiple independent frame reads unless there is a concrete contract requiring it.

The command menu does not independently duplicate “busy officer” rules; engine command availability remains authoritative.

## Captain dashboard mapping

### `BridgePlayerWeaponStatusMapper`

Normalizes player weapon state/timing/ammo/catalog details for UI.

### `BridgePlayerShipDashboardMapper`

Builds stable player-ship dashboard rows/actions/status from real command availability.

### `BridgeCaptainCombatContextMapper`

Builds current enemy/threat context.

Current inputs:
- enemy presentation snapshots
- incoming missiles
- laser threats
- sticky-mine snapshots
- SPAM channels
- available commands for Science / Helm / Weapons / Engineer

Current outputs include:
- enemy summary + HULL/DEF
- missile threats
- laser threats
- sticky-mine threats
- active SPAM threats

Do not merge these mappers; their responsibilities differ.

## Captain dashboard presentation helpers

`captain_dashboard_style.ts`
- repeated row/icon/action/status visual semantics
- no geometry/layout ownership

`captain_dashboard_format.ts`
- common countdown formatting

Threat geometry remains concrete/local because the current row design is provisional.

## Shield presentation seam

`bridge_shield_presentation.ts`

Shares only:
- base/blink alpha timing
- blink window/interval
- absorbed-hit fade timing/math

Player and enemy shield views remain separate because lifecycle, positioning, scale and visual ownership differ.

## Current combat presentation

Existing views include:
- incoming missiles
- laser telegraphs/beams
- player laser impacts
- player Active Shield
- enemy Active Shield
- enemy/player sticky mines
- SPAM
- outgoing player weapons
- enemy destruction
- point-defense beam VFX
- captain dashboard combat context

The old viewscreen combat VFX and the captain dashboard are separate presentation surfaces. Reuse engine snapshots; do not make one view read state from another.

## Whole-hull impact anchor seam

`src/app/scenes/game/bridge/view/combat/bridge_player_hull_combat_points.ts`

Currently centralizes:
- hull impact point
- shield impact point

This is deliberately small. It is **not** a general semantic target registry.
