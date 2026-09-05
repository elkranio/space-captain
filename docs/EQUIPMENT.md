# Space Captain — Equipment Mechanics & Idea Bank

Equipment-focused reference. Use status labels literally:

- **LANDED** — current runtime behavior;
- **CONFIRMED TODO** — intended behavior we have decided to build/fix;
- **CONFIRMED NEED** — a design need is real, but its concrete equipment solution is not designed yet;
- **IDEA BANK** — brainstorm only; do not implement without explicit promotion;
- **OPEN** — a detail intentionally waits for design/playtest.

`GAMEPLAY_CONTRACTS.md` owns current runtime truth. `GAME_DESIGN.md` owns confirmed cross-system rules. This file
keeps per-equipment status and uncommitted equipment ideas in one place without promoting the ideas by accident.

## Shared equipment model

### LANDED

Current spatial slot kinds:

```text
DRIVE
WEAPON
DEFENSE
UTILITY
```

Hull is not equipment/slot. Power Core is separate, non-spatial, non-breakable and non-targetable.

Current breakable equipment has content-owned `maxIntegrity` and encounter-local `integrity`:

- Drive;
- Defense Turret;
- Shield Generator;
- Missile Launcher;
- Beam Cannon;
- Sticky Mine Dispenser;
- SPAM Projector.

Installed equipment owns integrity/BROKEN. Slots own spatial identity and resolve equipment through mounts.

```text
integrity > 0 -> OPERATIONAL
integrity = 0 -> BROKEN
```

### CONFIRMED TODO

Finish the shared behavior around the already-landed integrity foundation:

- BROKEN equipment cannot perform its function;
- command availability and physical execution use the same operational truth;
- Engineer repairs only BROKEN equipment;
- repair restores full integrity;
- damaged-but-operational equipment is not a routine mid-combat top-off target;
- surviving encounter-local integrity returns to full at encounter end.

Drive already has the specific BROKEN-only repair path; the remaining work is the generic rule across equipment
families.

## Current equipment overview

| Category | Equipment | Slot | Operator | Status |
| --- | --- | --- | --- | --- |
| Movement | Drive | DRIVE | Pilot | LANDED / Evade wear + cooldown correction TODO |
| Defense | Defense Turret | DEFENSE | Gunner | LANDED / generic BROKEN TODO |
| Defense | Shield Generator | DEFENSE | Engineer | LANDED / target migration + cooldown TODO |
| Weapon | Missile Launcher | WEAPON | Gunner | LANDED |
| Weapon | Beam Cannon | WEAPON | Gunner | LANDED / shared target migration + Bridge consequence TODO |
| Weapon | Sticky Mine Dispenser | WEAPON | Gunner | LANDED single-shot |
| Utility | SPAM Projector | UTILITY | Scientist | LANDED / enemy purge-symmetry TODO |
| Power | Power Core | separate | shared | LANDED |

## Drive

### LANDED

Drive owns encounter-local integrity and current Evade tuning.

Current runtime Evade:

```text
READY -> WARMUP -> EVADING -> COOLDOWN (if recovery remains) -> READY
```

- Pilot operates it;
- current runtime spends CORE and commits cooldown at maneuver start;
- current `EVADING` avoids Missile hits, incoming Beam hits and new Mine attachments;
- attached Mines and SPAM are unaffected;
- incoming Beam can damage Drive integrity;
- zero integrity is BROKEN;
- existing specific Engineer repair restores Drive to full.

### CONFIRMED TODO — after-action Evade lifecycle

WARMUP is the commitment edge. Once WARMUP begins:

- CORE remains spent;
- completion / manual cancel / explicit `INTERRUPT` / `STUN` terminates the maneuver;
- termination deals 1 Drive integrity damage;
- full cooldown begins after termination, not in parallel with WARMUP/EVADING.

The last integrity point may power one final Evade and break afterward.

## Power Core

### LANDED

Current basic player Core:

