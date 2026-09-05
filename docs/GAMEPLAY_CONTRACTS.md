# Space Captain — Gameplay Contracts

This file describes **current implemented runtime behavior**. It does not describe future design.

If this file and current code disagree, inspect the code first. Intended corrections belong in `GAME_DESIGN.md` and
concrete implementation debt belongs in `BACKLOG.md`.

## Encounter and command model

- One full enemy ship is fought at a time.
- Missiles, Beam attacks, SPAM and Sticky Mines are threats/effects produced by ships, not extra command-capable
  enemies.
- Every player command belongs to one officer role.
- Engine state owns command availability, busy/blocked behavior and task lifecycle.
- App/controller code maps engine truth; views do not recreate gameplay legality.
- Basic incoming-threat identity is available without a mandatory Scientist TRACK/IDENTIFY task.

Current stable player roles are Scientist, Pilot, Gunner and Engineer.

## Current navigation boundary

`FLY_TO`, `JUMP` and `DOCK` still use the prototype `requiresIdleBridge` restriction. This is current runtime truth,
not a claim about final travel design.

There is currently no implemented Pilot Escape command/task.

## Ship/loadout and integrity

Current player and enemy ships carry real chassis/loadout identity:

- chassis own stable `DRIVE | WEAPON | DEFENSE | UTILITY` slots;
- mounts preserve `slotId -> runtime equipmentId`;
- Hull is not a slot;
- Power Core is separate and non-spatial;
- Drive, Defense Turret, Shield Generator and current weapons carry encounter-local integrity;
- installed equipment owns integrity/BROKEN state; slots own spatial identity only;
- shared helpers define `integrity > 0` as operational and clamp integrity damage.

Encounter-only integrity is stripped at persistent snapshot boundaries.

Generic BROKEN command gating and generic Engineer repair are not complete for every equipment family. Drive has the
existing specific BROKEN-only repair path.

## Player Beam

Current engine target vocabulary is:

```text
HULL
BRIDGE
SLOT(slotId)
```

The command handler currently exposes all three target kinds. The captain dashboard target-selection flow exposes
occupied enemy equipment slots; Hull/Bridge dashboard input is not wired there yet.

Current impact behavior:

```text
HULL
    -> hullDamage

operational SLOT
    -> moduleDamage
    -> no Hull spill, including the breaking hit

already BROKEN SLOT
    -> hullDamage * 2

BRIDGE
    -> HIT outcome
    -> 0 damage / no additional gameplay consequence yet
```

Enemy Evade resolves before player Beam damage. Enemy Shield currently remains a whole-ship shortcut: any active
enemy Shield absorbs the player Beam regardless of semantic target.

Player Beam spends its content-defined Power Core cost when charging starts. Current player Beam starts full
cooldown at shot resolution or cancellation/interruption.

## Incoming enemy Beam and player Shield

Incoming enemy Beam still uses the older target vocabulary:

```text
HULL | DRIVE
```

The target is chosen once and is safe for immediate player presentation while the Beam charges.

Current resolution order:

```text
player EVADING
    -> MISS; Active Shield survives

else matching player Active Shield target
    -> ABSORBED; Shield is consumed

else
    -> penetrating consequence
```

Current penetrating consequences:

- `HULL` -> Hull damage;
- operational `DRIVE` -> Drive module damage, no Hull spill;
- a breaking Drive hit -> still no Hull spill;
- already disabled/broken Drive -> `hullDamage * 2`.

Player Active Shield also uses `HULL | DRIVE`. Shield deployment spends Power Core and commits generator cooldown at
task start. Enemy targeted-Shield placement is not implemented; enemy Shield is whole-ship.

## Weapon lifecycle and current cooldown edges

Current runtime is mixed. Some systems already match the intended after-action rule and others still overlap
recovery with active work.

| System | Player cooldown starts | Enemy cooldown starts |
| --- | --- | --- |
| Missile Launcher | Physical launch | Physical launch |
| Sticky Mine Dispenser | One physical release after targeting | One attachment attempt after targeting |
| Beam Cannon | Shot resolves or charging is cancelled/interrupted | Charging starts |
| SPAM Projector | Original channel operation ends | Channeling starts |
| Defense Turret | Attempt completes or is cancelled | Loading starts |
| Shield Generator | Deployment task starts | Deployment task starts |
| Evade | Maneuver starts | Maneuver starts |

Current player cancellation/commitment details:

- Missile targeting cancellation/target loss is free: READY, no ammo, no cooldown;
- Sticky Mine targeting cancellation/interruption/target loss is also free before release: READY, no ammo, no
  cooldown;
- player Beam cancellation keeps spent CORE and starts a full cooldown;
- player Defense Turret cancellation starts a full cooldown;
- player Shield and Evade keep their already-running cooldown because recovery currently starts too early;
- player SPAM has no normal manual-cancel action.

## Missile Launcher / Missiles

Missile Launcher content owns damage, flight duration, ammo capacity and cooldown. `GUNNER_FIRE_MISSILE`
officer-task tuning owns targeting duration.

Physical launch spends one Missile. After launch the projectile is autonomous and does not keep Gunner busy.

