# Space Captain — Intended Game Design

This file owns **confirmed intended design**. It describes how the game should behave when a mechanic has reached an
actual design decision.

`GAMEPLAY_CONTRACTS.md` describes what the current runtime does. `EQUIPMENT.md` owns equipment-specific status and
idea bank material. `BACKLOG.md` owns concrete implementation debt.

Do not turn a brainstorm into a requirement merely because it was written down. Sections explicitly marked **WORKING
THEORY** are current directions worth preserving, but they are not implementation contracts yet.

Exact durations, damage values, probabilities and resource costs are tuning unless this document explicitly treats a
number as a rule.

## 1. Player fantasy and command model

Space Captain is a space roguelite built around the fantasy of being the captain rather than directly operating
every ship system.

The captain chooses priorities, routes, targets, risks and orders. The captain is **not** a fifth universal officer.

The four crew roles are:

- Scientist;
- Pilot;
- Gunner;
- Engineer.

Normal command flow is:

```text
situation
-> captain chooses action
-> appropriate officer receives a task
-> officer is busy
-> task completes / cancels / is interrupted
-> gameplay result
```

One officer performs one active task at a time. The main crew resource is therefore the time and availability of the
specific role that can solve the current problem.

Role identity:

- **Scientist** handles information work, electronic warfare and SPAM. Basic interface readability is not
  Scientist-gated.
- **Pilot** handles movement, docking, Evade and future Escape.
- **Gunner** operates offensive weapons and the Defense Turret, so offense competes with missile defense.
- **Engineer** handles Shield, broken equipment and physical problems attached to the ship such as Sticky Mines.

## 2. Combat foundations

### 2.1 One ship against one ship

Combat is always one player ship against one full enemy ship. Missiles, Beam attacks, Mines, SPAM and future drones
or similar objects are threats/effects produced by those ships, not additional command-capable enemies.

Combat is continuous real time by default. Tactical pause remains an open UX/playtest question rather than a sacred
rule.

Depth should come mainly from several problems competing for officer time, CORE and equipment, not from mandatory
multi-step chores just to understand what is happening.

### 2.2 Basic information is free

The player should understand basic combat truth without assigning Scientist merely to make the UI legible.

Free information includes at least:

- threat family;
- obvious semantic target of a telegraphed attack;
- basic enemy Hull and installed equipment state that the combat board deliberately exposes;
- whether the player's own equipment is ready, busy, cooling down or BROKEN.

Scientist content should add decision-changing information or interference, not permission to understand the screen.

### 2.3 Pacing

A weak/basic player ship against a weak/basic enemy should be strongly player-favored under reasonable play and
should not become a long predictable attrition tax.

The important failure condition is **long and boring**, not simply **long**.

A longer fight is valid when it remains tense and produces meaningful decisions. Very weak generated enemies may die
in only a few attacks. Do not stretch an already-decided fight merely to satisfy a target duration.

Basic weapon families should support useful combat plans rather than becoming obvious trap choices.

## 3. Ship state, Hull and equipment

Central rule:

> Hull is long-term run attrition. Module damage is tactical pressure inside the current encounter.

### 3.1 Hull

Every ship has Hull. Zero Hull destroys the ship. Player Hull damage persists between encounters.

### 3.2 Chassis, slots and mounts

A chassis owns the physical build shape. Current slot kinds are:

```text
DRIVE
WEAPON
DEFENSE
UTILITY
```

Slots own stable spatial identity. Installed equipment owns functionality and integrity. A mount connects a stable
slot to a concrete installed equipment instance.

Hull is not a slot. Power Core is separate, non-spatial, non-breakable and non-targetable.

### 3.3 Integrity and BROKEN

Breakable equipment uses encounter-local integrity with binary functionality:

```text
integrity > 0 -> OPERATIONAL
integrity = 0 -> BROKEN
```

Intermediate damage does not weaken the equipment's function.

Engineer repairs only BROKEN equipment. A completed repair restores that equipment to full integrity. Do not create
routine mid-combat top-off work for equipment that is damaged but still operational.

At normal encounter end, encounter-local module integrity returns to full. Hull and spent ammunition remain
persistent run costs.

## 4. Semantic ship targets

The intended Beam/targeted-Shield vocabulary for both ships is:

```text
HULL
BRIDGE
SLOT(slotId)
```

`BRIDGE` is a real semantic target even though it is not an equipment slot. Its final combat consequence is not
fixed yet; the expected design space is officer control such as explicit `INTERRUPT` or `STUN`. Do not remove the
target merely because the current consequence is unfinished.

For a `SLOT(slotId)` Beam hit:

```text
operational equipment
    -> module damage
    -> no Hull damage

hit that breaks the equipment
    -> still no Hull spill

already BROKEN equipment
    -> hullDamage * 2
```

A targeted Shield protects one semantic target using the same vocabulary. A Beam aimed elsewhere penetrates and
leaves the Shield alive. A Beam that misses because of Evade also leaves the Shield alive.

The baseline currently assumes one Active Shield per deployment. A future generator that requires selecting several
zones for one multi-Shield deployment is an upgrade/design idea, not a base rule.

