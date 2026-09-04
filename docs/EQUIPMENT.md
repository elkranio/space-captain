# Space Captain — Equipment Mechanics & Idea Bank

This file is the equipment-focused working reference for combat mechanics.

It intentionally mixes current runtime truth, confirmed implementation work and non-committed brainstorming, so every
entry must carry a status.

## Status labels

- **LANDED** — current runtime behavior. If this file conflicts with code or `GAMEPLAY_CONTRACTS.md`, inspect code
  first.
- **CONFIRMED TODO** — intended rule we have committed to, but runtime is missing it or only partially implements it.
- **IDEA BANK** — promising brainstorm only. Do not implement it merely because it is written here.
- **OPEN** — a detail is deliberately unresolved and must be decided by design/playtest before implementation.

Document boundaries:

- `GAMEPLAY_CONTRACTS.md` = current implemented runtime truth;
- `GAME_DESIGN.md` = canonical intended game design once a mechanic has graduated from brainstorming;
- this file = equipment status board + equipment idea bank.

When an IDEA becomes real intended design, promote it deliberately and update the canonical design/runtime docs as
appropriate.

## Shared equipment model

### LANDED

Current physical ship layout uses these slot kinds:

```text
DRIVE
WEAPON
DEFENSE
UTILITY
```

Hull is not equipment and is not a slot.

Power Core is separate from the spatial slot grid. It is non-breakable and non-targetable.

Current breakable equipment families have content-owned `maxIntegrity` and encounter-local `integrity`:

- Drive;
- Defense Turret;
- Shield Generator;
- Missile Launcher;
- Beam Cannon;
- Sticky Mine Dispenser;
- SPAM Projector.

Shared encounter helpers already define:

```text
integrity > 0 -> operational
integrity = 0 -> broken
```

and clamped integrity damage.

Encounter-only equipment integrity is not written back into persistent run state.
Installed equipment owns integrity/BROKEN; slots only provide spatial identity and resolve the equipment through mounts.

### CONFIRMED TODO

The generalized integrity field is ahead of some gameplay behavior. Finish one authoritative BROKEN rule for every
breakable family:

- BROKEN equipment cannot perform its function;
- command availability and physical execution must consult the same operational truth;
- Engineer repairs only BROKEN equipment;
- a completed repair restores that equipment to full integrity;
- still-operational damaged equipment cannot be routinely topped off in combat;
- surviving encounter-local equipment returns to full integrity at encounter end, including successful Escape.

Player precision Beam must eventually target:

```text
HULL
or
SLOT(slotId)
```

Confirmed Beam slot consequence:

```text
operational equipment in targeted slot
    -> module damage
    -> no Hull damage

hit that breaks that equipment
    -> still no Hull spill

already BROKEN equipment in targeted slot
    -> hullDamage * 2
```

The dual dashboards now provide the target surfaces. Player Beam target-selection UI is landed as a preview;
see `CURRENT_HANDOFF.md` at the repository root for the current continuation.

## Current equipment overview

| Category | Equipment | Slot | Operator | Status |
| --- | --- | --- | --- | --- |
| Movement | Drive | DRIVE | Pilot | LANDED / Evade wear and cooldown correction pending |
| Defense | Defense Turret | DEFENSE | Gunner | LANDED / generic BROKEN work pending |
| Defense | Shield Generator | DEFENSE | Engineer | LANDED / shared slot-target migration pending |
| Weapon | Missile Launcher | WEAPON | Gunner | LANDED |
| Weapon | Beam Cannon | WEAPON | Gunner | LANDED / precision target pending |
| Weapon | Sticky Mine Dispenser | WEAPON | Gunner | LANDED |
| Utility | SPAM Projector | UTILITY | Scientist | LANDED |
| Power | Power Core | separate | shared resource | LANDED |

SPAM currently shares some weapon-state/catalog machinery in the implementation, but its physical/gameplay category is
UTILITY. Do not infer its gameplay category from that implementation reuse.

### LANDED — Player dashboard presentation

All seven current standard equipment families have concrete MY SHIP dashboard tiles:

- Drive;
- Defense Turret;
- Shield Generator;
- Missile Launcher;
- Beam Cannon;
- Sticky Mine Dispenser;
- SPAM Projector.

Tile titles come from catalog `shortName`. Standard equipment placement comes from authoritative chassis slots and
persistent mounts, not weapon-array order or equipment-family order.

# Drive

## LANDED — Basic Drive

Current content has one `BASIC DRIVE`.

It owns:

- encounter-local integrity;
- Evade warmup/duration/cooldown tuning;
- Evade Power Core cost.

Current Evade phase flow (the independent cooldown clock may already have expired):

```text
READY
-> WARMUP
-> EVADING
-> COOLDOWN (if recovery remains)
-> READY
```

