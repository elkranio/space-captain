# Space Captain — Player Missile Handoff

Temporary active-slice document.

Delete or archive this file after the player missile slice is complete and its final contract has been merged into `PROJECT_CONTEXT.md`.

Last updated: 2026-08-01

Base verified `master`:

```text
66e5caadd0594cc0bc81dc3f429be9cce020b946
```

Verification at handoff:

```text
typecheck green
tests green
```

---

# 1. Goal

Implement the first complete player missile offense flow.

Target result:

```text
Weapons chooses FIRE MISSILE
→ missile aiming task
→ missile launches
→ Weapons becomes free
→ launcher enters cooldown
→ missile flies independently
→ shield or hull impact
→ possible enemy destruction
```

The first version must be mechanically complete before enemy defensive behavior is added.

---

# 2. Completed prerequisites

Already implemented:

## Generic missile source

```ts
source:
    | { kind: 'actor'; actorId: string }
    | { kind: 'player_ship' }
```

Missile target supports player ship or actor target.

## Incoming-threat filters

Science threat identification and player point defense accept only:

```text
actor source
+ player ship target
```

A player missile must not appear as an incoming threat.

## Player weapon persistence

Encounter weapon state synchronizes back into `GameRuntime`.

The launcher phase/ammo can therefore use the existing persistence path.

## Starter launcher

Installed runtime weapon:

```text
id: missile_launcher_player_00
weaponId: missile_launcher_00
loadedMissileId: red_00
ammoCount: 5
phase: ready
phaseElapsedMs: 0
```

Created from:

```text
MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00
```

## Enemy destruction

Enemy hull zero already triggers:

- encounter actor removal;
- persistent node actor removal;
- telemetry clear;
- explosion;
- sprite removal;
- bridge continuation without `EndScene`.

## Combat object lifetime

Flying projectiles are encounter-local.

Do not persist the outgoing missile into `GameRuntime`.

---

# 3. Locked gameplay contract

## Command availability

Weapons can fire only when:

```text
live hostile actor exists
launcher phase is READY
ammoCount > 0
Weapons is available
```

First version uses one current hostile target.

No missile target zones.

Suggested player-facing command label:

```text
FIRE MISSILE
```

Do not lock internal command/target enum names before reading the fresh command model.

## Aiming

Accepted command:

```text
launcher enters targeting/preparation state
→ Weapons starts MISSILE AIM
```

During aiming:

- Weapons is busy;
- ammo is not spent yet;
- task can follow the same cancellation conventions as player laser aiming unless fresh code shows a reason not to;
- target identity must be retained by the task/weapon flow.

If the target disappears before launch:

```text
task ends/cancels
launcher returns to READY
ammo is unchanged
no projectile is created
```

Do not invent the exact aim duration from memory.

Read the existing missile launcher definition/preset and current enemy launcher lifecycle first, then agree whether the player reuses that duration or has a player-specific rule.

## Launch

When aiming completes successfully:

```text
ammoCount -= 1
projectile is created
launcher enters cooldown
Weapons task completes
Weapons becomes free immediately
```

Ammo is spent at launch, not command acceptance.

The projectile continues independently of Weapons.

## Flight and target loss

Outgoing projectile:

```text
source.kind = player_ship
target.kind = actor
target.actorId = selected enemy
```

If the target is removed after launch:

```text
outgoing projectile is removed
no impact damage
no duplicate destruction event
```

This is a player-missile-specific target-loss rule.

Do not change the existing rule for already launched enemy missiles:

```text
enemy dies
→ enemy missiles already flying toward player continue
```

## Impact

At impact:

```text
check current enemy shield state
→ consume/block with shield first
→ otherwise damage hull
```

Shield state is checked at impact, not launch.

If hull reaches zero, use the existing enemy destruction flow.

Do not create a second destruction implementation.

## Cooldown and empty state

Launcher cooldown advances independently after launch.

When cooldown finishes:

```text
ammo > 0 → READY
ammo = 0 → use existing EMPTY/ready-empty contract from current weapon model
```

