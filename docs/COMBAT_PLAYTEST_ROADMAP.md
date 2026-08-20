# Space Captain — Combat Playtest Roadmap

Updated: 2026-08-20.

This document defines the broader gameplay work required before serious internal
combat playtests across early-game, midgame and endgame conditions.

The exact immediate atom order lives in `../CURRENT_HANDOFF.md`.

The goal is not to finish the whole run first. Combat should become readable,
interesting and build-sensitive in isolation before fatigue, relationships,
shops, R&R and full run progression are used to judge it.

## Current Gate A checkpoint

Completed foundation now includes:

- compact Missile / Beam / Mine / Spam threat tiles;
- button-local smart decision timing;
- incoming enemy Beam target truth for HULL/DRIVE;
- encounter-local player Drive integrity and real Beam module damage.

Current immediate work is targeted Beam defense:

```text
player targeted Shield
-> player Shield picker/visual
-> player Beam semantic target prerequisite
-> enemy targeted Shield choice
-> enemy Shield visual
```

After that, continue the broader readability/build work below.

## Target playtest question

We eventually want to answer whether combat stays interesting across three
abstract run phases.

### Early game

Starting conditions:
- weak equipment;
- weak/fresh officers with few or no meaningful positive perks;
- weak enemies;
- crew has not yet accumulated serious fatigue or relationship problems.

Desired result:
- combat is simple but not impossible to lose through bad decisions;
- combat is dynamic and not drawn out;
- starter equipment can kill an early enemy in reasonable time;
- basic combat decisions are already enjoyable before deeper roguelite systems
  matter.

### Midgame

Starting conditions:
- stronger and more varied equipment;
- loadout starts depending on shops, run RNG and player choices;
- officers begin to matter through perks and deteriorating condition;
- enemies create real pressure but remain manageable.

Desired result:
- combat has more decisions without becoming slower or bloated;
- different equipment/crew combinations produce visibly different play styles;
- neglected crew condition begins to hurt;
- strong play can recover from mistakes, but the player can genuinely take
  damage or lose.

### Endgame

Starting conditions:
- mature or flawed builds;
- dangerous enemies;
- crew condition may be excellent or badly degraded;
- run RNG and earlier choices may have produced either a strong or weak build.

Desired result:
- death is a normal risk;
- fights may last somewhat longer, but must not become boring wars of attrition;
- neglected/badly rolled officers can seriously undermine the ship;
- excellent builds may faceroll some encounters;
- bad builds may become non-viable, but a doomed fight should fail clearly and
  quickly rather than drag on forever.

## Working definition of a combat build

A combat build is not only the installed weapons.

```text
combat build
    = ship package
    + crew package
```

Ship package includes weapons, defensive modules, Power Core and other relevant
installed hardware.

Crew package includes permanent officer traits/perks and eventually their
relationships/synergies.

Temporary crew condition such as fatigue, anger or current relationship damage
is a separate run-state multiplier on top of that build.

A combat result therefore comes from roughly:

```text
build × crew condition × enemy matchup × player decisions
```

## Broader combat work pool

The numbered items below are not a strict override of `CURRENT_HANDOFF.md`.
They are the remaining Gate A/B work pool and can be reordered when a concrete
dependency makes another slice more useful.

### 1. Enemy dashboard redesign

Treat enemy visibility as gameplay, not presentation polish.

The player should stop feeling like they are hitting a mysterious black box.
The dashboard should make visible, when known:
- hull;
- active shield state;
- relevant discovered systems/nodes;
- officer slots;
- whether an enemy officer is present, absent, active or stunned;
- other combat state required to understand the consequences of player actions.

Threat presentation should follow the compact threat-tile direction already
documented in `THREAT_PANEL.md`.

### 2. Player dashboard functional redesign

This can remain visually provisional, but it should become easy to read before
system damage and repair mechanics expand.

It should clearly communicate the player's own:
- hull;
- shield/defense state;
- Power Core state;
- damaged/broken systems;
- stunned officers;
- active repairs or other important officer work.

The goal is functional combat readability, not final art.

### 3. Science enemy scan

Science should be able to reveal useful combat knowledge about the enemy.

Scanning should turn an initially uncertain enemy into a more actionable
combat model rather than merely expose another HP number.

Possible information progression includes:
- hull/shield/crew information;
- installed systems;
- targetable subsystem/node information;
- tactical facts that unlock better combat decisions.

The exact scan depth/progression can be tuned during implementation. The core
contract is that Science creates knowledge that other roles can exploit.

### 4. Beam Cannon semantic node targeting

Science knowledge should unlock meaningful target choices for Weapons.

The first proven node language is deliberately small:

- HULL;
- DRIVE.

Incoming enemy Beam already uses this vocabulary against the player.

Player Beam still needs its own concrete enemy-node target before enemy targeted
Shield placement can become meaningful.

Add new target kinds only when they have real identity and consequences. Do not
add generic BRIDGE / WEAPON / SHIELD / DEFENSE strings merely because a future
system might use them.

Do not build a large subsystem simulation before the first useful
target/defense loop works.

### 5. Shared combat-effect model

Before adding several weapons with special hit behavior, establish a small
explicit effect vocabulary.

At minimum distinguish:

```text
officer stun
    = officer unavailable for N seconds

task interruption
    = current work is cancelled/interrupted,
      but officer is immediately usable again

system broken
    = semantic ship node becomes unavailable until repaired
```

