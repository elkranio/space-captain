# Space Captain — Intended Game Design

Canonical intended design for the parts of the game that have reached active design.

This document describes what the game **should** do. `GAMEPLAY_CONTRACTS.md` describes what the current runtime
**does**.
When they disagree, do not silently reinterpret one as the other: change implementation deliberately.

Exact durations, damage values, probabilities and resource costs are tuning unless this document explicitly treats the
number as a rule.

Systems that have not reached active design are intentionally omitted. Expand this file when those systems become real
work, not as speculative paper design.

## 1. Game / Elevator Pitch

Space Captain is a space roguelite in which the player is the captain of a service ship and commands a crew of misfit
officers.

The player controls the ship primarily through orders to the crew. Officers perform tasks in combat, research,
expeditions, anomaly work and service contracts.

A run consists of a sequence of mandatory contracts. Before each contract the player chooses one of several offers,
plans a route across a free-form space map, completes the objective and must report to any military outpost before the
allowed number of jumps expires.

After a fixed number of successful contracts, the player receives the final assignment.

The captain's narrative goal is to repair a damaged service record and earn a return to normal duty.

Run progression uses a familiar roguelite combination of randomness and player choice: weapons, equipment, ship
upgrades, officer improvements, shops and other opportunities gradually form the current build.

The central player fantasy is being the captain: choosing objectives, routes, priorities and orders rather than directly
operating every ship system.

`Roguelite` is a working genre label and may be refined later.

## 2. Captain, Crew & Command Model

### Captain

The player is the captain, not a fifth universal officer.

Captain actions are decisions rather than timed crew work: choose contracts and routes, answer dialogue, pay or refuse
demands, accept risk, choose priorities and issue orders.

Normal command flow:

```text
situation
-> captain chooses action
-> appropriate officer receives task
-> officer is busy
-> task completes / cancels / is interrupted
-> gameplay result
```

This command model should remain consistent across combat and non-combat content.

### Fixed crew roles

The player always has four required officer roles:

- Science
- Weapons
- Helm
- Engineer

An officer is tied to one role for the run. The player does not continue with a permanently missing role.

Officers may perform badly, be temporarily unavailable or become difficult to manage, but they do not permanently die,
run away or stop working for the rest of the run.

At appropriate stations the player may deliberately replace an officer with another candidate.

### Role scope

**Science** handles unknown/information work, anomaly research, scanning, tactical analysis, electronic warfare and
SPAM.
Basic UI readability is not gated by Science.

**Weapons** operates offensive weapons and the Defense Turret. In combat, offense competes with missile interception.

**Helm** handles navigation, movement, docking, Evade and Escape. Ship hardware defines capability; Helm performs the
action.

**Engineer** repairs broken systems, deploys Shield and handles physical ship problems such as attached sticky mines.

### Officer tasks

Most orders are duration tasks. While an officer is busy, incompatible actions for that role are unavailable.

The important crew resource is therefore **time and availability of specific people**.

Tasks may be cancellable or interruptible depending on the concrete action. Do not add a universal cancellation rule
that
ignores the real commitment point of the system involved.

### Officer individuality

Keep the crew model small enough to read:

- personal traits;
- experience/upgrades;
- one dynamic condition value, currently called **Morale**;
- pairwise relationships between officers.

Do not add separate fatigue, stress, loyalty and similar parallel meters unless playtesting proves they create distinct
decisions.

Morale represents tiredness, irritation, confidence and general working condition. Low Morale should first make an
officer slower, costlier or create extra downtime. Catastrophic task failures belong near extreme dysfunction, not
normal
routine RNG.

Relationships are pairwise rather than one global crew-morale value.

## 3. Run Structure

### Run loop

```text
MILITARY OUTPOST
-> choose one contract
-> plan route
-> reach target node
-> complete objective
-> reach ANY military outpost before deadline
-> choose next contract
-> ...
-> FINAL MISSION
```

The run fails if the ship is destroyed or the current contract deadline expires before reporting at an outpost.

### World map

The current intended map is spatial rather than a predefined edge graph.

- nodes have physical positions;
- the ship has a jump radius;
- any node inside that radius is reachable;
- every node-to-node jump costs exactly one contract jump regardless of distance inside the radius;
- increasing jump range is a meaningful macro upgrade.

If the spatial map fails in playtest, replacing it with a more conventional branching map is acceptable. Combat and
mission internals should not depend on the map model being sacred.

### Contract offers and deadline

