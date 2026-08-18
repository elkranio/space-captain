# Space Captain — Gameplay Contracts

Living gameplay/domain invariants.

If code and this file disagree, inspect current code first.

## Encounter shape

- One full enemy ship at a time.
- Missiles, Beam Cannon attacks, SPAM and sticky mines are physical/effect threats produced by ships, not additional command-capable enemies.
- Combat is readable timing pressure + crew commitment + resource conflict, not bullet hell.
- Physical threats may outlive their source actor.

### Source-independent missile invariant

Once an actor-launched missile exists and targets `PLAYER_SHIP`:
- it remains in simulation if the source actor is destroyed;
- it remains analyzable when Science is otherwise available;
- it remains interceptable when Weapons/Defense Turret is otherwise available;
- source-actor existence is not required to resolve it.

## Simulation vs presentation

Presentation effects must not pause authoritative simulation unless a real gameplay rule explicitly requires it.

Enemy destruction:
- may start a local explosion/destruction view;
- does not pause `EncounterEngine.step()`;
- does not pause projectiles, mines, tasks or recharge;
- destruction completion does not own `isEncounterInteractive`.

## Officer command truth

- Every command definition belongs to exactly one officer role.
- Engine decides command availability.
- App/controller maps real `AvailableOfficerCommand` values to UI.
- Views never recreate legality/availability.
- Starting work creates/owns an engine officer task.
- Cancellation belongs to the active task, not to the UI surface that started it.
- Busy/blocked behavior comes from engine state.

## Weapon pacing principle

Reaction time must come from a weapon's real lifecycle.

If a threat needs more response time, tune:
- missile targeting/flight;
- Beam charge;
- SPAM channel;
- mine dispensing/fuse.

Do not add a universal fake pre-warning phase.

### Cooldown commitment

Cooldown is committed at the concrete action commitment edge rather than after a successful outcome.

Rules:
- committed cooldown advances in raw encounter/world time;
- cooldown may overlap an active crew/action phase;
- cancellation/interruption after commitment does not reset or refund cooldown;
- cancellation before commitment remains free;
- once the active action ends, visible `COOLDOWN` represents only the recovery time that is still left;
- if recovery already finished while the action was active, the system returns directly to `READY` when that action ends.

Current commitment edges:
- Beam Cannon: charge start;
- Missile Launcher: physical missile launch, after targeting;
- SPAM Projector: channel start;
- Sticky Mine Dispenser: first physical mine launch;
- Shield Generator: Power spend / Engineer deployment start;
- Defense Turret: Power spend / Weapons loading start.

Nominal cooldown tuning includes the overlapped base action time where needed so baseline reuse cadence stays close to the previous post-action values.

## Weapon phase semantics — CURRENT

Shared phase vocabulary may contain:
- `READY`
- `TARGETING`
- `CHARGING`
- `CHANNELING`
- `DISPENSING`
- `COOLDOWN`

A weapon only traverses phases that have real meaning for that weapon.

### Missile Launcher

```text
READY
  -> TARGETING
  -> LAUNCH
  -> COOLDOWN
  -> READY
```

Rules:
- targeting/locking is a real Weapons commitment;
- `targetingDurationMs` belongs to the Missile Launcher definition/content;
- targeting start is a legitimate telegraph;
- projectile becomes autonomous after launch.

### Beam Cannon

```text
READY
  -> CHARGING
  -> FIRE
  -> COOLDOWN
  -> READY
```

Rules:
- no generic pre-targeting;
- charge is the offensive commitment and telegraph;
- Beam has no ammo economy;
- occupied Weapons time is a major part of its cost.

### SPAM Projector

```text
READY
  -> CHANNELING
  -> COOLDOWN
  -> READY
```

Rules:
- no generic pre-targeting;
- channel itself is the attack/telegraph;
- channel progression uses its real timing contract;
- Science occupancy follows the actual task/channel contract.

### Sticky Mine Dispenser

```text
READY
  -> DISPENSING
  -> COOLDOWN
  -> READY
```

Rules:
- no generic pre-targeting;
- dispensing is the attack start;
- first mine may appear immediately when dispensing starts;
- salvo timing remains content-driven.

### Generic enemy attack-start event

When `EnemyWorkExecutor` successfully starts accepted offensive weapon work:
- authoritative revalidation/task start happens first;
- the concrete weapon phase is started;
- engine emits `ENEMY_ATTACK_STARTED`.

This event is a generic presentation edge, not a substitute for concrete weapon lifecycle events.

Bridge may use it for a short generic warning pulse.

Concrete events such as missile launch, Beam attack start, SPAM channel start and mine attach remain authoritative presentation transitions for their own objects/effects.

## Helm Evade