Stun and interruption must not be treated as the same thing.

### 6. Starter gun experiment

Add a simple free/basic weapon if testing confirms the current starter loadout
needs a reliable baseline damage source.

Desired role:
- simple;
- weak in mid/endgame;
- sufficient to kill early enemies in reasonable time;
- little or no special utility;
- acts as a balance ruler for basic hull damage.

Its purpose is not to be exciting forever. Its purpose is to ensure the player
can always begin a run with a comprehensible way to win an early fight.

### 7. Weapon hit-effects pass

Revisit existing weapon outcomes and give them clean, explicit combat effects.
This is expected to become one of the main sources of build diversity.

Candidate direction:
- missile hit: hull damage plus a chance to stun one or more officers;
- Beam hit on a real module node: damage/break that semantic module;
- generic Beam/hit effects may interrupt officer work where appropriate;
- other weapons can specialize around damage, disruption, crew pressure or
  subsystem pressure.

Do not lock exact probabilities/effects in this roadmap. They must be tuned
through playtests.

### 8. EMP weapon experiment

Add EMP only after the common effect model exists.

Candidate behavior:
- against player: briefly disrupt/hide the threat dashboard;
- against enemy: briefly prevent the enemy captain from making decisions.

This is explicitly experimental. Player information denial may feel tense or
may simply feel annoying; keep it only if playtesting proves it useful.

### 9. Second Helm combat command

Do not invent this command merely to make every role symmetrical.

By the time the preceding combat systems exist, the real combat loop should reveal what Helm is
missing. Design the second command from an observed gameplay need.

Possible families may include repositioning, breaking locks, protecting a ship
section, pursuit, stabilization or another maneuver mechanic, but none is
canonical yet.

## Gate A — Combat becomes readable

Covers steps 1–4.

Before leaving this gate, the player should be able to quickly answer:
- what is happening to us?
- what is happening to the enemy?
- what do we currently know about the enemy?
- what did my last action actually accomplish?
- what new decisions did Science knowledge unlock?

The combat should no longer feel like attacking a hidden state machine.

Do a short smoke playtest here. Do not attempt full early/mid/end balance yet.

## Gate B — Combat develops build space

Covers steps 5–9.

Before leaving this gate:
- weapons should not differ only by damage numbers;
- damage, disruption, officer pressure and subsystem pressure should create
  meaningfully different tactical routes;
- Science knowledge should enable some of those routes;
- all four officer roles should have real combat-time competition;
- at least a few plausible equipment combinations should encourage different
  decision patterns.

This is where the first real definition of ship-side build diversity should
emerge.

### Combat Lab / test tooling

Begin building lightweight combat-test tooling during the transition from
Gate A to Gate B rather than waiting for all mechanics to be finished.

Useful minimum capabilities:
- choose player loadout;
- choose enemy preset/loadout;
- choose officer states/traits when those systems exist;
- choose deterministic RNG seed;
- restart the same setup quickly;
- restart with a new seed;
- expose enough telemetry to compare fight duration, damage, resource use and
  threat outcomes.

The lab exists so combat can be tested without waiting for shops, exploration,
R&R or full run generation.

Do another focused combat playtest at the end of Gate B. The question is not yet
"is endgame balanced?" but "do different combat builds actually play
differently?"

## Gate C — Crew turns combat into the roguelite

Only after the combat/readability/build foundation works, add the deeper crew
layer required for serious phase playtests.

Expected systems include:
- positive officer perks;
- fatigue/declining performance;
- negative traits;
- relationship deterioration/conflict;
- positive relationships/support;
- possible role-to-role combat synergies;
- severe late-run dysfunction/sabotage where appropriate.

Crew synergies should preferably modify real role interactions rather than add
arbitrary set bonuses.

A useful direction is:

```text
personal compatibility/interests
    -> relationship develops more easily
    -> good relationship improves coordination
    -> coordination modifies a real combat handoff/action
```

For example, Science/Weapons synergy should ideally improve some real
scan-to-target or intel-to-fire interaction rather than simply grant `+10%
damage` because two officers share a hobby.

System/equipment synergies should also emerge naturally from shared resources
and role contention, for example:
- Beam pressure + missiles competing for enemy defensive resources;
- mines occupying Engineer while another threat also needs Engineer;
- SPAM denying Science while missiles need Science intel.

Do not add artificial combo bonuses until these natural interactions have been
observed and tested.

## Serious internal playtest gate

After Gate C, run the actual early/mid/end combat matrix.

Test at minimum:

### Early
- true starter equipment;
- fresh/basic crew;
- weak enemies.

### Mid
- several different plausible equipment builds;
- some positive officer perks;
- some accumulated fatigue/relationship degradation;
- several enemy archetypes.

### End
- strong build + healthy crew;
- strong build + dysfunctional crew;
- weak build + healthy crew;
- weak build + dysfunctional crew;
- dangerous endgame enemy presets.

Judge more than win rate.

Track at least:
- combat duration;
- hull lost;
- ammo/resource use;
- Power Core use;
- officer busy time;
- threat outcomes;
- damage/effects by source;
- obvious dead-air or attrition periods.

The final question is not whether every build can win every fight.

The target is:
- good builds can feel powerful;
- bad builds can fail;
- crew condition materially changes the same hardware;
- different builds create different decisions;
- winning and losing both resolve without boring attrition.