Current rules:

- Pilot performs Evade and is occupied by it;
- Evade commits Power Core and cooldown;
- the Drive must be operational;
- during `EVADING`, current Missile hits, incoming Beam hits and new Sticky Mine attachments are avoided
  deterministically;
- Evade does not remove a Mine that is already attached;
- Evade does not purge SPAM;
- Escape availability derives from authoritative Drive operational state;
- the current incoming Beam can damage Drive integrity;
- Drive at zero integrity is BROKEN;
- the existing Drive repair path restores it to full integrity.

Current basic content tuning is `maxIntegrity = 2`. Exact timings/costs remain tuning, not sacred design.
Current cooldown starts at commitment and overlaps the maneuver. The confirmed after-action rule is not implemented;
see the timing table in `GAMEPLAY_CONTRACTS.md` and the correction in `BACKLOG.md`.

## CONFIRMED TODO — Evade damages the Drive

Every committed Evade should also cost **1 Drive integrity**.

This cost is in addition to the existing opportunity/cooldown/resource costs unless later playtest deliberately changes
that economy.

With the current 2-integrity baseline this creates the intended pressure:

```text
Drive 2/2
-> Evade
-> Drive 1/2

Evade again
-> Drive 0/2
-> BROKEN
```

Because normal Engineer repair is BROKEN-only, `1/2` is not routine top-off territory. A second Evade can therefore be a
deliberate decision to save the ship now and accept a broken Drive afterward.

Apply the 1-integrity cost at the end of each committed Evade, including normal completion, manual cancellation and Pilot
Stun. Generic task `INTERRUPT` should not cancel active Evade. This is confirmed TODO, not an open timing decision;
see `GAME_DESIGN.md` for the intended contract.

## CONFIRMED DIRECTION — Evade is the expensive universal emergency answer

Do not be afraid to let Evade counter most direct incoming weapon attacks.

The intended balance lever is that Evade is expensive:

- Drive integrity cost;
- substantial cooldown;
- Pilot occupation;
- existing CORE cost.

Specialized counters should usually be preferable, but Evade is the fallback when the captain absolutely needs to avoid
the hit.

Do not invent arbitrary `cannot evade` weapon tags merely to make weapon families different. Natural exceptions are
effects that are already attached/applied, such as an attached Mine or active SPAM.

If the current IDEA BANK weapons graduate, the present direction is that Autocannon, Scattergun, Torpedo and Plasma are
all evadable.

# Power Core

## LANDED — MK.I Power Core

Power Core is a shared ship resource, not a spatial damage target.

Current basic content:

```text
capacity = 4 charges
recharge = sequential
```

Current basic recharge tuning is 24 seconds per charge.

Current player consumers include:

- Evade;
- Defense Turret;
- Shield Generator;
- Beam Cannon.

Committed energy is not refunded merely because later work is cancelled/interrupted after commitment.

Player Beam spends the content-defined Beam Cannon `powerCost` when charging begins. Command availability requires enough
current charge. Once charging starts, the cost is committed and is not refunded by later cancellation/interruption.

Power Core is intentionally:

- non-breakable;
- non-targetable;
- displayed separately from the 4x3 equipment slot grid.

## IDEA BANK — attack enemy CORE charges through Utility

A future Utility module may attack the enemy's **current CORE resource** without making the physical Power Core a
breakable/targetable slot.

Working fantasy: Power Disruptor / energy warfare device.

Possible effects:

- burn one current enemy charge;
- burn several charges;
- temporarily stop recharge;
- delay the next recharge.

These are alternatives, not a combined confirmed mechanic.

OPEN:

- exact effect;
- operator role;
- task duration;
- own resource cost;
- cooldown;
- whether the enemy can actively counter it.

The important design distinction is already useful:

```text
Power Core hardware
    -> still non-breakable / non-targetable

Utility action
    -> may manipulate current CORE charges
```

# Defense

## Defense Turret

### LANDED

Defense Turret is the specialized anti-Missile system.

Current contract:

- mounted in DEFENSE;
- Gunner operates it;
- spends shared Power Core;
- targets one concrete live Missile;
- Gunner work/loading takes time;
- if work completes while the target Missile still exists, the current shot resolves as a deterministic HIT;
- it has its own cooldown;
- both player and enemy Turret paths exist;
- current Turret state now carries encounter-local integrity.

The current system deliberately does not require Scientist tracking, a hidden accuracy tier or a random interception roll.

### CONFIRMED TODO

- apply generic BROKEN operational gating;
- add the generic Engineer BROKEN-only repair behavior;
- move player target selection to concrete Missile cells in the compact threat monitor.

Future Torpedo interaction belongs to the Torpedo IDEA until that family is promoted.

## Shield Generator

### LANDED