## 5. Combat effects and control

Keep these effects distinct:

```text
Hull damage        = persistent run attrition
module damage      = tactical equipment pressure
INTERRUPT          = current task stops; officer becomes immediately free
STUN               = current task stops; officer remains unavailable for a duration
```

Ordinary damage does **not** randomly interrupt officer work.

`INTERRUPT` and `STUN` must come from an explicit weapon effect, trait or other mechanic. At the current design
level there are no officer tasks with universal immunity to these explicit control effects. Add an exception only
when a concrete mechanic needs it.

## 6. Shared equipment lifecycle rules

Player and enemy versions of the same equipment follow the same physical rules.

A full cooldown starts **after active work ends**. Cooldown does not tick in parallel with preparation or operation
unless a future equipment family deliberately defines a different rule.

Committed resources are not refunded after commitment.

### 6.1 Commitment and cancellation table

| System | Commitment / cooldown rule |
| --- | --- |
| Missile Launcher | Targeting before physical launch is free to cancel. Launch spends ammo and starts full cooldown. |
| Sticky Mine Dispenser | Pre-release targeting is free; release spends one ammo and starts full cooldown. |
| Beam Cannon | CORE commits when charging starts. Fire or any later termination starts full cooldown. |
| Defense Turret | CORE commits when the attempt starts. Attempt completion or later termination starts full cooldown. |
| Shield Generator | CORE commits at deployment start; termination starts full cooldown. |
| Drive / Evade | CORE commits at WARMUP; termination applies Drive wear and starts full cooldown. |
| SPAM Projector | Scientist commits to the operation; termination starts full cooldown. |

Missile and Mine targeting are explicit pre-commit exceptions: if targeting ends before physical release, no
ammunition is spent and no cooldown starts.

Target loss follows the same commitment boundary. Losing a Missile/Mine target before release is free. Losing a Beam
or Turret target after active work has begun terminates the attempt with full cooldown.

## 7. Current combat families

### 7.1 Missile

Missile is delayed physical Hull pressure:

```text
Gunner targets
-> Missile launches
-> Gunner is free
-> Missile flies autonomously
-> impact -> Hull damage
```

Finite ammunition persists between encounters.

Base counters:

```text
Gunner -> Defense Turret
Pilot  -> Evade
```

### 7.2 Defense Turret

Defense Turret is a specialized deterministic anti-Missile system:

- Gunner operates it;
- it spends shared Power Core;
- it targets one concrete incoming Missile;
- work takes time;
- if the target still exists when the attempt completes, the baseline intercept succeeds.

Future accuracy/traits may add variation, but the baseline does not need a hidden success roll.

### 7.3 Beam Cannon

Beam is telegraphed precision pressure:

```text
target revealed
-> charge
-> fire
-> immediate semantic-target resolution
```

Gunner operates it and it spends shared Power Core.

Base counters:

```text
Engineer -> targeted Shield
Pilot    -> Evade
```

### 7.4 Sticky Mine Dispenser

Sticky Mine Dispenser is a finite-ammo weapon whose main identity is Engineer workload pressure.

One completed targeting operation releases **exactly one Mine**:

```text
Gunner targets
-> one Mine releases / attempts attachment
-> Gunner is free
-> dispenser cooldown and Mine fuse run independently
```

Evade can prevent a new attachment. Once attached, Evade no longer helps.

Each attached Mine is independent and must be cleared independently. Clearing is Engineer-only in the current
design. Automatic salvos are not part of the dispenser contract.

A future requirement that Engineer needs specific hardware to remove Mines, drones or other attached objects is a
working equipment idea, not a current combat rule.

### 7.5 SPAM Projector

SPAM is Scientist's current offensive/electronic-warfare action rather than a projectile.

Its identity is **high commitment / high disruption**:

```text
Scientist starts projection
-> target crew work is slowed
-> target Scientist may PURGE the effect
-> projecting Scientist remains committed until the original operation ends
```

Purging removes the harmful effect; it does not retroactively free the projecting Scientist. This rule is intended
to be symmetric for player and enemy.

The operation is deliberately not a reactive damage weapon. Scientist gives up access to Purge and other future
Science work while committed.

SPAM may contaminate the external viewscreen with garbage/ads, but it must not hide the minimum controls needed to
make mandatory combat decisions.

### 7.6 Evade

Evade is the expensive universal emergency response.

```text
READY
-> WARMUP
-> EVADING
-> end
-> full COOLDOWN
```

There is no third free preparation phase. Starting WARMUP is the commitment edge.

Requirements/costs:

- Drive is OPERATIONAL when the maneuver starts;
- Pilot is occupied;
- shared Power Core is spent at start;
- once committed, the eventual end deals 1 Drive integrity damage;
- full cooldown begins only after the maneuver completes or is terminated.

Explicit `INTERRUPT` or `STUN` may terminate Evade. Manual cancellation after WARMUP begins does the same. In all of
those cases the committed CORE remains spent, Drive wear is applied and full cooldown starts after termination.

While actually `EVADING`, current baseline Missiles, Beam hits and new Sticky Mine attachments miss. SPAM and
already attached Mines are unaffected.