Helm Evade is a shared authoritative player/enemy defensive lifecycle.

```text
READY
  -> WARMUP
  -> EVADING
  -> COOLDOWN
  -> READY
```

Rules:
- command start commits Power Core cost and the full cooldown;
- Helm is occupied for the maneuver;
- cancellation/interruption never refunds committed Power/cooldown;
- the main drive must be operational unless future content explicitly defines an exception;
- protection is deterministic only while phase is `EVADING`;
- the ship remains targetable; Evade is checked when the physical hit/attachment resolves;
- missiles, Beam hits and new sticky-mine attachments are evadable;
- SPAM and already-attached mines are not evadable;
- Evade does not slow/block Science, Weapons or Engineer;
- timing/cost values are drive/content-driven;
- player and enemy use the same gameplay mechanic rather than separate dodge rules.

Beam resolution order:

```text
EVADING -> MISS
else Active Shield -> ABSORBED
else -> HIT
```

An avoided attack does not consume a shield/defense that was never hit.

## Shared Power Core

There is one shared defensive energy store.

Current BASIC contract:
- capacity: 4 charges;
- sequential recharge;
- Defense Turret and Shield Generator draw from the same pool;
- committed energy is not refunded after later cancellation/interruption.


## Shield Generator / Active Shield

Installed hardware: **Shield Generator**.

Temporary encounter object: **Active Shield**.

Current direction:
- generator uses shared Power Core;
- active shield is encounter-local;
- active shield absorbs one Beam Cannon hit or expires;

## Defense Turret

Defense Turret is installed hardware.

Current contract:
- no private charge/ammo pool;
- uses shared Power Core;
- Weapons owns player operation;
- one missile intercept flow;
- BASIC blind intercept chance currently 0.4;
- correct concrete missile hypothesis guarantees interception;
- wrong/no hypothesis falls back to blind chance;
- MISS leaves the missile alive.

## Missiles

There is no standalone Missile content entity.

Missile Launcher content owns:
- name;
- damage;
- targeting duration;
- flight duration;
- ammo capacity;
- cooldown duration.

At launch, the projectile copies the physical values needed for its autonomous lifecycle.

Every launched projectile owns hidden runtime signature truth.

Observer Science knowledge is separate:
- `UNKNOWN`;
- `UNCERTAIN`;
- `CONFIRMED`.

`CONFIRMED` must match objective projectile truth.

No public correctness flag exists for uncertain hypotheses.

### Science analysis

Current profiles:
- `STANDARD`;
- `IMPAIRED`.

Current confidence families:
- `CERTAIN`;
- `STRONG`;
- `WEAK`.

Rules:
- CERTAIN -> truthful CONFIRMED;
- STRONG/WEAK -> UNCERTAIN;
- uncertain hypothesis may be correct or wrong.

## Beam Cannon

Current heavy precision energy weapon is **Beam Cannon**.

Current combat contract:
- long charge;
- no ammo economy;
- unshielded hit damages hull;
- Active Shield absorbs one Beam hit and is consumed;
- Engineer shield deployment is the current defensive response.

Semantic damage targets must come from real domain state, never from VFX impact coordinates.

## Sticky mines

There is no standalone Sticky Mine content entity.

Sticky Mine Dispenser content owns:
- damage;
- fuse duration;
- ammo capacity;
- salvo size;
- launch interval;
- cooldown duration.

Every attached mine is an independent runtime `StickyMineState`.

Do not aggregate mine identity for UI convenience.

### Mine clearing

Current contract:
- player CLEAR MINE is Engineer-only;
- enemy sticky-mine clearing is Engineer-only;
- a busy, missing or otherwise unavailable Engineer does not fall back to Science, Helm or Weapons.

## SPAM

- SPAM is a channel/progress effect, not a projectile.
- Science launches player SPAM.
- Enemy Science can purge player SPAM.
- Player Science can purge enemy SPAM.
- active crew-progress modifiers use canonical engine read models;
- enemy decision context receives relevant effects explicitly rather than reading full encounter state.

## Damage / interruption

- Hull damage is engine-owned.
- Physical runners resolve combat outcomes.
- UI presents outcomes only.
- Damage-interruptible officer tasks are interrupted by engine rules.

## Enemy crew architecture

Enemy crew is simulated, not a mirrored player bridge.

Ownership:
- perceived/decision facts provide policy boundary;
- `EnemyDecisionPolicy` chooses work;
- `EnemyWorkExecutor` revalidates/commits/starts it;
- `EnemyCrewTaskRunner` owns crew task lifecycle;
- specialized runners own physical system phases;
- threat observation/Science intel remains separate from objective truth.

Policy does not own full mutable `EncounterState`.