At a military outpost the player chooses one active mandatory contract from several offers. Before acceptance the player
should understand at least the objective, reward, target location and allowed jump budget.

One common jump budget covers the entire contract:

```text
ACCEPT
-> objective
-> report to ANY military outpost
```

Finishing the objective early preserves remaining jumps for stores, repair, leisure, exploration or other detours.

The contract is complete only after reporting at an outpost. The deadline must be clearly visible so failure is never a
gotcha.

### Sectors, nodes and local exploration

The map can contain sectors with different content biases: combat, shops, leisure/crew recovery, anomalies and other
activity types. The player should know the statistical character of a sector without knowing every random local object.

Each global node is a local area. It may have a persistent known anchor such as a trade station, military outpost or
pirate
station. On arrival, additional local points can be revealed: ships, anomalies, wrecks, events and other objects.

Movement between points inside one global node does not spend contract jumps.

Local exploration should be risk/reward rather than free farming. Extra points can cost Hull, ammo, crew condition,
relationships or other resources while offering rewards.

### Leaving during local work

Local movement or departure should not require every officer to be idle merely as a generic rule.

If an officer is performing work tied to the current location, leaving can cancel that work and forfeit its result or
the
opportunity itself. Example: leaving while Science studies an anomaly may lose the unfinished research and possibly the
anomaly.

Prefer this natural consequence over an artificial global `all officers idle` travel gate.

### Objective scope and world refresh

Base contract objectives should usually resolve inside one target node, although that node may contain several local
steps or points of interest. Avoid mandatory multi-node fetch chains until the simpler structure proves insufficient.

Between contracts, significant in-world time may pass. Geography, sectors and major anchor objects persist; temporary
local contents may refresh.

### Run completion

After a fixed number of successful contracts, the player receives a final assignment. Completing that final encounter or
mission completes the run.

The exact final boss/twist is intentionally not fixed here.

## 4. Combat

### 4.1 Combat premise and flow

Combat is one player ship against one full enemy ship. Missiles, Beams, Mines and SPAM are threats/effects, not extra
command-capable enemies.

Combat evolves continuously in time. Officers perform timed work while weapons, projectiles, cooldowns and effects run
their own lifecycles.

```text
READ
-> DECIDE
-> ORDER
-> OFFICER WORKS
-> ACTION / THREAT RESOLVES
-> NEW STATE
```

The baseline direction is continuous real-time combat. Tactical pause remains an open playtest/UX decision; do not make
`no pause ever` a sacred rule.

Individual threats may have simple obvious counters. Depth should come mainly from several problems competing for
officer
time, CORE and ship systems rather than from mandatory multi-step identification chores.

The player may consciously accept damage instead of responding if another action matters more.

Keep these combat effects semantically distinct:

```text
Hull damage        = persistent run attrition
module damage      = tactical system pressure
interrupt          = current task stops; officer becomes free
stun               = current task stops; officer is unavailable for a duration
```

Control effects must not create easy permanent role lockouts.

#### Early-combat baseline

Opening combat should establish the loop without becoming a tax.

For a weak/basic player ship against a weak/basic enemy:

- reasonable play should win almost every time;
- the fight should be short;
- "easy but long" is a design failure;
- the player should not spend long stretches waiting to shave predictable Hull from an enemy that cannot realistically
  win.

Basic/unupgraded weapon families should not be trap choices in this phase. They do not need identical damage curves or
solo time-to-kill, but each must support a useful combat plan.

In particular, Beam precision/control must not make Beam strictly superior to Missile. Missile direct Hull pressure,
timing, ammunition and defense interactions should provide a competing reason to use it.

### 4.2 Ship state and damage

Central model:

> Hull is long-term run attrition. Module damage is a tactical problem of the current encounter.

#### Hull

Every ship has Hull. At zero Hull the ship is destroyed. Player destruction ends the run.

Hull damage persists between encounters and is repaired through external run opportunities such as stations.

#### Chassis, slots and loadout

A chassis defines the physical build shape of a ship. A loadout/preset fills that shape; the loadout does not invent
extra
mounting points.

Baseline slot categories:

```text
WEAPON
DEFENSE
EQUIPMENT
```

Different chassis may expose different counts and combinations of these slots. Do not make "four weapon slots" a
universal
ship rule merely because the current debug start has four weapon fields.

Each slot has stable identity on the ship so installed hardware, combat targeting and presentation can refer to the same
place without reconstructing it from array position.

Targetable slot integrity is encounter-local and binary in functionality:

