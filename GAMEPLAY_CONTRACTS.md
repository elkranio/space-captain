# Space Captain — Gameplay Contracts

Living gameplay invariants and explicitly selected near-term design contracts. If code and this file disagree, inspect current code first. Sections marked **SELECTED / NOT IMPLEMENTED** describe the next intended change and must not be mistaken for current runtime behavior.

Updated: 2026-08-15
Reference HEAD: `e7fb792e430d6745ae50c7d7ddb84513fe5bc918`

## Encounter shape

- One full enemy ship at a time.
- Missiles, Beam Cannon attacks, SPAM and sticky mines are threats produced by ships, not additional command-capable enemies.
- Combat is readable timing pressure + crew commitment + resource conflict, not bullet hell.
- The player should normally have time to understand a threat; difficulty comes from overlapping demands and opportunity cost rather than twitch reaction.
- Physical threats may outlive their source actor.

### Source-independent physical threat invariant

Once an actor-launched missile exists and targets `PLAYER_SHIP`:
- it remains in simulation if the source actor is destroyed;
- it remains analyzable when Science commands are otherwise available;
- it remains interceptable when Weapons/Defense Turret commands are otherwise available;
- source-actor existence is not required to resolve it.

## Encounter simulation vs presentation

Presentation effects must not stop authoritative simulation unless a real gameplay contract explicitly requires a pause.

Current enemy-destruction contract:
- enemy actor destruction may start a local explosion/destruction view;
- the 600 ms destruction animation runs in presentation time;
- `EncounterEngine.step()` continues;
- missiles, mines, tasks, Power Core recharge and other encounter systems continue;
- destruction completion does not own/unlock `isEncounterInteractive`.

## Officer command truth

- Engine decides command availability.
- App/controller may map a real `AvailableOfficerCommand` to a dashboard affordance.
- Views never recreate gameplay availability rules.
- Starting a command creates/owns an officer task in engine state.
- Cancellation belongs to the active task, not to the UI surface that started it.
- Busy-role behavior comes from engine availability; presentation does not maintain a second busy-command ruleset.

## Combat pacing principle

The desired pressure model is:
- telegraph through the weapon’s real physical/crew phase;
- player decides;
- crew/system work executes;
- attack delivers/resolves;
- weapon/system cooldown follows.

Avoid a universal extra telegraph phase that exists only to gift reaction time.

If a threat needs more response time, tune its real phase:
- longer missile lock/flight;
- longer Beam Cannon charge;
- slower SPAM buildup/channel pressure;
- mine dispensing/fuse timing.

## Weapon phase semantics — CURRENT IMPLEMENTATION

Current code has one shared content value:

`ship_weapon_rules.json -> enemy_targeting.durationMs = 3000`

It is exported as `SHIP_WEAPON_TARGETING_DURATION_MS`.

Despite the content name, it is currently used by both player and enemy weapon runners and acts as a generic pre-phase for multiple weapon families.

This is known stale semantics and is selected for cleanup.

## Weapon phase semantics — SELECTED / NOT IMPLEMENTED

`TARGETING` should remain only when actual target acquisition is part of that weapon.

### Missile Launcher

Intended lifecycle:

```text
READY
  -> TARGETING / LOCKING
  -> LAUNCH
  -> COOLDOWN
  -> READY
```

Rules:
- a missile should not be a free instantaneous launch;
- Weapons must perform a short real lock/targeting commitment;
- the beginning of lock is itself an observable attack telegraph;
- after launch, the projectile is autonomous and Weapons is free when the task contract allows.

If naming cleanup is worthwhile, `LOCKING` is a clearer conceptual term than generic `TARGETING`, but do not rename broadly unless it genuinely improves the concrete code.

### Beam Cannon

Intended lifecycle:

```text
READY
  -> CHARGING
  -> FIRE
  -> COOLDOWN
  -> READY
```

Rules:
- no generic pre-targeting;
- charging is the actual offensive commitment and telegraph;
- Beam Cannon has no ammo economy;
- occupied Weapons time is a major part of its cost;
- do not convert it to “quick aim, autonomous charge” before combat testing proves the commitment unfun.

### SPAM

Intended lifecycle:

```text
READY
  -> CHANNELING
  -> COOLDOWN
  -> READY
```

Rules:
- no generic pre-targeting;
- the channel itself is the attack and telegraph;
- Science remains occupied according to the real channel/operator contract.