Shield Generator is mounted in DEFENSE and operated by Engineer.

The installed generator creates a temporary Active Shield.

Current player target vocabulary is still:

```text
HULL
or
DRIVE
```

Current behavior:

- deployment spends shared Power Core;
- Engineer is occupied during deployment work;
- generator cooldown commits with the action;
- Active Shield absorbs one matching incoming Beam hit;
- a Beam aimed at a different node penetrates and leaves the Shield alive;
- an Evade miss leaves the Shield alive;
- Active Shield expires naturally;
- Shield Generator state now carries encounter-local integrity.

### CONFIRMED TODO

Migrate Shield targeting from temporary `HULL | DRIVE` to the shared ship target vocabulary after real slot targets
exist:

```text
HULL
or
SLOT(slotId)
```

Also finish generic BROKEN gating/repair.

Whether Shield counters a future Plasma weapon is currently part of the Plasma IDEA, not landed Shield behavior.

# Weapons — landed families

## Missile Launcher

### LANDED

Missile Launcher is the basic delayed physical Hull-pressure weapon.

Current contract:

- mounted in WEAPON;
- Gunner operates it;
- finite ammunition;
- targeting work before launch;
- after launch, the Missile becomes an autonomous concrete projectile;
- Missile has its own flight duration;
- impact deals Hull damage;
- incoming Missile can be intercepted by Defense Turret;
- incoming Missile can be avoided by Evade;
- launcher has its own cooldown;
- launcher state carries encounter-local integrity.

Current content contains a normal launcher and a deliberately extreme `ml_full_auto` debug/test variant.

### CONFIRMED TODO

- generic BROKEN operational gating + repair;
- use the visible enemy Hull surface for direct offensive targeting where appropriate.

Exact balance against Beam must come from the first weak-fight playtest, not paper DPS alone.

## Beam Cannon

### LANDED

Beam Cannon is a telegraphed energy weapon with separate Hull and module-damage content values.

Current enemy Beam:

- chooses `HULL | DRIVE`;
- reveals that target as normal combat information;
- charges;
- fires;
- can be countered by matching targeted Shield or Evade;
- damages Hull when aimed at Hull;
- damages current encounter Drive integrity when aimed at operational Drive;
- does not spill module overkill into Hull;
- hitting already-BROKEN Drive deals the special repeated-hit Hull consequence.

Current player Beam:

- uses Gunner;
- charges/fires/cools down;
- spends its content-defined Power Core cost when charging begins;
- currently targets the enemy actor as a whole.

The dashboard's ready-Beam click now opens a target-selection preview without starting charging. Accepting an enemy
equipment tile and carrying its semantic target into this runtime path remain the next atom.

Beam Cannon state now carries encounter-local integrity.

Current content contains the normal Beam Cannon and a fast debug/test variant.

### CONFIRMED TODO

Player Beam is the main precision-weapon slice after the combat board exists:

```text
select Beam
-> highlight enemy HULL + valid installed slots
-> select one target
-> carry semantic target through command/task/runner
```

Also:

- implement the full generic slot-damage consequence;
- migrate incoming Beam and targeted Shield onto the shared target model afterward;
- generic BROKEN gating + repair.

## Sticky Mine Dispenser

### LANDED

Sticky Mine Dispenser is a finite-ammo weapon that primarily creates Engineer workload.

Current behavior:

```text
dispense
-> one or more independent Mines launch/attach
-> each Mine gets its own fuse
-> Engineer may CLEAR each attached Mine
-> uncleared Mine explodes for Hull damage
```

Important current rules:

- each Mine is a separate runtime threat;
- Evade can prevent a new attachment;
- once attached, Evade no longer helps;
- clearing is Engineer-only;
- no fallback role clears a Mine when Engineer is busy/unavailable;
- dispenser has ammo and cooldown;
- dispenser state carries encounter-local integrity.

Current content supports both a salvo configuration and a single-Mine configuration.

### CONFIRMED TODO

- generic BROKEN operational gating + repair;
- preserve separate Mine identity in the compact threat monitor.

# Utility — landed family

## SPAM Projector

### LANDED

SPAM is mounted in UTILITY and is operated by Scientist.

It is an electronic/information attack rather than a projectile.

Current behavior:

```text
Scientist channels SPAM
-> target receives a long-lived SPAM effect
-> affected officer work is slowed
-> Scientist may PURGE
or
-> SPAM expires
```

Current baseline:

- no ammo economy;
- no Power Core cost;
- long Scientist opportunity cost;
- cooldown after use;
- effect progress is duration progress, not an incoming-hit countdown;
- SPAM Projector state carries encounter-local integrity.

### LANDED — Presentation

SPAM presentation contaminates the external viewscreen with garbage/ads. `BridgeSpamView` renders on the projection layer,
above space/combat effects and below bridge interior and UI.