```text
integrity > 0 -> OPERATIONAL
integrity = 0 -> BROKEN
```

A BROKEN targetable slot disables the hardware installed in it until repaired. The broken/operational fact must have one
authoritative domain owner; command availability, AI and physical runners should not maintain parallel booleans.

Hull is not a slot.

Power Core remains non-breakable and non-targetable even as ship loadout/build structure becomes more configurable.

For player Beam targeting, the intended semantic target is:

```text
HULL
or
SLOT(slotId)
```

Beam slot resolution is deliberately asymmetric across the first and repeated hit:

- hitting an OPERATIONAL slot deals module damage and no Hull damage;
- a hit that reduces the slot to BROKEN still does not spill damage into Hull;
- hitting an already BROKEN slot deals `hullDamage * 2`.

The exact slot durability, Beam damage and chassis layouts are tuning/content.

Do not generalize every currently scalar installed system into arbitrary arrays until a real chassis/loadout needs that
multiplicity. The slot model should remove fixed-layout assumptions without creating a generic equipment framework for
hypothetical content.

#### Modules

Functional modules have integrity but binary functionality:

```text
integrity > 0 -> OPERATIONAL
integrity = 0 -> BROKEN
```

Intermediate integrity does not reduce module performance.

Engineer repairs only BROKEN modules, and a completed repair restores the module to full integrity. Do not create
routine
mid-combat top-off housekeeping for still-operational modules.

At normal encounter end, surviving player modules return to full integrity automatically. This includes successful
Escape. The same principle applies to encounter-local ship state that could otherwise be restored by simply waiting.

Any module that can be broken through ordinary module damage may be a semantic weapon target. Add targetable modules
only
when they have real domain identity and consequences.

Power Core is intentionally non-breakable and non-targetable.

For Beam-style module attacks, use the chassis-slot rules above. A targetable installed module is disabled by its
authoritative slot becoming BROKEN; do not create a second module-broken truth beside the slot state.

### 4.3 Officer tasks in combat

One officer performs one active task at a time.

```text
FREE
-> ORDER
-> BUSY
-> TASK RESOLVES
-> FREE
```

A task ends when the officer has produced the result that requires that officer. Physical systems can continue
afterward.

Example:

```text
Weapons task: AIM -> LAUNCH -> done
Missile:      LAUNCHED -> FLIGHT -> HIT/MISS
Launcher:     COMMITTED -> COOLDOWN -> READY
```

Cancellation and resource refund depend on the concrete commitment point. Once a resource/cooldown is committed, later
cancellation or interruption does not refund it.

Ordinary damage does **not** randomly interrupt tasks. `INTERRUPT` is an explicit effect of specific weapons, traits or
other mechanics.

```text
BUSY -> INTERRUPT -> task lost -> officer immediately FREE
```

Stun both interrupts current work and keeps the officer unavailable:

```text
BUSY -> STUN -> task lost -> unavailable -> FREE
```

A successfully completed ordinary task guarantees its normal effect. Routine Morale does not add a hidden universal
failure roll. Negative traits and poor condition should primarily change duration, cost or recovery; catastrophic direct
failures belong to severe dysfunction.

### 4.4 Incoming threats

Basic threat identity and any obvious semantic target are free information. Science is not required to understand the
threat panel.

Each concrete Missile or attached Mine is a separate threat object.

#### Missile

Missile is delayed physical Hull damage.

```text
launch
-> autonomous flight
-> impact
-> Hull damage
```

Base counters:

```text
Weapons -> Defense Turret
Helm    -> Evade
```

Base Missiles always damage Hull. Advanced missiles may gain traits such as officer Stun chance, module damage or other
secondary effects.

#### Beam

Beam is a telegraphed semantic-target attack.

```text
target revealed
-> charge
-> fire
-> immediate resolution
```

Base counters:

```text
Engineer -> targeted Shield
Helm     -> Evade
```

Beam may target Hull or a breakable module. Its target is normal readable combat information, not Science-gated intel.

#### Sticky Mine

A Sticky Mine attaches to the ship and explodes after a fuse.

```text
attach
-> fuse
-> Engineer may CLEAR
-> explosion
-> Hull damage
```

New attachment can be avoided by Evade. Once attached, Evade no longer helps.

The Mine's main identity is Engineer workload pressure. Single-Mine and multi-Mine salvo dispensers remain a playtest
comparison; salvo is promising because several independent mines can force several sequential Engineer tasks.

#### SPAM