The Drive's final integrity point may power one last Evade and become BROKEN when that maneuver ends.

## 8. Enemy combat model

Enemy ships obey the same physical constraints as the player: Hull, equipment integrity, CORE, ammo, weapon
lifecycles, officer/crew contention and defensive systems are real state rather than decorative AI modifiers.

Enemy decision-making is not omniscient. Policy acts on perceived/known information with reaction delay and crew
constraints.

The enemy should not blindly maximize DPS through meaningful known threats. Defensive work must compete with offense
when there is a real reason to defend. Exact defense priority, aggression formulas and personality tuning are not
sacred design rules; they are balance/AI work.

Same equipment means same lifecycle rules. Player/enemy asymmetry may exist in presentation or decision policy, not
in the physical cooldown/resource contract of nominally identical hardware.

## 9. Encounter end

### 9.1 Normal destruction

When enemy Hull reaches zero:

- the destroyed enemy starts no new actions;
- active enemy Beam charge / SPAM operation stops;
- already committed autonomous incoming physical threats remain real where their lifecycle allows it;
- player threats aimed at the destroyed ship are removed;
- the encounter closes after still-relevant committed incoming danger resolves.

The point is to preserve already-launched danger without allowing pointless attacks against a ship that no longer
exists.

### 9.2 Negotiated / peaceful end

A future captain-level outcome may end combat through payment, surrender or agreement to disengage.

When both sides agree to stop fighting, **all incoming and outgoing combat threats/effects are removed immediately
on both sides**.

A negotiated end is a clean state transition. Do not allow a ship to pay for peace and then die to a Missile that
the other side had already launched.

### 9.3 Escape

Escape is a future timed, cancellable Pilot task exposed through the Drive's inline interaction.

Confirmed behavior:

- Drive must be OPERATIONAL;
- other officers do not need to be idle;
- cancel / `INTERRUPT` / `STUN` loses current Escape progress;
- a new attempt starts from zero;
- success ends the encounter and clears all combat threats/effects rather than suspending the old fight.

### 9.4 Encounter-local reset

After a normal encounter end, including successful Escape:

- surviving encounter-local equipment integrity returns to full;
- Power Core returns to full;
- temporary combat state is cleared;
- Hull damage persists;
- spent ammunition persists.

Do not create post-combat waiting as optimal play for state that is restored for free anyway.

## 10. Combat presentation contract

Threat presentation should be organic and low-cognitive-load rather than a spreadsheet of independent countdown
cards.

The intended two-level read is:

1. a small set of **category danger indicators** that tells the captain what kind of response may be needed;
2. concrete telegraphy on the first-person viewscreen, with detailed selection/state available through the relevant
   equipment interaction when needed.

The main dashboard does not need one persistent card, second counter or mitigation frame for every concrete threat.
Exact presentation rules live in `THREAT_PANEL.md`.

## 11. Equipment diversity

Current weapon families should differ through targeting, officer contention, resource model, timing and counters
rather than only damage values.

The starting loadout needs a simple baseline offensive weapon. **That need is confirmed; the weapon's exact identity
is not.** Autocannon/Basic Gun and its possible ammo, CORE or self-wear rules remain idea-bank material until that
family is actually designed and playtested.

See `EQUIPMENT.md` for uncommitted weapon concepts such as Autocannon, Scattergun, Torpedo and Plasma.

## 12. WORKING THEORY — run structure

The following is the current main macro-game hypothesis, not implemented runtime and not a promise that every detail
will survive production.

Working loop:

```text
MILITARY OUTPOST
-> choose one contract
-> plan route
-> reach target node
-> complete objective
-> report to ANY military outpost before the jump budget expires
-> choose next contract
-> ...
-> final assignment
```

Current theory:

- global nodes have physical positions;
- the ship has a jump radius rather than a fixed edge graph;
- a contract has one shared jump budget covering objective + return/reporting travel;
- local movement/exploration inside one global node does not spend contract jumps;
- a target node may contain several local points such as ships, stations, anomalies, wrecks or events;
- local exploration should create risk/reward rather than free farming;
- geography and major anchors may persist while temporary local content refreshes between contracts.

This is the preferred direction today because it supports route planning and optional local exploration. Revisit it
when macro-game implementation actually begins.

Current `FLY_TO` / `JUMP` / `DOCK` all-idle restrictions are prototype runtime behavior, not a settled final travel
rule. Do not redesign them opportunistically during combat work; treat travel concurrency as a separate future
design task.

## 13. WORKING THEORY — crew depth and future Scientist content

Traits, Morale, pairwise relationships, R&R and deeper crew progression are future directions only. Their detailed
rules have not reached implementation design yet.

Likewise, Scientist still needs more combat content beyond SPAM/Purge. The current flavor direction is that Science
actions can be high-commitment, disruptive and unpleasant for the enemy rather than simply another damage button.
Possible analysis/interference actions should be designed only when they create a real tactical decision.

Do not build a detailed Morale/relationship/trait system or a menu of Scientist interference actions merely because
those ideas exist in planning notes.