### Sticky Mine Dispenser

Intended lifecycle:

```text
READY
  -> DISPENSING
  -> COOLDOWN
  -> READY
```

Rules:
- no generic pre-targeting;
- dispensing is the attack start/telegraph;
- existing salvo mechanics remain valid while the single-mine experiment is evaluated.

### Telegraph rule

Remove the generic “the UI telepathically knows some attack will happen soon” layer.

Telegraph begins when a real observable weapon action begins:
- missile: lock/targeting starts;
- Beam Cannon: charging starts;
- SPAM: channel starts;
- mines: dispensing/launch begins.

## Shared Power Core

There is one shared player defensive energy store.

Current BASIC contract:
- capacity: 4 charges;
- sequential recharge;
- one charge recharge duration: 24 s;
- Defense Turret and Shield Generator draw from the same pool.

A defensive consumer commits energy when its work starts. Later cancellation/interruption does not refund committed energy.

Future missing contract:
- Power Core can become BROKEN;
- on break: charges -> 0 and recharge progress -> 0;
- defensive consumers cannot draw energy while broken.

## Shield Generator / Active Shield

Installed hardware: **Shield Generator**.
Temporary encounter object: **Active Shield**.

Current BASIC Shield Generator:
- persistent installed player/enemy system;
- ONLINE/BROKEN status vocabulary exists;
- READY/COOLDOWN phase;
- no private charge pool;
- player `ENGINEER_DEPLOY_SHIELD` requires working/ready generator, no existing Active Shield and available Power Core charge;
- Power Core charge is committed at task start;
- current deploy task: 3000 ms;
- current BASIC generator cooldown: 5000 ms.

Current Active Shield:
- encounter-local;
- BASIC lifetime: 5000 ms;
- covers the whole hull for now;
- absorbs exactly one incoming Beam Cannon hit;
- disappears on absorption;
- otherwise expires at TTL.

Future:
- breaking Shield Generator should immediately remove an active shield;
- exact timings are balance values.

## Defense Turret

Defense Turret is a separate installed defensive module.

Current contract:
- no private charge/ammo pool;
- consumes shared Power Core;
- Weapons owns player loading/operation flow;
- READY / LOADING / COOLDOWN phases;
- one missile intercept action;
- current BASIC `blindInterceptChance = 0.4`;
- player and enemy missile interception use the same pure resolution rule;
- a committed attempt costs Power Core regardless of HIT/MISS;
- MISS leaves the missile alive;
- player installed-system break/repair lifecycle is incomplete.

## Missiles

### Physical content ownership

There is no separate Missile content entity.

Missile Launcher content owns:
- name;
- damage;
- flight duration;
- ammo capacity;
- cooldown duration.

At launch, the projectile copies the physical values needed for its autonomous lifecycle.

Create a separate ammo/missile content layer only if future gameplay introduces genuinely selectable missile/ammo types.

### Objective truth

Every launched missile projectile has its own hidden runtime signature.

Invariants:
- runtime signature is projectile-instance truth;
- it is not launcher/model content;
- identical launchers may produce projectiles with different runtime signatures;
- projectile/content IDs must not reveal or reconstruct the runtime signature.

### Observer Science intel

Observer knowledge is separate from projectile truth.

Public states:

`UNKNOWN`
- no concrete hypothesis.

`UNCERTAIN`
- concrete hypothesis exists;
- operationally usable;
- may objectively be correct or wrong;
- can be analyzed again while command availability permits.

`CONFIRMED`
- concrete hypothesis exists;
- invariant: it matches objective projectile truth;
- terminal for that projectile.

There is no public `INCORRECT` state/correctness flag.

### Science analysis

Current profiles:
- `STANDARD`
- `IMPAIRED`

Current confidence families:
- `CERTAIN`
- `STRONG`
- `WEAK`

Rules:
- `CERTAIN` -> truthful `CONFIRMED`;
- `STRONG` / `WEAK` -> `UNCERTAIN`;
- uncertain hypothesis may be correct or wrong;
- confidence is qualitative information, not a displayed numeric percent.

Current hidden tuning:
- STANDARD: 45% CERTAIN, 40% STRONG, 15% WEAK;
- IMPAIRED: 10% CERTAIN, 45% STRONG, 45% WEAK.

### Defense Turret resolution

```text
concrete hypothesis matches projectile truth
    -> guaranteed HIT

no hypothesis OR wrong hypothesis
    -> blind roll using installed Defense Turret blindInterceptChance
```

