# Space Captain — Combat Playtest Roadmap

Updated: 2026-08-21.

This document defines the broader gameplay work required before serious internal combat playtests across early-game,
midgame and endgame conditions.

The exact immediate atom order lives in `../CURRENT_HANDOFF.md`.

The goal is not to finish the whole run first. Combat should become readable, interesting and build-sensitive in isolation
before fatigue, relationships, shops, R&R and full run progression are used to judge it.

## Current Gate A checkpoint

Completed/landed foundation now includes:

- player-facing Science TRACK/IDENTIFY removed from basic incoming threats;
- player Defense Turret BASIC interception made guaranteed on completed Weapons task;
- incoming enemy Beam target truth for HULL/DRIVE exposed directly to player presentation;
- encounter-local player Drive integrity and real Beam module damage;
- player targeted Shield engine/domain semantics;
- player HULL/DRIVE Shield picker;
- physical dual captain-display shell;
- a new simplified threat-dashboard visual/interaction design;
- new tintable `107x33` Missile / Beam / Mine / SPAM threat glyph assets.

The new threat-dashboard **design/assets are ready but the runtime view is still the old card UI**.

Current immediate order:

```text
implement new 4x2 glyph threat dashboard
-> player OUR SHIP functional/module dashboard + targeted-Shield visual
-> enemy inspectability / enemy dashboard work
-> Science tactical-information pass
-> player Beam semantic target
-> enemy targeted Shield choice/resolution/visual
```

The exact order after the threat-dashboard atom may move if runtime exposes a stronger dependency.

## Target playtest question

We eventually want to answer whether combat stays interesting across three abstract run phases.

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
- basic combat decisions are already enjoyable before deeper roguelite systems matter.

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
- strong play can recover from mistakes, but the player can genuinely take damage or lose.

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
- bad builds may become non-viable, but a doomed fight should fail clearly and quickly rather than drag on forever.

## Working definition of a combat build

A combat build is not only the installed weapons.

```text
combat build
    = ship package
    + crew package
```

Ship package includes weapons, defensive modules, Power Core and other relevant installed hardware.

Crew package includes permanent officer traits/perks and eventually their relationships/synergies.

Temporary crew condition such as fatigue, anger or current relationship damage is a separate run-state multiplier on top
of that build.

A combat result therefore comes from roughly:

```text
build × crew condition × enemy matchup × player decisions
```

## Broader combat work pool

The numbered items below are not a strict override of `CURRENT_HANDOFF.md`. They are the remaining Gate A/B work pool and
can be reordered when a concrete dependency makes another slice more useful.

### 1. Threat dashboard implementation

Implement the current `THREAT_PANEL.md` contract before judging combat readability from the outgoing card UI.

Current target:

- 4x2 grid;
- large glyph + one action label;
- whole cell is the action/cancel surface;
- no numeric timer/card/button chrome;
- red useful-window fill inside the glyph;
- full-red terminal blink;
- disabled action state does not hide threat urgency.

This is a presentation/read-model slice, not an excuse to redesign the combat rules again.

### 2. Player dashboard functional redesign

This can remain visually provisional, but it should become easy to read before system damage and repair mechanics expand.

It should clearly communicate the player's own:

- hull;
- Shield/defense state;
- Power Core state;
- installed weapons/modules;
- damaged/broken systems;
- stunned/offline officers where useful;
- active repairs or other important work.

The targeted Shield deploy/active protected node should land here rather than being bolted onto the outgoing provisional
rows.

The goal is functional combat readability, not final art.

### 3. Enemy dashboard / inspection redesign

Treat enemy visibility as gameplay, not presentation polish.

Basic enemy combat anatomy should be broadly inspectable rather than hidden behind a mandatory Science permission gate.

The player should eventually be able to inspect, when safely available:

- hull;
- active Shield state;
- real ship nodes/modules;
- installed weapons;
- officer slots/presence/state;
- relevant resources/telemetry required to understand player actions.

A dedicated full inspection overlay/modal is preferred over turning the right threat dashboard into another permanent
enemy spreadsheet.

Science can still add deeper tactical knowledge; it should not be required just to learn that an enemy has a Drive or a
weapon slot.

### 4. Science tactical-information pass

Science needs useful combat work after removal of mandatory threat TRACK.

Do **not** compensate by inventing filler buttons or passive numbers merely so Science has equal button count.

Promising information families include:

- special enemy properties/traits;
- weakness/resistance discovery;
- crew/module state that is not basic anatomy;
- prediction of the next attack before normal telegraph;
- targeting disruption / EW;
- tactical scan facts that another officer can exploit.

The test for a Science fact is whether knowing it changes a real decision.

### 5. Beam Cannon semantic node targeting

Player Beam still needs its own concrete enemy-node target before enemy targeted Shield placement can become meaningful.

The first proven node language is deliberately small:

- HULL;
- DRIVE.

Incoming enemy Beam already uses this vocabulary against the player.

Basic target choice should come from real inspectable enemy state, not from a restored mandatory Science TRACK gate.
Science may reveal special properties or better target quality, but basic node permission should remain readable.

Add new target kinds only when they have real identity and consequences. Do not add generic BRIDGE / WEAPON / SHIELD /
DEFENSE strings merely because a future system might use them.

### 6. Enemy targeted Shield

After player Beam has semantic target truth, give the enemy targeted Shield choice/resolution using its own perceived
information boundary.