```text
capacity = 4 charges
recharge = sequential
```

Current player consumers:

- Evade;
- Defense Turret;
- Shield Generator;
- Beam Cannon.

Player Beam spends its content-defined cost when charging starts and does not refund committed CORE after later
termination.

Power Core remains outside the 4x3 spatial equipment grid.

### IDEA BANK — offensive CORE disruption

A future Utility may attack **current enemy CORE charges** without turning Power Core hardware into a breakable
target. Possible effects include burning charges, delaying recharge or temporarily blocking recharge.

Operator, cost, duration, counterplay and exact effect are OPEN.

## Defense Turret

### LANDED

- DEFENSE slot;
- Gunner;
- shared CORE;
- one concrete incoming Missile target;
- timed operation;
- deterministic baseline `HIT` if target still exists at completion;
- player and enemy paths exist;
- encounter-local integrity exists.

Player target selection currently uses the Turret's inline Missile interaction.

### CONFIRMED TODO

- generic BROKEN gating + Engineer repair;
- preserve the inline interaction approach for concrete incoming-target choice unless playtest gives a better reason
  to move it elsewhere;
- enemy cooldown must follow the same after-attempt timing rule as player hardware.

Future Torpedo interaction remains idea-bank material until Torpedo is promoted.

## Shield Generator

### LANDED

Player Shield currently protects one target from the temporary vocabulary:

```text
HULL | DRIVE
```

- Engineer deploys it;
- deployment spends shared CORE;
- current cooldown starts at task start;
- matching incoming Beam consumes Shield;
- wrong-target Beam penetrates and leaves Shield alive;
- Evade miss leaves Shield alive;
- Shield expires naturally.

Enemy Shield currently uses a whole-ship shortcut rather than a semantic target.

### CONFIRMED TODO

Move player/enemy Shield behavior to the shared intended target vocabulary:

```text
HULL
BRIDGE
SLOT(slotId)
```

Also:

- start full generator cooldown after deployment/termination rather than during Engineer work;
- finish generic BROKEN gating + repair;
- remove the enemy whole-ship shortcut.

### IDEA BANK — multi-target generator upgrade

A future generator/upgrade may require the player to select several zones in one deployment action and place several
Shields together. The current thought is that the action would require selecting the full configured number rather
than allowing an arbitrary partial count.

This is not baseline Shield behavior and should be designed only when multiple simultaneous enemy direct-fire
weapons make it useful.

## Missile Launcher

### LANDED

- WEAPON slot;
- Gunner;
- finite persistent ammunition;
- officer targeting before launch;
- physical launch spends ammo;
- autonomous flight after launch;
- Hull impact;
- Defense Turret and Evade are current counters;
- full cooldown starts at physical launch;
- targeting cancellation/target loss before launch is free;
- encounter-local integrity exists.

### CONFIRMED TODO

Generic BROKEN gating + Engineer repair.

## Beam Cannon

### LANDED — player

Player Beam:

- WEAPON slot;
- Gunner;
- spends content-defined CORE when charging starts;
- full cooldown begins at fire/cancellation/interruption;
- current engine targets `HULL | BRIDGE | SLOT(slotId)`;
- dashboard selection currently exposes occupied enemy equipment slots.

Current consequences:

```text
HULL -> Hull damage
operational SLOT -> module damage, no Hull spill
already BROKEN SLOT -> hullDamage * 2
BRIDGE -> HIT, currently no additional consequence
```

### LANDED — enemy temporary path

Incoming enemy Beam still targets `HULL | DRIVE`, and current enemy cooldown starts too early at charging.

### CONFIRMED TODO

- migrate incoming Beam to `HULL | BRIDGE | SLOT(slotId)`;
- add deliberate player UI target surfaces for Hull/Bridge when that presentation slice is designed;
- give Bridge hits a meaningful explicit control consequence when `INTERRUPT`/`STUN` content is ready;
- make enemy cooldown timing match player Beam;
- finish generic BROKEN gating + repair.