SPAM is a long-lived electronic/information effect rather than a projectile.

```text
SPAM applied
-> officer work slows
-> Science may PURGE
or
-> effect expires
```

While active, SPAM also obscures the external viewscreen with garbage/ads. It may annoy and reduce visual situational
awareness, but it must not hide the basic controls/state required to make mandatory combat decisions.

### 4.5 Player weapons / offensive actions

Different weapon families should create different decisions through officer time, resources, targeting and pressure, not
just different damage numbers.

#### Basic Gun

The player has a baseline weapon that costs neither ammo nor CORE and gives Weapons a permanent way to deal Hull damage.

Without upgrades it should become weak quickly enough that replacing it is attractive. With deliberate investment and
appropriate upgrades, a Basic Gun build should be able to remain viable through the full run.

#### Missile Launcher

Missiles use Weapons and finite ammunition. After launch the Missile flies independently. Base Missiles damage Hull;
variants may add traits and secondary effects.

#### Beam Cannon

Beam uses Weapons and spends Power Core. It can target Hull or breakable enemy modules.

This intentionally creates offense-vs-defense CORE contention: spending energy on Beam now leaves less reserve for
Turret, Shield or Evade.

#### Sticky Mine Dispenser

Mines use Weapons and finite ammunition. They primarily create enemy Engineer pressure. Single and salvo patterns remain
playtestable variants rather than a finalized universal dispenser shape.

#### SPAM Projector

SPAM is a Science offensive action. Its baseline cost is **long Science commitment and opportunity cost**, not ammo or
CORE.

While Science is busy projecting SPAM, Science cannot Purge, analyze or interfere in other ways.

If playtesting later shows Science time is not enough cost, a possible fallback is to reserve a Power Core cell for the
SPAM commitment so that the cell cannot recharge or be used elsewhere. This is not the base rule yet.

Weapon progression should preserve family identity while allowing useful traits/upgrades rather than becoming a
ladder of
purely larger numbers.

### 4.6 Defensive actions

#### Defense Turret

Defense Turret is a specialized anti-Missile action:

- Weapons operates it;
- it spends Power Core;
- it targets one incoming Missile;
- it takes officer time and then enters cooldown;
- if the player Weapons task completes while that Missile still exists, the baseline interception is guaranteed.

No extra hidden success roll is required for the BASIC player turret.

#### Targeted Shield

Engineer deploys one temporary Active Shield onto one selected player ship node. Deployment spends Power Core.

Only one Active Shield exists at a time in the baseline design.

A matching Beam hit is absorbed and consumes the Shield. A Beam aimed at another node penetrates and leaves the Shield
alive. A Beam that misses because of Evade also leaves the Shield alive.

The Shield expires naturally if no matching hit arrives. Exact lifetime is tuning.

Future upgrades may expand shield behavior, including possibly supporting more than one shield, but the base rule stays
simple until playtest proves the need.

#### Evade

Evade is a broad Helm defensive maneuver:

```text
READY
-> WARMUP
-> EVADING
-> end
-> COOLDOWN
```

Requirements and effects:

- Drive must be OPERATIONAL when Evade starts;
- Helm is occupied;
- Evade spends Power Core;
- while actively EVADING, any number of supported physical threats may miss;
- supported baseline threats are Missile hits, Beam hits and new Sticky Mine attachments;
- SPAM and already-attached Mines are not avoided.

Evade is intentionally broader than Turret or Shield and should be balanced through real costs rather than by making it
avoid only one threat.

**Drive wear:** once an Evade is committed, its eventual end always deals 1 point of Drive module damage. Apply that
damage
at the end of the maneuver, not at the start. This remains true whether Evade completes normally, is manually cancelled
or
is terminated because Helm is Stunned.

The delayed damage prevents Engineer from repairing the Drive while the same Evade window is still protecting the ship.
The Drive's final remaining integrity can therefore power one last Evade and become BROKEN when that maneuver ends.

Generic task `INTERRUPT` should not cancel an active Evade. Helm Stun may terminate it.

### 4.7 Power Core and combat resources

Keep the common combat economy small.

#### Power Core

Power Core is a shared renewable encounter resource. Current baseline capacity is four cells; exact capacity and costs
may
change through tuning/upgrades.

Intended consumers include:

```text
Beam Cannon
Defense Turret
Shield
Evade
```

Recharge is sequential:

```text
0 -> 1 -> 2 -> 3 -> 4
```