Do not let enemy policy read hidden player attack truth merely because engine state contains it.

### 7. Shared combat-effect model

Before adding several weapons with special hit behavior, establish a small explicit effect vocabulary.

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

### 8. Starter gun experiment

Add a simple free/basic weapon if testing confirms the current starter loadout needs a reliable baseline damage source.

Desired role:

- simple;
- weak in mid/endgame;
- sufficient to kill early enemies in reasonable time;
- little or no special utility;
- acts as a balance ruler for basic hull damage.

Its purpose is not to be exciting forever. Its purpose is to ensure the player can always begin a run with a
comprehensible way to win an early fight.

### 9. Weapon hit-effects pass

Revisit existing weapon outcomes and give them clean, explicit combat effects. This is expected to become one of the main
sources of build diversity.

Candidate direction:

- Missile hit: hull damage plus a chance to stun one or more officers;
- Beam hit on a real module node: damage/break that semantic module;
- generic Beam/hit effects may interrupt officer work where appropriate;
- other weapons can specialize around damage, disruption, crew pressure or subsystem pressure.

Do not lock exact probabilities/effects in this roadmap. They must be tuned through playtests.

### 10. Information-denial / EMP experiment

Experiment only after the normal threat dashboard is readable.

Promising player-facing version is **not** a hard dashboard shutdown.

Instead, for only a few seconds:

- keep threat glyphs visible;
- keep threat actions/clicks available;
- hide the red progress/timing layer;
- leave actual gameplay timers untouched;
- force the player to estimate timing from physical telegraphs;
- optionally keep the terminal full-red blink as a coarse emergency signal.

Candidate duration is roughly 4–5 seconds.

Possible physical timing cues:

- Missile approach;
- Sticky Mine lamp/pulse progression;
- Beam charge-up;
- SPAM/interference VFX.

Against enemy AI, an EMP-like weapon may still experiment with temporary decision disruption, but do not force symmetry
if the player-facing version works better as information denial.

Keep the mechanic only if playtesting finds it tense rather than annoying.

### 11. Second Helm combat command

Do not invent this command merely to make every role symmetrical.

By the time the preceding combat systems exist, the real combat loop should reveal what Helm is missing. Design the
second command from an observed gameplay need.

Possible families may include repositioning, breaking locks, protecting a ship section, pursuit, stabilization or another
maneuver mechanic, but none is canonical yet.

## Gate A — Combat becomes readable

Gate A covers the threat/player/enemy information foundation and first meaningful Science/target-defense loop.

Before leaving this gate, the player should be able to quickly answer:

- what is happening to us?
- which responses are currently actionable?
- what is happening to the enemy?
- what basic enemy anatomy/state can I inspect?
- what did my last action actually accomplish?
- what extra decision did Science knowledge create?

The combat should no longer feel like attacking a hidden state machine.

Do a short smoke playtest here. Do not attempt full early/mid/end balance yet.

## Gate B — Combat develops build space

Gate B covers the shared effect model, baseline damage-source experiments, weapon effect diversity, information-denial
experiments and missing role pressure exposed by real play.

Before leaving this gate:

- weapons should not differ only by damage numbers;
- damage, disruption, officer pressure and subsystem pressure should create meaningfully different tactical routes;
- Science knowledge should enable some of those routes;
- all four officer roles should have real combat-time competition;
- at least a few plausible equipment combinations should encourage different decision patterns.

This is where the first real definition of ship-side build diversity should emerge.

### Combat Lab / test tooling

Begin building lightweight combat-test tooling during the transition from Gate A to Gate B rather than waiting for all
mechanics to be finished.

Useful minimum capabilities:

- choose player loadout;
- choose enemy preset/loadout;
- choose officer states/traits when those systems exist;
- choose deterministic RNG seed;
- restart the same setup quickly;
- restart with a new seed;
- expose enough telemetry to compare fight duration, damage, resource use and threat outcomes.

The lab exists so combat can be tested without waiting for shops, exploration, R&R or full run generation.

Do another focused combat playtest at the end of Gate B. The question is not yet "is endgame balanced?" but "do different
combat builds actually play differently?"

## Gate C — Crew turns combat into the roguelite

Only after the combat/readability/build foundation works, add the deeper crew layer required for serious phase playtests.

Expected systems include:

- positive officer perks;
- fatigue/declining performance;
- negative traits;
- relationship deterioration/conflict;
- positive relationships/support;
- possible role-to-role combat synergies;
- severe late-run dysfunction/sabotage where appropriate.

Crew synergies should preferably modify real role interactions rather than add arbitrary set bonuses.

A useful direction is:

```text
personal compatibility/interests
    -> relationship develops more easily
    -> good relationship improves coordination
    -> coordination modifies a real combat handoff/action
```

For example, Science/Weapons synergy should ideally improve some real tactical-information-to-fire interaction rather
than simply grant `+10% damage` because two officers share a hobby.

System/equipment synergies should also emerge naturally from shared resources and role contention, for example:

- Beam pressure + Missiles competing for enemy defensive resources;
- Mines occupying Engineer while another threat also needs Engineer;
- SPAM slowing crew work while another threat demands a time-sensitive response;
- Science choosing between PURGE and a valuable tactical scan.

Do not add artificial combo bonuses until these natural interactions have been observed and tested.

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
