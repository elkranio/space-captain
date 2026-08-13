# Space Captain — System Map

Compact ownership map for fresh coding chats.

Updated: 2026-08-13
Reference HEAD: `b06c3da83387b267ba7a92a3ad0024834382e903`

## High-level layers

### `src/engine/...`

Gameplay/domain/runtime truth.

Owns:
- universe/run state
- encounter state
- navigation
- officer commands/tasks/availability
- enemy behavior
- combat actors/weapons/threats
- Power Core
- Shield Generator / Active Shield
- Defense Turret
- hidden missile truth + observer intel
- snapshots/events

No Phaser dependencies should leak into engine definitions.

### `src/app/...`

Application/presentation layer.

Owns:
- scenes/controllers
- bridge event bus
- mapping safe engine snapshots/events to view payloads
- captain dashboard
- Phaser views/VFX
- persistent `GameRuntime` synchronization

App must not recreate gameplay rules or read hidden missile truth.

### `tools/content-editor/...`

Local design/content tooling.

Owns:
- collection navigation
- schema-driven editing UI
- dirty/save/delete/add flows
- whitelisted local server operations
- collection-specific tooling only where justified (currently chassis assets/atlas flow)

It edits normal tracked content files; it is not runtime gameplay infrastructure.

## Content data flow

Current intended path:

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

## Encounter composition

`EncounterEngine` is the public facade/composition root.

Important children include:
- state store / snapshot reader
- officer task/command flow
- `CombatRunner`
- Power Core runner
- Shield Generator runner
- Defense Turret runtime/runner flow
- enemy scheduler/crew logic

Do not split `EncounterEngine` merely because it is central.

## Combat presentation snapshot

`src/engine/encounter/snapshots/combat_presentation_snapshot.ts`

`EncounterState` remains authoritative mutable truth.

`CombatPresentationSnapshot` is a detached one-frame read model and is not cached as a second state.

It aggregates frame-coherent data such as:
- player hull/drive
- Power Core presentation
- Shield Generator / Active Shield
- Defense Turret presentation values
- player weapons
- officer availability/tasks
- enemy telemetry
- missile presentation snapshots
- sticky mines
- laser threats
- SPAM
- commands by role

`BridgeEncounterController`/snapshot consumers should reuse this coherent frame instead of reconstructing the same frame through unrelated getters.

## Missile epistemic boundary — CURRENT

Objective flow:

```text
MissileDefinition
    model tuning only
        ↓
MissileCombatProjectileState
    hidden per-projectile runtime signature
        ↓
Science analysis / observer intel
    UNKNOWN | UNCERTAIN(hypothesis) | CONFIRMED(hypothesis)
        ↓
resolveMissileInterception
    compare concrete hypothesis to hidden truth
    else blind equipment roll
        ↓
MissilePresentationSnapshot
    physical UI fields + identificationStatus only
        ↓
bridge payloads / dashboard / viewscreen
```

Rules:
- projectile objective `signature` stays engine-only;
- observer concrete hypothesis stays engine-only;
- app receives `identificationStatus`, not signature/hypothesis;
- correct hypothesis guarantees intercept even when state is UNCERTAIN;
- wrong/no hypothesis uses Defense Turret `blindInterceptChance`;
- current BASIC chance = 0.4;
- UI formats the authoritative chance but does not calculate it.

Relevant current files:
- `src/engine/defs/missile.ts`
- `src/engine/encounter/model/missile_signature_intel.ts`
- `src/engine/encounter/combat/intel/resolve_missile_signature_analysis.ts`
- `src/engine/encounter/combat/defense_turret/resolve_missile_interception.ts`
- `src/engine/encounter/snapshots/combat_presentation_snapshot.ts`
- bridge captain/snapshot/view mappers

Historical RED/BLUE preset names remain semantic debt in content/preset identifiers only; there is no player-facing spectral-band mechanic.

## Combat runner ownership

Physical combat lifecycle stays mechanic-specific.

Important runners include:
- missile
- laser
- sticky mine
- SPAM
- Defense Turret
- player weapon runners
- Power Core
- Shield Generator

Sticky mines are symmetrical at combat-state level: one runner owns both directions.

Do not unify specialized runners solely because they share timing vocabulary.

## Enemy behavior boundary

### `EnemyDecisionPolicy`

Chooses what idle enemy roles want to do.

Does not own `EncounterState`.

### `EnemyTaskScheduler`

Builds explicit decision context, asks policy for work, revalidates physical targets, starts crew/weapon/defense phases.

### `EnemyCrewTaskRunner`

Advances enemy crew tasks, validates task targets, invokes completion callbacks.

### Threat observation / Science intel

Enemy observation/report remains separate from objective threat truth.

Do not bypass this boundary for convenience.

## Crew progress effects

`src/engine/encounter/crew_performance/get_active_crew_progress_effects.ts`

Canonical read model for active crew-progress modifiers including SPAM.

Extend this query when a real new modifier needs the same semantics instead of creating parallel player/enemy adapters.

## Bridge synchronization

### `BridgeEncounterRuntimeSynchronizer`

Discrete encounter outcomes -> persistent `GameRuntime` where persistence is required.

### `BridgeEncounterSnapshotSynchronizer`

Continuously changing frame -> bridge events/views/runtime presentation sync.

Current responsibilities include:
- player ship dashboard
- persistent player Power Core/Shield Generator/weapon presentation state
- player/enemy shields
- incoming/outgoing missiles
- sticky mines
- laser threats
- SPAM
- captain combat context

### `BridgeEncounterEngineEventHandler`

Consumes discrete encounter events and starts bridge VFX/presentation flows.

## Captain dashboard mapping

### `BridgePlayerWeaponStatusMapper`

Normalizes installed player weapon state/timing/ammo/catalog information.

### `BridgePlayerShipDashboardMapper`

Builds stable OUR SHIP status/actions from engine-derived data and real command availability.

### `BridgeCaptainCombatContextMapper`

Builds current enemy/threat context from safe presentation snapshots plus real commands.

Do not merge these mappers just because all feed one UI.

## Captain dashboard presentation helpers

`captain_dashboard_style.ts`
- repeated visual semantics
- no layout ownership

`captain_dashboard_format.ts`
- common countdown formatting

Threat geometry remains concrete/local because layout is provisional.

## Shield presentation seam

`bridge_shield_presentation.ts`

Shares only presentation timing/math:
- base/blink alpha
- blink window/interval
- absorbed fade

Player/enemy shield views remain separate.

## Whole-hull impact anchor seam

`bridge_player_hull_combat_points.ts`

Centralizes visual impact anchors only.

It is not a semantic damage-node registry.

## Local content editor seams to audit during refactor

Do not assume these are broken; inspect before changing:

- repeated CRUD/reference-validation plumbing across migrated collections;
- schema -> catalog -> editor metadata duplication;
- repeated test fixture construction around CRUD-ready modules;
- collection-specific branches that can now be simplified without creating a giant generic framework;
- stale missile RED/BLUE preset naming before the next content migration.

See `REFACTOR_HANDOFF.md`.
