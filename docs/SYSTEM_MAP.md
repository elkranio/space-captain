# Space Captain — System Map

Compact ownership map for fresh coding chats.

Updated: 2026-08-16
Reference HEAD: `928235b2993b6cf8d322a3543cac14047f6bd925`

## High-level layers

### `src/engine/...`

Gameplay/domain/runtime truth.

Owns:
- run/universe state;
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

No Phaser types belong in engine definitions.

### `src/app/...`

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

### `tools/content-editor/...`

Local design/content tooling.

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

## Ship Weapon content

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
- built-in constants remain stable aliases;
- cross-family duplicate IDs are rejected;
- no standalone Missile or Sticky Mine content entity;
- no shared Ship Weapon Rules collection.

Missile Launcher owns `targetingDurationMs`.

## Debug Start

`debug_start.json` is mutable development content.

Do not freeze its current loadout into living architecture docs or unrelated tests.

When a task depends on the actual current Debug Start, read the file.

## Encounter composition

`EncounterEngine` is the public facade/composition root.

`EncounterState` is authoritative mutable encounter truth.

`EncounterPresentationSnapshot` is the normal detached app-facing coherent frame root.

Events answer **what just happened**.
Snapshots answer **what is true now**.

## CombatRunner

`CombatRunner` owns top-level combat orchestration and delegates concrete mechanics.

Physical lifecycle remains mechanic-specific:
- Missile runner;
- Beam Cannon runner;
- Sticky Mine runner;
- SPAM runner;
- Defense Turret runner;
- player weapon runners;
- Power Core / Shield Generator runners.

Do not unify runners merely because they share timing vocabulary.

## Weapon phases — CURRENT

Shared vocabulary:
- READY
- TARGETING
- CHARGING
- CHANNELING
- DISPENSING
- COOLDOWN

Concrete use:
- Missile -> TARGETING;
- Beam -> CHARGING;
- SPAM -> CHANNELING;
- Mine -> DISPENSING.

There is no universal shared 3000 ms targeting pre-phase.

Missile targeting duration comes from the Missile Launcher definition.

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

### `EnemyDecisionPolicy`

Chooses what to attempt from detached decision context.

### `EnemyWorkExecutor`

Authoritative physical command boundary.

Owns:
- revalidation;
- resource commitment;
- crew/system work start;
- concrete weapon phase start;
- `ENEMY_ATTACK_STARTED` emission after offensive work successfully starts.

### `EnemyCrewTaskRunner`

Owns enemy crew occupancy/lifecycle.

### Threat observer / Science boundary

Owns perceived intel vs objective truth.

Do not bypass it for AI convenience.

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

## Orphan physical threats

Do not reconstruct hostility/actionability by looking up the current source actor.

Once a hostile projectile exists and targets the player, source destruction does not erase it.

## Enemy destruction

Engine/domain:
- actor is destroyed/removed;
- surviving threats continue;
- simulation continues.

App/presentation:
- may run local destruction animation;
- must not pause engine simulation;
- must not own unrelated interaction locks.

## Bridge root composition

Current `BridgeView` composes:
- `BridgeSpaceView`;
- `BridgeCombatView`;
- `BridgeInteriorView`;
- attack warning view;
- officer station view;
- captain dashboard;
- officer barks;
- legacy officer context menu.

The bridge rebuild is now the current presentation baseline.

### Current station presentation

- the authored bridge background owns the station consoles;
- each visible officer uses a whole seated sprite layered above the background;
- station monitors are intentionally blank/dark for now;
- old separate station-base sprites, monitor hints, fake input pulses, task
  monitor UI, and side availability lamps are not part of the new visual
  baseline;
- invisible officer hit areas/context-menu coverage remain where needed.

See the root `../CURRENT_HANDOFF.md` for current implementation status and
`BRIDGE_ART_DIRECTION.md` for durable visual direction.

## Bridge asset pipeline

Raw authored images:
`assets/raw/images/...`

Packed/live atlas:
`assets/live/images/atlas-0.png`
`assets/live/images/atlas.json`

After raw sprite changes:
`npm run pack:tex`

Current bridge raw areas:
- `assets/raw/images/bridge/interior/`
- `assets/raw/images/bridge/officers/`
- `assets/raw/images/bridge/space/`
- legacy `assets/raw/images/bridge/station/`
- bridge UI/VFX subfolders.

Do not delete legacy bridge assets until the new runtime composition is verified.

## Captain dashboard mapping

Keep separate responsibilities:
- player weapon status mapper;
- player ship dashboard mapper;
- captain combat-context mapper.

Duplicate same-kind weapons are keyed by concrete installed runtime weapon ID.

Threat identity remains concrete; compact UI must not aggregate away runtime identity.

## Persistence

Encounter -> persistent run write-back has one owner.

Presentation snapshots/events are not a second persistent state.

## Refactor policy

Refactor only when concrete evidence exists:
- duplicated rule;
- unclear ownership;
- context reconstruction;
- callback spaghetti;
- hostile signatures;
- stale semantic layer actively obscuring behavior.

File length alone is not evidence.