It may reduce visual situational awareness and be deliberately annoying, but it must never hide the minimum
controls/state required for mandatory combat decisions.

### CONFIRMED TODO

Finish generic BROKEN gating/repair.

# Weapons — IDEA BANK

These are unimplemented concepts. Basic Gun / Autocannon is a confirmed direction with unresolved mechanics;
the other families remain ideas requiring explicit promotion.

## Autocannon — candidate starting weapon

Status: **CONFIRMED DIRECTION / DETAILS DEFERRED**. Autocannon and Basic Gun refer to the same unimplemented baseline-gun
concept. The details below are ideas, not a finished implementation contract. Decide ammunition rules when work starts.

Fantasy: old military ballistic gun that is mechanically simple, cheap in ship energy and increasingly awkward to keep
alive over a run.

Working identity:

- mounted in WEAPON;
- Gunner operates it;
- Hull damage only;
- no precision/module targeting;
- no Power Core cost;
- Shield does not counter it;
- Defense Turret does not counter it;
- Evade avoids it;
- every shot may have a chance to deal **1 integrity damage to the Autocannon itself**.

Run-level intention:

- wear may create pressure to replace or invest in the gun;
- with upgrades and favorable run opportunities, an Autocannon build may remain viable to the end;
- it should not be a disposable tutorial gun that is mathematically invalid after the opening.

OPEN:

- self-damage probability;
- shot cadence and damage;
- upgrade paths;
- whether self-damage is rolled per trigger pull, burst or another firing unit.

Keep this as one concept in `GAME_DESIGN.md`, `BACKLOG.md` and the roadmap; do not schedule Basic Gun and Autocannon as
separate weapons.

## Scattergun

Status: **IDEA BANK**.

Fantasy: very limited-ammo uncontrolled cloud of damaging fragments that wrecks random equipment rather than Hull.

Working identity:

```text
fire one salvo
-> emit roughly 2-5 fragments
-> each fragment independently:
       MISS
       or
       hit equipment in a random occupied breakable slot for 1 integrity damage
```

Rules under consideration:

- cannot damage Hull at all;
- cannot select a specific slot;
- no Power Core cost;
- finite and **very limited** ammunition;
- Shield does not counter it;
- Defense Turret does not counter it;
- Evade avoids the whole salvo with deterministic protection.

Its value is subsystem chaos/control. It cannot finish a fight by itself because Hull remains untouched.

OPEN:

- exact fragment count and whether it is item-defined, upgrade-defined or otherwise selected;
- fragment hit chance;
- whether several fragments may hit the same slot;
- whether already-BROKEN equipment remains in the random hit pool;
- interaction with empty physical slots.

## Torpedo Launcher

Status: **IDEA BANK**.

Fantasy: extremely slow, obvious physical projectile that is easy to answer but catastrophic if the answer fails.

Working identity:

- finite/scarce ammunition;
- very slow flight;
- very large Hull damage;
- Defense Turret is a strong intended counter;
- Evade is a strong intended counter;
- if it reaches the ship, the result should feel severe enough to justify the long warning window.

The current brainstorm assumes Shield is not the normal Torpedo answer.

OPEN:

- exact damage;
- ammo capacity/rarity;
- targeting duration;
- flight duration;
- whether it costs CORE;
- whether advanced Torpedoes gain secondary effects.

Do not dilute the base version with subsystem splash unless playtest gives a reason. Its clean identity is
`slow + easy to counter + devastating Hull hit`.

## Plasma Cannon

Status: **IDEA BANK**.

Fantasy: heavy energy Hull weapon — expensive in ship power, simple in target, brutal when not answered.

Working identity:

- Hull-only;
- high Hull damage;
- no ammunition;
- high Power Core cost;
- no precision/module targeting;
- Shield counters it;
- Evade counters it;
- Defense Turret does not counter it;
- charge/cooldown should make the attack readable and expensive rather than spammy.

This creates a useful contrast with Torpedo:

```text
Torpedo
    huge physical Hull hit
    -> Turret / Evade

Plasma
    huge energy Hull hit
    -> Shield / Evade
```

OPEN:

- damage;
- CORE cost;
- charge duration;
- cooldown;
- whether Shield is consumed exactly like a Beam shield interaction or needs a distinct energy-hit rule.

# Design guardrails

Equipment families should differ by decisions, costs and counters rather than by color + damage number.

Useful axes include:

- Hull pressure vs module pressure;
- precise vs uncontrolled targeting;
- ammo vs CORE vs self-wear;
- officer-time pressure;
- projectile travel vs immediate resolution;
- specialized counter vs expensive universal Evade fallback.

Avoid adding a weapon purely because the weapon list looks short.

A new family is valuable when it creates a different captain decision or a different enemy response.