Incoming Missile can be intercepted by Defense Turret or avoided by Evade. Current Missile impact applies Hull
damage and emits its event; it does **not** invoke the generic random damage-interruption path.

A launched incoming Missile can survive destruction of its source actor while its own lifecycle remains valid.

## Defense Turret

Player baseline:

- Gunner operates it;
- it spends shared Power Core;
- it targets one concrete live Missile;
- if the attempt finishes while that Missile still exists, current resolution is deterministic `HIT`;
- no Scientist hypothesis/accuracy tier is required.

Enemy Turret also resolves deterministically after loading against a still-live player Missile, but enemy cooldown
currently starts when loading begins rather than after the attempt.

## Sticky Mine Dispenser

Both player and enemy dispensers now use one release per targeting operation.

```text
TARGETING / MINE AIM
-> exactly one release / attachment attempt
-> Gunner free
-> dispenser recovery and Mine fuse run independently
```

Current rules:

- targeting duration belongs to `GUNNER_FIRE_STICKY_MINES` officer-task tuning;
- dispenser content owns damage, fuse, ammo capacity and cooldown;
- there is no `DISPENSING` phase, salvo size, launch interval or automatic later release;
- targeting uses crew-progress time; fuse and cooldown use world time;
- before release, player cancellation/interruption/target loss spends no ammo and starts no cooldown;
- release spends one ammo and starts full cooldown even when target Evade makes attachment miss;
- each attached Mine is an independent runtime object;
- clearing is Engineer-only for both sides;
- incoming Mines survive source destruction; outgoing Mines are removed when their target disappears/stops being
  hostile.

Existing step-order detail remains: enemy zero-fuse Mine can resolve on attachment; a newly integrated player
zero-fuse Mine resolves on the next combat step.

## SPAM

SPAM is a long-lived crew-progress effect, not a projectile.

Current player path:

- Scientist starts player SPAM;
- target crew work is slowed while the active channel effect exists;
- enemy Scientist may purge that effect;
- when purged, the player effect ends immediately but the player Scientist remains occupied until the original
  channel duration finishes;
- only then does player SPAM enter cooldown and release Scientist.

Current enemy path is asymmetric:

- enemy Scientist channels SPAM;
- player Scientist may purge it;
- current `CombatSpamRunner` ends the enemy channel lifecycle on PURGE;
- enemy crew synchronization then releases the enemy Scientist instead of keeping the original operation occupied.

`BridgeSpamView` renders viewscreen garbage/ads below bridge controls/UI.

## Evade

Current player phase shape:

```text
READY -> WARMUP -> EVADING -> COOLDOWN (if recovery remains) -> READY
```

Current runtime:

- command start spends Power Core and starts full cooldown immediately;
- cooldown therefore counts down during WARMUP/EVADING;
- Pilot remains occupied through WARMUP/EVADING;
- deterministic protection exists only during `EVADING`;
- Missile hits, Beam hits and new Sticky Mine attachments are evadable;
- SPAM and already-attached Mines are not evadable;
- the confirmed 1-integrity Drive wear is not implemented.

Explicit task-control semantics are not implemented as a clean standalone `INTERRUPT`/`STUN` system yet. Current
generic damage interruption is described separately below.

## Shared Power Core

Current player Power Core baseline:

- capacity: 4 charges;
- sequential recharge;
- current consumers: Evade, Defense Turret, Shield Generator, Beam Cannon.

Committed player Beam CORE is not refunded after later cancellation/interruption. Other current consumers follow
their existing concrete handlers/lifecycles.

## Damage and interruption — current legacy behavior

Current runtime still contains a generic random damage-interruption mechanism:

- officer tasks carry `canBeInterruptedByDamage`;
- `OfficerTaskRunner.interruptRandomTaskByDamage()` selects one eligible current player task and cancels it;
- penetrating incoming Beam invokes that effect after damage;
- enemy Sticky Mine detonation invokes that effect after Hull damage;
- incoming Missile impact does not invoke it.

This section records runtime truth only. The intended design removes ordinary-damage roulette in favor of explicit
control effects; see `GAME_DESIGN.md` / `BACKLOG.md`.

## Enemy crew / AI boundary

Enemy crew is simulated through its own policy/execution/task boundary rather than a mirrored player bridge:

```text
perceived / decision facts
-> EnemyDecisionPolicy chooses work
-> EnemyWorkExecutor revalidates and commits work
-> EnemyCrewTaskRunner owns crew task lifecycle
-> specialized system runners own physical resolution
```

Enemy policy does not receive unrestricted mutable encounter state. Current exact defense priority/aggression rules
are implementation/tuning rather than a durable gameplay contract.

## Encounter end — current gaps

The current runtime does not yet provide the full confirmed generic encounter-end reset/cleanup lifecycle described
in `GAME_DESIGN.md`.

There is no implemented Escape flow. Negotiated/peaceful combat-end cleanup is also future work.

## Debug-only opening combat behavior

The app still contains an isolated enemy combat-start debug behavior boundary. When configured, it can request enemy
Evade and/or the legacy opening Drive-disruption pulse through authoritative engine APIs.

The disruption pulse is debug infrastructure, not normal gameplay, and remains a cleanup target.