Read the exact existing launcher phase logic before implementation.

Do not invent a parallel player-only launcher state machine.

---

# 4. Explicitly out of scope

Do not add in this slice:

- enemy point defense;
- enemy evasion;
- enemy Engineer defensive shield policy;
- general enemy captain defense policy;
- BLUE player missiles;
- missile type selection/reloading;
- ammunition resupply;
- subsystem targeting;
- critical hits;
- persistent flying projectiles;
- final captain-desk ammo UI;
- balance pass.

Outgoing missile art is deferred until the view atom.

---

# 5. Important existing boundary

Current bridge handling of:

```text
ENCOUNTER_EVENT.MISSILE_LAUNCHED
```

assumes an incoming actor-sourced missile.

It currently validates:

```text
projectile.source.kind === ACTOR
```

and throws for another source.

Therefore a player projectile cannot simply pass through the existing incoming bridge path.

Before editing, inspect all usages of:

```text
MISSILE_LAUNCHED
INCOMING_MISSILE_ADDED
INCOMING_MISSILE_UPDATED
INCOMING_MISSILE_REMOVED
getCombatProjectiles
```

Choose an explicit presentation contract.

Acceptable directions include:

- branch the engine event by source and emit separate bridge events;
- introduce a dedicated player missile launch/impact event;
- keep one domain projectile model but separate incoming/outgoing presentation adapters.

Do not weaken the incoming handler to accept player source while still constructing incoming-missile UI data.

---

# 6. Required repository inventory before code

In the new chat, first read:

```text
PROJECT_CONTEXT.md
BACKLOG.md
PLAYER_MISSILE_HANDOFF.md
```

Then inspect fresh `master`.

Search all usages of:

```text
MISSILE_LAUNCHED
MISSILE_IMPACT
MISSILE_DESTROYED / projectile removal events
COMBAT_PROJECTILE_KIND.MISSILE
COMBAT_SOURCE_KIND
COMBAT_TARGET_KIND
MissileLauncherFactory
MissileLauncherState
SHIP_WEAPON_PHASE
sourceWeaponId
target.actorId
getCombatProjectiles
setPlayerShipWeaponStates
```

Also inventory:

- full player ship snapshots;
- full player weapon-array expectations;
- command registries;
- officer task unions/factories/runners;
- event unions and exhaustive switches;
- bridge event maps;
- incoming missile views;
- enemy damage/destruction tests.

Do not start an apply script until this inventory is complete.

---

# 7. Recommended implementation atoms

The exact file list must come from fresh repository inspection.

## Atom 1 — Command and aiming task

Scope:

- command ID/definition/registration;
- target current hostile actor;
- launcher availability query;
- Weapons task state/factory;
- command execution starts aiming;
- cancellation/target-loss before launch restores READY;
- no ammo spend.

Tests:

- available with live target + READY + ammo;
- hidden with no enemy;
- hidden during cooldown/targeting;
- hidden at zero ammo;
- execution starts one Weapons task;
- launcher enters targeting;
- cancellation restores READY and preserves ammo;
- target removed during aim preserves ammo.

No projectile yet.

## Atom 2 — Launch and launcher lifecycle

Scope:

- aim completion launches projectile;
- decrement ammo exactly once;
- enter cooldown;
- complete Weapons task immediately;
- player-source / actor-target projectile state;
- launcher cooldown/empty transition.

Tests:

- projectile fields;
- ammo decrement;
- task removed after launch;
- Weapons available after launch;
- cooldown advances;
- no double launch on large step;
- empty launcher does not become fireable.

No bridge view yet.

## Atom 3 — Outgoing projectile resolution

Scope:

- advance player missile flight;
- actor target lookup;
- target-lost self-destruction/removal;
- shield-first impact;
- hull damage;
- existing enemy destruction flow.

Tests:

- shield consumes impact;
- unshielded hull loses expected damage;
- hull zero emits existing destruction event once;
- target removed before impact removes projectile with no damage;
- player missile remains absent from Science/PD threat commands.

Keep existing incoming enemy missile behavior unchanged.

