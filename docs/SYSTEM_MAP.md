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
- objective Missile signature truth and enemy observer/Science intel;
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

App must not recreate gameplay rules or read hidden Missile signature truth.

Basic player-facing threat facts such as incoming Beam `targetNode` are safe presentation truth and should not be wrapped
back into a fake player Science-intel layer.

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

`debug_start.json` is mutable development content. Read it when a task depends on the current Debug Start instead of
freezing its loadout into architecture docs or unrelated tests.

## Encounter runtime

`EncounterEngine` is the public facade/composition root.

`EncounterState` is authoritative mutable encounter truth.

`EncounterPresentationSnapshot` is the normal detached app-facing coherent frame root.

Events answer **what just happened**.
Snapshots answer **what is true now**.

`CombatRunner` owns top-level combat orchestration and delegates concrete mechanics. Physical lifecycles remain
mechanic-specific; do not force weapon, turret, shield or Evade timing into a generic framework merely because they have
similar phases.

## Encounter cross-system communication

After the 2026-08-18 cognitive-load/callback simplification, the normal synchronous dependency graph should remain close
to:

```text
OfficerTaskRunner --------------------> CombatRunner

PlayerWeaponRunner -------------------> CombatRunner
       |
       +------------------------------> OfficerTaskRunner

EnemyDefenseTurretRunner ------------> CombatMissileRunner

EnemyBehaviorRunner
       |
       +--> EnemyCrewTaskRunner
              |
              +--> returns timed completions to its parent
```

Use direct narrow owner references for stable synchronous operations. Do not replace them with one callback per method
merely to avoid an import.

The two genuine reverse ownership edges cross one explicit synchronous `EncounterInternalEffect` boundary at
`EncounterEngine`:

```text
combat producer
    -> INTERRUPT_RANDOM_PLAYER_OFFICER_TASK
    -> EncounterEngine
    -> OfficerTaskRunner

enemy SPAM purge completion
    -> PURGE_PLAYER_SPAM_CHANNEL
    -> EncounterEngine
    -> PlayerWeaponRunner
```

This boundary is not the public `EncounterEvent` outbox and is not a queued bus. Effects are applied immediately because
same-step ordering is gameplay-relevant.

Important ordering contracts:

- `EncounterEngine.step()` keeps officer-task progress before player weapon work, and player weapon work before
  `CombatRunner`.
- `CombatRunner` snapshots IDs of already-existing combat objects before integrating pending player missiles/mines; newly
  launched objects exist in the step but do not consume that step's `deltaMs`.
- enemy crew completion consequences are applied before the same actor's next captain decision snapshot;
- enemy destruction is synchronous and may remove the actor plus player combat objects targeting it before later
  same-step resolution;
- current Beam/Sticky-Mine damage interruption paths may interrupt a player officer task; incoming Missile damage does not
  currently share that effect.

Local composition callbacks are allowed when they are honest and easy to trace. Do not optimize for zero callbacks.

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

Enemy threat observation/Science owns perceived intel vs objective truth. Do not bypass that boundary for AI convenience.

## Missile epistemic boundary

Objective Missile signature remains hidden engine truth, but the old **player** TRACK/IDENTIFY path is gone.

Current relevant epistemic path is enemy-side:

```text
Missile Launcher definition
    ↓ launch
Projectile physical state + objective signature
    ↓
enemy threat observation / Science report
    ↓
enemy Defense Turret decision/interception behavior
```

Player presentation receives the concrete Missile threat without a player `UNKNOWN / UNCERTAIN / CONFIRMED` wrapper.

Once a hostile physical threat exists, do not reconstruct its hostility or actionability by looking up the current source
actor. Source destruction does not erase surviving projectiles/effects.

## Beam target / Shield boundary

Incoming enemy Beam attacks own one semantic target:

```text
HULL | DRIVE
```

That concrete incoming target node is now safe player-facing presentation truth. The app receives it directly; there is
no player Science `targetIntel` wrapper or TRACK step.

Player Drive integrity is encounter-local domain state. Beam resolution mutates that authoritative Drive state directly.

Player Active Shield is already node-targeted:

```text
selected Engineer command target
    -> deploy task target
    -> activeShield.targetNode
```

Incoming resolution:

```text
EVADING
    -> MISS

else activeShield.targetNode == beam.targetNode
    -> ABSORBED + consume Shield

else
    -> penetrate target node + wrong-node Shield survives
```

Enemy Active Shield is still the older whole-ship behavior. Enemy targeted Shield choice/resolution remains open.

Player Beam is still actor-wide/hull-only at the current checkpoint, so enemy node-targeted Shield placement depends on
first giving the player Beam a real semantic target.

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

Current `BridgeView` composes the space/combat/interior layers, attack warning, officer stations, captain dashboard,
officer barks and the legacy officer context menu.

Current station presentation:

- the authored background owns the station consoles;
- each officer is a whole seated sprite layered above it;
- monitors are intentionally blank/dark;
- invisible officer hit areas/context-menu coverage remain where needed;
- old station-base sprites, monitor task UI, fake input pulses and side availability lamps are not part of the current
  visual baseline.

See `BRIDGE_ART_DIRECTION.md` for visual rules.

## Art/asset path

Raw authored images live under `assets/raw/images/**`.
Packed/live atlas output lives under `assets/live/images/**`.

The manifest layer maps semantic sprite IDs to atlas/frame keys. Views should consume manifest/presentation data rather
than scatter atlas frame strings.

Current threat-dashboard glyph sources live under:

`assets/raw/images/ui/threat_icons/`

They use a shared `107x33` source canvas and are intended to be tintable at runtime.

## Captain dashboard mapping

Keep separate responsibilities:

- player weapon status mapping;
- player ship dashboard mapping;
- captain combat-context mapping.

Duplicate same-kind weapons are keyed by concrete installed runtime weapon ID.

Threat identity remains concrete; compact UI must not aggregate away runtime identity.

The new threat-dashboard visual grammar is presentation-only: icon fill/blink/click surface must consume engine-resolved
commands, active tasks and timing read models rather than recreate gameplay truth.

## Persistence

Encounter -> persistent run write-back has one owner.

Presentation snapshots/events are not a second persistent state.
