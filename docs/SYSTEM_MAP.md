# Space Captain — System Map

Compact ownership map for fresh coding chats.

## High-level layers

### `src/engine/**`

Gameplay/domain/runtime truth.

Owns:
- run/universe and encounter state;
- navigation;
- officer commands/tasks/availability;
- enemy behavior;
- combat actors/weapons/threats;
- Power Core / Shield Generator / Active Shield / Defense Turret;
- hidden missile truth and observer intel;
- snapshots/events.

No Phaser types belong in engine definitions.

### `src/app/**`

Application/presentation.

Owns:
- scenes/controllers;
- bridge event bus;
- mapping safe engine snapshots/events to presentation payloads;
- captain dashboard;
- Phaser views/VFX;
- bridge officer visual state;
- persistent `GameRuntime` synchronization.

App must not recreate gameplay rules or read hidden missile truth.

### `tools/content-editor/**`

Local content tooling.

Owns:
- content collection navigation/editing;
- schema-driven controls;
- whitelisted local writes;
- reference/delete validation;
- justified asset tooling.

It is not runtime gameplay infrastructure.

## Content flow

```text
plain JSON content
    -> Zod validation
    -> typed/catalog projection
    -> engine/factories

same JSON + schema metadata
    -> local content editor
    -> validated tracked save
```

No second editor database.

### Ship Weapon content

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
- four concrete editor families;
- one unified runtime catalog;
- IDs are open strings for editor-created records;
- built-in ID constants are stable vocabulary;
- cross-family duplicate IDs are rejected;
- no standalone Missile or Sticky Mine content entity.

`debug_start.json` is mutable development content. Read it when a task depends
on the current Debug Start instead of freezing its loadout into architecture
docs or unrelated tests.

## Encounter runtime

`EncounterEngine` is the public facade/composition root.

`EncounterState` is authoritative mutable encounter truth.

`EncounterPresentationSnapshot` is the normal detached app-facing coherent
frame root.

Events answer **what just happened**.
Snapshots answer **what is true now**.

`CombatRunner` owns top-level combat orchestration and delegates concrete
mechanics. Physical lifecycles remain mechanic-specific; do not force weapon,
turret, shield or Evade timing into a generic framework merely because they have
similar phases.

## Enemy behavior boundary

```text
EncounterState + actor
    ↓
getEnemyCaptainDecisionSnapshot(...)
    ↓
detached/perceived facts
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

`EnemyDecisionPolicy` chooses what to attempt from detached decision facts.

`EnemyWorkExecutor` is the authoritative physical command boundary:
- revalidation;
- resource commitment;
- crew/system work start;
- concrete weapon/system start;
- attack-start presentation event only after accepted offensive work starts.

`EnemyCrewTaskRunner` owns enemy crew occupancy/lifecycle.

Threat observation/Science owns perceived intel vs objective truth. Do not
bypass that boundary for AI convenience.

## Missile epistemic boundary

```text
Missile Launcher definition
    ↓ launch
Projectile physical state + hidden signature
    ↓
observer / Science intel
UNKNOWN | UNCERTAIN | CONFIRMED
    ↓
interception resolver
    ↓
safe presentation
```

Objective signature stays engine-only.

Once a hostile physical threat exists, do not reconstruct its hostility or
actionability by looking up the current source actor. Source destruction does
not erase surviving projectiles/effects.

## Enemy destruction

Engine/domain:
- actor is destroyed/removed;
- surviving threats continue;
- simulation continues.

App/presentation:
- may run local destruction animation;
- must not pause engine simulation;
- must not own unrelated interaction locks.

## Bridge

Current `BridgeView` composes the space/combat/interior layers, attack warning,
officer stations, captain dashboard, officer barks and the legacy officer
context menu.

Current station presentation:
- the authored background owns the station consoles;
- each officer is a whole seated sprite layered above it;
- monitors are intentionally blank/dark;
- invisible officer hit areas/context-menu coverage remain where needed;
- old station-base sprites, monitor task UI, fake input pulses and side
  availability lamps are not part of the current visual baseline.

See `BRIDGE_ART_DIRECTION.md` for visual rules.

## Art/asset path

Raw authored images live under `assets/raw/images/**`.
Packed/live atlas output lives under `assets/live/images/**`.

The manifest layer maps semantic sprite IDs to atlas/frame keys. Views should
consume manifest/presentation data rather than scatter atlas frame strings.

## Captain dashboard mapping

Keep separate responsibilities:
- player weapon status mapping;
- player ship dashboard mapping;
- captain combat-context mapping.

Duplicate same-kind weapons are keyed by concrete installed runtime weapon ID.

Threat identity remains concrete; compact UI must not aggregate away runtime
identity.

## Persistence

Encounter -> persistent run write-back has one owner.

Presentation snapshots/events are not a second persistent state.
