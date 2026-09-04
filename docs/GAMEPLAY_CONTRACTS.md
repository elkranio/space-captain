# Space Captain — Gameplay Contracts

This file describes **current implemented runtime behavior**.

It is not the canonical statement of future game design. If intended design changes, record that separately and change
code deliberately; do not reinterpret current runtime to match a remembered idea.

If code and this file disagree, inspect current code first.

## Encounter and presentation

- One full enemy ship is fought at a time.
- Missiles, Beam attacks, SPAM and sticky mines are threats produced by ships, not additional command-capable enemies.
- Physical/effect threats may outlive their source actor when their own lifecycle allows it.
- Presentation effects do not pause authoritative simulation unless a real gameplay rule explicitly requires it.

A launched enemy Missile targeting `PLAYER_SHIP` remains autonomous if its source actor is destroyed and remains
interceptable while the relevant player command is available.

## Officer command truth

- Every command belongs to one officer role.
- Engine state decides command availability and busy/blocked behavior.
- Starting work creates an engine-owned officer task.
- Cancellation belongs to the active task, not to the UI surface that created it.
- App/controller code maps engine availability; views do not recreate legality.

## Player information baseline

Basic incoming-threat identity is free:

- Missile is known immediately;
- Beam target node is known immediately (`HULL | DRIVE`);
- Sticky Mine is known immediately;
- SPAM is known immediately.

There is no player-facing mandatory Scientist TRACK/IDENTIFY step for normal threat readability.

Enemy observer/Scientist systems remain separate and may still reason from perceived information rather
than objective truth.

## Current ship/loadout shape

Chassis/loadout identity is now implemented.

Current implementation truth:

- persistent player and enemy ships carry real `chassisId`;
- chassis definitions own stable physical slot layout;
- current slot kinds are `DRIVE | WEAPON | DEFENSE | UTILITY`;
- slots have stable ids and grid coordinates; Hull is not a slot;
- persistent mounts preserve `slotId -> runtime equipmentId`;
- installed Drive, Defense Turret, Shield Generator and weapons may remain dedicated typed fields while mounts preserve
  spatial identity;
- Power Core remains a separate non-spatial installation;
- Debug Start uses normalized `equipment[]` records with explicit `slotId`, equipment family discriminator and
  `equipmentId`;
- the Debug Start content editor renders chassis-aware equipment grids and filters choices by slot compatibility.

Encounter equipment integrity is also generalized:

- Drive, Defense Turret, Shield Generator and weapons carry encounter-local `integrity`;
- installed equipment owns integrity/BROKEN; a slot target resolves equipment via its mount, not a separate slot-health pool;
- `maxIntegrity` comes from equipment content definitions;
- encounter creation hydrates fresh integrity;
- encounter-only integrity is explicitly stripped at persistent snapshot boundaries and does not become run attrition;
- shared helpers define `integrity > 0` operational truth and clamped integrity damage.

The existence of generalized integrity does **not** mean every equipment family is already fully wired to BROKEN command
gating, repair behavior or targeted damage. Those mechanics remain explicit follow-up work.

Current player Beam still targets the enemy actor as a whole. Semantic `HULL | SLOT(slotId)` player targeting remains
future work.

## Weapon lifecycle and cooldown commitment

Reaction time comes from each weapon's real lifecycle rather than a universal fake pre-warning phase.

Committed cooldown advances in encounter time and may overlap active crew/action time. Cancellation or interruption after
commitment does not refund committed cooldown or resources. Some current pre-commitment cancellation paths remain free.

Current cooldown start edges:

| System | Player | Enemy |
| --- | --- | --- |
| Missile Launcher | Physical launch | Physical launch |
| Beam Cannon | Charging starts | Charging starts |
| Sticky Mine Dispenser | First mine launches; overlaps the rest of the salvo | First attachment attempt; overlaps salvo |
| SPAM Projector | Channel operation ends | Channeling starts |
| Defense Turret | Attempt completes or is cancelled | Loading starts |
| Shield Generator | Deployment task starts | Deployment task starts |
| Evade | Maneuver starts | Maneuver starts |