At normal encounter end, Power Core returns to full automatically. Do not create a post-combat waiting optimization.

Power Core is non-breakable and non-targetable.

#### Ammunition

Missiles and Mines use finite ammunition. Ammo persists between encounters and is a run resource that must be
replenished
through run economy/content rather than by waiting.

Basic Gun costs neither CORE nor ammo.

### 4.8 Science / combat information

Central rule:

> Basic truth is free. Science spends officer time to reveal deeper decision-changing information or to create tactical
> interference.

The player's basic enemy inspection should expose the enemy loadout, obvious modules/state and visible combat actions
without requiring Science.

Whether opening deep inspection pauses simulation is a UX/playtest choice; the important principle is that the player
can
plan against a known enemy and understand why a loss happened.

Science currently has clear contention around SPAM:

```text
PURGE enemy SPAM
vs
project SPAM
vs
analyze enemy
vs
interfere with enemy systems
```

Exact Analysis design is intentionally deferred until implementation. Useful future results may reveal weapon traits,
properties, vulnerabilities or other information that changes a real decision. Analysis information normally remains for
the encounter, although a future discovered vulnerability may itself be a one-use opportunity.

Science interference may later alter enemy timing/effectiveness, for example slowing a Missile, increasing Beam charge
or
weakening a Shield. Do not canonize a menu of such actions before playtesting them.

Do not recreate mandatory `TRACK -> identify basic threat -> counter` chores under another name.

### 4.9 Enemy combat model

Enemy ships obey the same physical world rules: Hull, breakable modules, CORE, weapon lifecycles, officer tasks, repair,
Shield, Turret, SPAM and disruption must be real state rather than decorative AI modifiers.

The baseline enemy crew uses the same four roles:

```text
Science / Weapons / Helm / Engineer
```

Weak or special enemies may effectively lack one or more roles. Implementation may model that as absent roles or roles
that are permanently unavailable; no separate AI architecture is required merely for a weak ship.

Enemy AI is not omniscient. The captain/policy acts on perceived/known information with reaction delay and crew
constraints, not unrestricted mutable engine truth.

Enemy difficulty/personality should come from equipment, crew quality, information, traits and decision style rather
than
zero-millisecond perfect reactions.

Enemy traits/personality are part of generated enemy identity and should be visible in inspection when they materially
explain behavior. The player should not have to guess why two otherwise similar ships fight differently.

Physical symmetry does not require identical UI/AI mechanics. For example, the BASIC player Turret may be deterministic
while enemy interception can use its own observation/probability model. But hard world constraints remain real: no CORE
means no CORE-funded action; a busy role cannot perform another task; a BROKEN module loses its functionality.

### 4.10 Escape and encounter end

#### Escape

Escape is a timed Helm action, not an instant normal jump.

Requirements:

- Drive must be OPERATIONAL;
- Helm must be able to work;
- other officers do **not** need to be idle.

Other roles may keep fighting, repairing or performing Science work while Helm prepares Escape.

If Helm is interrupted or Stunned during Escape, the Escape task is lost. A later attempt starts from zero.

Successful Escape ends the current encounter and the run continues. All remaining incoming/outgoing combat threats and
effects are cleared as part of leaving the engagement. The escaped encounter is not suspended for later resumption.
Returning to the same location normally creates new content/state rather than restoring the old fight.

After Escape, normal post-encounter reset applies; Hull damage and spent ammo remain persistent run costs.

#### Enemy destroyed

Base victory is enemy Hull reaching zero.

After enemy destruction:

- the destroyed enemy cannot start new actions;
- enemy Beam charge and SPAM cease;
- already-launched enemy Missiles continue flying toward the player;
- enemy Sticky Mines already attached to the player continue their fuse/explosion lifecycle;
- player outgoing threats against the destroyed ship are removed: player Missiles self-destruct, player Mines disappear,
  and player Beam/SPAM stop;
- the encounter closes after surviving incoming enemy threats that are still physically relevant have resolved.

This keeps danger already committed against the player real without allowing pointless attacks against a ship that no
longer exists.

#### Negotiated / peaceful combat end

Combat may later end through captain-level outcomes such as payment, surrender or an agreement to disengage.

When both sides agree to end combat, **all incoming and outgoing threats/effects are cleared immediately on both
sides**.
Do not allow timing exploits where the player accepts payment and then kills the released enemy with a Missile already
in
flight, or where an agreed disengagement is followed by an old incoming hit.

Negotiated combat end is a clean state transition, not a delayed physical aftermath.