Therefore:
- CONFIRMED + correct -> guaranteed;
- UNCERTAIN + correct -> guaranteed;
- UNCERTAIN + wrong -> blind;
- UNKNOWN -> blind.

## Missile intel presentation direction — SELECTED / NOT IMPLEMENTED

The compact threat-object concept should not expose internal signature truth directly, but it may present a player-facing short code derived from allowed observer intel.

Desired visual language:
- no intel: `?????` in red;
- partial/uncertain: e.g. `ABC??` in yellow;
- confirmed: e.g. `ABCDE` in green.

Potential future extension:
- number of remaining `?` can represent degree of partial confidence/intel when a perk or mechanic deliberately exposes that granularity;
- player-facing signature strings can be short randomized 4–5 character codes for personality/screenshots, provided they remain presentation/intel and never leak objective hidden truth.

Science action label remains stable (`TRACK`) while more analysis is possible. Do not create `TRACK -> CONFIRM` label churn unless testing proves it clearer.

## Beam Cannon

Current heavy precision energy weapon is **Beam Cannon**. Old Laser naming is retired for this weapon.

Current combat contract:
- long charge;
- no ammo economy;
- without Active Shield, firing damages hull;
- with Active Shield, firing is absorbed and shield is consumed;
- Engineer shield deployment is the current defensive response;
- current whole-hull impact points are presentation anchors, not semantic damage nodes.

Design direction:
- Beam Cannon may become the free/slow precision weapon;
- future shots may target HULL or concrete hardpoints/systems/officers;
- disabling enemy hardpoints can occupy enemy Engineer through repair;
- the main cost of a free Beam Cannon shot is Weapons commitment/time.

### Beam intel presentation direction — SELECTED / NOT IMPLEMENTED

The same compact intel code language should work for Beam Cannon threats.

Possible confirmed target codes:
- `HULL`
- `WPNS`
- `PWR`
- `SHLD`
- other stable 4–5 character system codes.

Unknown/partial forms use the same red/yellow/green + `?` grammar.

Do not implement semantic node targeting from current VFX anchor positions. Define actual target state first.

## Sticky mines

There is no separate Sticky Mine content entity.

Sticky Mine Dispenser content owns:
- damage;
- fuse duration;
- ammo capacity;
- salvo size;
- launch interval;
- cooldown duration.

Every attached mine is an independent runtime `StickyMineState`.

Enemy -> player:
- each mine attaches independently;
- each can be cleared independently;
- detonation damages hull and may interrupt work;
- dashboard shows each hostile mine independently.

Player -> enemy:
- each mine attaches independently;
- enemy AI may assign available roles to clear it;
- uncleared detonation damages enemy hull.

Do not aggregate attached mine identity for UI convenience.

### Single Mine experiment — SELECTED / NOT IMPLEMENTED

Keep the current salvo dispenser and add a second content definition in the same weapon family:
- `salvoSize = 1`;
- short enough operation/cooldown to permit deliberate repeated single shots;
- compare against salvo behavior in real combat.

Do not add a new weapon kind/runner unless the experiment proves the mechanic genuinely diverges beyond content tuning.

## SPAM

- SPAM is a channel/progress effect, not a projectile.
- Science launches player SPAM.
- Enemy Science can purge player SPAM.
- Player Science can purge enemy SPAM.
- Active crew-progress modifiers are exposed through canonical `getActiveCrewProgressEffects()`.
- Enemy decision policy receives relevant SPAM effects through explicit decision context rather than reading full encounter state.

## Damage / interruption

- Hull damage is engine-owned.
- Weapon/defense runners resolve physical outcomes; UI only presents them.
- Damage-interruptible officer tasks are interrupted by engine rules, not view logic.
- Do not infer semantic damage nodes from visual impact anchors.

## Enemy crew architecture

Enemy crew is simulated, not a mirrored player bridge.

Current ownership:
- decision snapshot/perceived facts provide the policy boundary;
- `EnemyDecisionPolicy` chooses work;
- `EnemyWorkExecutor` authoritatively revalidates and starts concrete work;
- `EnemyCrewTaskRunner` owns crew task lifecycle;
- specialized combat runners own physical weapon/defense lifecycle;
- `EnemyThreatObserver` / Science observation stays separate from objective truth.

Policy does not own full `EncounterState`.

Keep this separation unless a concrete simplification is proven.