Several rows differ from the confirmed design: cooldown should start after active work or allowed termination.
Free Missile-targeting cancellation is an intentional exception and should remain. See the per-system table in
`GAME_DESIGN.md` for intent and `BACKLOG.md` for the separate gameplay correction.
Do not mistake a later visible `COOLDOWN` phase for the point when its countdown begins.

Current weapon phase shapes (`COOLDOWN` is skipped if the committed recovery has already finished):

```text
Missile Launcher:       READY -> TARGETING -> LAUNCH -> COOLDOWN -> READY
Beam Cannon:            READY -> CHARGING  -> FIRE   -> COOLDOWN -> READY
SPAM Projector:          READY -> CHANNELING         -> COOLDOWN -> READY
Sticky Mine Dispenser:  READY -> DISPENSING          -> COOLDOWN -> READY
```

Concrete commitment edges are owned by each system rather than a shared generic phase machine.

Current player cancellation details:

- Missile targeting cancellation returns the launcher to READY without ammo or cooldown cost;
- Beam cancellation keeps spent Power and only the remaining cooldown, rather than starting a fresh full cooldown;
- an interrupted mine salvo keeps spent ammo and remaining recovery; before its first mine, no cooldown is committed;
- player mine salvos and active SPAM cannot be manually cancelled; engine cancellation uses their concrete cleanup paths;
- player Turret cancellation starts a full cooldown; Evade and Shield keep their already-running recovery.

Source entry points: `src/engine/defs/ship_weapon.ts`, `src/engine/defs/ship_evade.ts`,
`src/engine/encounter/state/PlayerShipStore.ts`, `src/engine/encounter/combat/enemy/EnemyWorkExecutor.ts`, and the concrete
family runners under `src/engine/encounter/combat/`.
Timing coverage includes `tests/engine/defs/ship_evade.test.ts` and the encounter suites
`player_beam_cannon_lifecycle.test.ts`, `player_missile_command.test.ts`, `player_sticky_mine_command.test.ts`,
`player_spam_projector.test.ts`, `gunner_defense_turret_command.test.ts` and `player_shield_deploy.test.ts`.

## Pilot Evade

```text
READY -> WARMUP -> EVADING -> COOLDOWN (if recovery remains) -> READY
```

Current rules:

- command start commits Power Core cost and full cooldown;
- cooldown counts down during WARMUP/EVADING, so the maneuver can end directly in READY;
- Pilot is occupied for the maneuver;
- cancellation/interruption does not refund committed Power/cooldown;
- the main Drive must be operational;
- deterministic protection exists only during `EVADING`;
- Missiles, Beam hits and new sticky-mine attachments are evadable;
- SPAM and already-attached mines are not evadable;
- Evade does not slow/block Scientist, Gunner or Engineer.

The confirmed 1-integrity Drive cost at Evade end is not implemented yet.

## Shared Power Core

Current runtime uses one shared Power Core:

- capacity: 4 charges;
- recharge is sequential;
- current player consumers include Evade, Defense Turret, Shield Generator and Beam Cannon;
- committed energy is not refunded after later cancellation/interruption.

Player Beam uses the Beam Cannon definition's `powerCost`. The command is unavailable without enough current charge, and
the cost is committed when charging starts.

## Shield Generator / Active Shield

Installed hardware is the Shield Generator. Its temporary encounter object is an Active Shield.

Player Active Shield currently targets exactly one Beam node:

```text
HULL | DRIVE
```

Player rules:

- deployment is Engineer work and uses shared Power Core;
- selected node travels through the real command/task flow;
- deployment commits Power and generator cooldown at task start;
- later cancellation/interruption does not refund committed resources;
- matching Beam absorbs one hit and consumes the Shield;
- wrong-node Beam penetrates and leaves the Shield alive;
- Evade miss leaves the Shield alive;
- Active Shield also expires naturally.