## Atom 4 — App/presentation contract

Scope:

- engine events or snapshots distinguish outgoing missile;
- bridge controller synchronizes outgoing projectile presentation;
- no incoming-threat warning/HUD for player missile;
- launch/flight/impact/self-destruct presentation events;
- enemy target position lookup before actor removal where required.

No final asset assumptions until event/view coordinates are clear.

## Atom 5 — Asset and view

Agree first:

- raw asset path;
- atlas frame;
- sprite orientation;
- display size;
- player launch origin;
- enemy impact target point;
- step-based motion style.

Then draw/import the outgoing missile and implement:

- launch flash;
- flight;
- shield block or hull impact;
- target-lost self-destruction.

## Atom 6 — Runtime acceptance

Verify the complete slice before enemy defenses.

---

# 8. Required tests

At minimum, lock these contracts:

## Availability

```text
READY + ammo + live enemy → FIRE MISSILE available
cooldown/targeting/empty/no enemy → unavailable
```

## Resource timing

```text
command accepted → ammo unchanged
launch occurs → ammo decremented exactly once
cancel/target lost before launch → ammo unchanged
```

## Officer timing

```text
aiming → Weapons busy
launch → Weapons immediately free
projectile flight → Weapons remains free
```

## Projectile identity

```text
source = player_ship
target = actor/current enemy
sourceWeaponId = missile_launcher_player_00
```

## Target loss

```text
enemy destroyed after launch
→ projectile disappears
→ no impact
→ no second destruction
```

## Impact

```text
shield present → shield first
no shield → hull damage
hull zero → existing destruction flow
```

## Threat isolation

```text
player missile
→ not shown to Science IDENTIFY THREAT
→ not shown to player point-defense commands
→ not sent to incoming missile bridge HUD
```

## Persistence

```text
launcher phase/ammo
→ complete player weapon array synchronized into GameRuntime
```

Do not persist the projectile.

---

# 9. Runtime acceptance checklist

After typecheck/tests:

1. Weapons menu shows `FIRE MISSILE` only with a live enemy and available launcher.
2. Starting aim occupies Weapons.
3. Cancelling aim preserves ammunition.
4. Launch spends exactly one missile.
5. Weapons becomes free while the missile is still flying.
6. Launcher enters cooldown.
7. Missile visibly travels toward the enemy.
8. Enemy shield blocks before hull damage.
9. Unshielded impact damages hull.
10. Missile can trigger the existing enemy destruction explosion.
11. Laser destroys the enemy while missile is in flight:
    - missile disappears/self-destructs;
    - no duplicate destruction;
    - no stale telemetry or sprite.
12. FLY TO/JUMP away removes active projectiles because combat objects are encounter-local.
13. Persistent launcher ammo/phase remains correct after ordinary bridge/runtime synchronization.
14. No enemy countermeasure behavior appears yet.

---

# 10. Apply-script discipline for this slice

Recent script failures were process errors, not reasons to broaden architecture.

For every atom:

```text
fresh HEAD
→ exact usage/test inventory
→ read exact contracts
→ prepare one coherent transform
→ validate all counts/invariants
→ write only after full success
```

Rules:

- exact HEAD guard;
- no broad replacement of common field shapes;
- no inferred factory parameters;
- update all full-loadout snapshots in the same atom that changes loadout shape;
- use local variables when TypeScript narrowing would be lost inside callbacks;
- full-file rewrite small tests when clearer;
- recovery scripts stay narrow;
- do not claim a failed staged script changed source files when it stopped before writes.

---

# 11. Slice completion

The player missile slice is complete only when:

```text
command
+ aiming
+ launch/ammo/cooldown
+ independent projectile
+ target-loss self-destruction
+ shield/hull impact
+ enemy destruction integration
+ bridge presentation
+ runtime acceptance
```

After completion:

1. update `PROJECT_CONTEXT.md`;
2. update `BACKLOG.md`;
3. remove or archive this file;
4. restore enemy SCIENCE/spam in a separate atom;
5. begin enemy defense behavior as a separate design/implementation pass.