## Sticky Mine Dispenser

### LANDED — single-shot contract

Sticky Mine Dispenser is finite-ammo Gunner equipment whose main pressure is enemy Engineer workload.

```text
MINE AIM / TARGETING
-> exactly one physical release / attachment attempt
-> Gunner free
-> dispenser cooldown and Mine fuse run independently
```

Rules:

- targeting duration belongs to the Gunner officer-task tuning;
- damage/fuse/ammo/cooldown belong to dispenser content;
- targeting uses crew-progress time; fuse/cooldown use world time;
- any player termination before release is pre-commit: no ammo and no cooldown;
- release spends one ammo and starts full cooldown even when target Evade causes a miss;
- each attached Mine is independent;
- Evade prevents new attachment, not an already-attached Mine;
- clearing is Engineer-only;
- there is no salvo size, launch interval, `DISPENSING` phase or autonomous later release.

Both current dispenser content ids use this same single-release lifecycle; differences are tuning only.

### CONFIRMED TODO

Generic BROKEN gating + Engineer repair.

### IDEA BANK — attached-object service equipment

Future Engineer cleanup of Mines, attached drones and similar hull problems may require a dedicated installed system
rather than being an unconditional Engineer capability. Exact equipment identity/slot/cost is not designed yet.

## SPAM Projector

### LANDED

SPAM is UTILITY equipment operated by Scientist.

- no baseline ammo economy;
- no baseline CORE cost;
- long Scientist commitment is the primary cost;
- target crew work is slowed while the effect exists;
- viewscreen garbage/ads presentation is implemented;
- player projection remains occupied through the original channel duration after enemy PURGE;
- encounter-local integrity exists.

Current enemy path is asymmetric: player PURGE ends enemy channel lifecycle and releases the enemy Scientist early.

### CONFIRMED TODO

- make enemy PURGE follow the same high-commitment rule as player projection;
- finish generic BROKEN gating + repair;
- make enemy cooldown begin after the original operation ends rather than at channel start.

## CONFIRMED NEED — starting offensive weapon

The starting loadout needs a simple baseline offensive weapon so the player is not forced to begin with only
specialized or expensive systems.

Nothing else about this weapon is confirmed yet. CORE usage, ammunition, self-wear, targeting model, damage profile
and endgame viability are all design/playtest questions.

The ideas below are candidates, not requirements.

# Weapon IDEA BANK

## Autocannon / Basic Gun

Status: **IDEA BANK**.

Candidate fantasy: mechanically simple old ballistic gun.

Possible identity pieces:

- Gunner-operated WEAPON;
- direct Hull pressure;
- no precision targeting;
- possibly no CORE cost;
- possibly ammunition or self-wear as its run cost;
- possibly viable when deliberately upgraded rather than automatically discarded.

None of those details are promoted yet.

## Scattergun

Status: **IDEA BANK**.

Candidate fantasy: scarce uncontrolled fragment cloud that creates random equipment damage/chaos rather than precise
Hull pressure.

Open questions include fragment count, hit chance, target pool, repeated hits, ammo economy, CORE cost and counters.

## Torpedo Launcher

Status: **IDEA BANK**.

Candidate fantasy: extremely slow, obvious physical projectile with catastrophic Hull damage if the target fails to
answer.

Likely design space includes scarce ammo and strong Turret/Evade counterplay, but no interaction is confirmed until
the family is actually built/tested.

## Plasma Cannon

Status: **IDEA BANK**.

Candidate fantasy: heavy energy Hull weapon with a large power commitment and readable charge window.

Possible contrast is physical Torpedo vs energy Plasma, but CORE cost, Shield interaction, damage and cooldown are
all OPEN.

## Design guardrail

A new equipment family is useful when it creates a different captain decision or enemy response through targeting,
officer contention, timing, resource economy or counterplay.

Do not add a weapon simply because the list looks short, and do not promote an idea-bank bullet into implementation
scope without a separate design decision.