Current incoming Beam resolution order is:

```text
EVADING
    -> MISS; Active Shield survives

else matching Active Shield target
    -> ABSORBED; Active Shield is consumed

else
    -> Beam consequence; wrong-node Active Shield survives
```

Enemy targeted-Shield placement is not implemented yet; enemy Shield behavior still follows its existing
whole-ship path.

## Defense Turret

Player BASIC contract:

- no private charge/ammo pool;
- uses shared Power Core;
- Gunner owns operation;
- one Missile intercept flow;
- if the Gunner task completes while the target Missile still exists, interception is guaranteed;
- no player Scientist hypothesis/percentage/tier is required.

Enemy Defense Turret uses its own loading/crew decision path, but current physical shot resolution is also
deterministic: if loading completes against the still-live player Missile, the shot resolves as `HIT`.

`HIT | MISS` remains a meaningful outcome contract for future accuracy/crew/tier mechanics, but there is no current
random interception roll.

## Missile Launcher / Missiles

Missile Launcher content owns damage, targeting duration, flight duration, ammo capacity and cooldown. A launched
projectile copies the physical values needed for its autonomous lifecycle.

The old Missile signature / Science hypothesis / blind-intercept runtime has been removed. Current Missile projectiles
carry only the physical snapshot needed for their autonomous lifecycle.

## Beam Cannon

Current incoming enemy Beam contract:

- long charge telegraph;
- no ammo economy;
- target chosen once per concrete attack;
- target domain exactly `HULL | DRIVE`;
- concrete target is immediately safe for player presentation;
- independent `hullDamage` and `moduleDamage` values.

Penetrating consequences:

```text
HULL
    -> hullDamage

operational DRIVE
    -> moduleDamage to encounter-local Drive integrity
    -> no hull damage

hit that breaks DRIVE
    -> no overkill spill into hull

already BROKEN DRIVE
    -> hullDamage * 2
```

Current Drive baseline:

```text
2/2 -> operational
1/2 -> operational, not repairable
0/2 -> BROKEN, repairable
repair -> full integrity
```

Escape availability derives from authoritative Drive state; Beam does not own a duplicate escape flag.

Current enemy Beam target choice is simple random `HULL | DRIVE`.

Current player Beam spends its content-defined Power Core cost when charging begins and still targets the enemy actor
as a whole. Semantic player Beam node targeting remains future work.

## Sticky mines

Sticky Mine Dispenser content owns damage, fuse duration, ammo capacity, salvo size, launch interval and cooldown.

Every attached mine is an independent runtime object; threats are not aggregated for UI convenience.

Current clearing contract is Engineer-only for both player and enemy. Missing/busy Engineer does not fall
back to another
role.

## SPAM

- SPAM is a long-lived effect, not a projectile.
- Scientist launches player SPAM.
- Enemy Scientist can purge player SPAM.
- Player Scientist can purge enemy SPAM.
- Active crew-progress modifiers use engine read models.
- Player SPAM threat presentation uses real effect duration/progress, not a decision timing window.
- `BridgeSpamView` shows viewscreen garbage/ads on the projection layer, below bridge controls/UI; this is implemented.

## Damage and interruption

- Hull/module damage is engine-owned.
- Physical runners resolve combat outcomes.
- UI presents outcomes only.
- Damage-interruptible officer tasks are interrupted by engine rules.

## Enemy crew boundary

Enemy crew is simulated, not a mirrored player bridge:

- perceived/decision facts provide the policy boundary;
- `EnemyDecisionPolicy` chooses work;
- `EnemyWorkExecutor` revalidates/commits/starts it;
- `EnemyCrewTaskRunner` owns crew task lifecycle;
- specialized runners own physical system phases;
- enemy observation/Scientist intel remains separate from objective truth.

Enemy policy does not own full mutable encounter state.
