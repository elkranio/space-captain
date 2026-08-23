# Space Captain — Combat Playtest Roadmap

This file contains combat milestones and playtest gates, not a dump of every possible mechanic.

The exact next working slice lives in `../CURRENT_HANDOFF.md`. Concrete deferred work lives in `BACKLOG.md`.

## Current foundation

Current landed foundation:

- mandatory player Science TRACK/IDENTIFY removed from normal incoming-threat readability;
- player Defense Turret BASIC interception is guaranteed on successful completed Weapons work;
- incoming Beam target truth is `HULL | DRIVE` and safe for immediate player presentation;
- player Drive integrity and Beam module damage are engine-owned;
- player targeted-Shield semantics and `HULL | DRIVE` picker are implemented;
- physical dual captain-display shell exists;
- clean combat header + 4x2 glyph threat dashboard is implemented;
- tintable Missile / Beam / Mine / SPAM threat glyph family is implemented.

The intended mechanics reconciliation is complete. `GAME_DESIGN.md` is the canonical design target;
`GAMEPLAY_CONTRACTS.md` remains current runtime truth.

## Gate A — combat becomes readable

Current implementation order:

```text
OUR SHIP functional/module dashboard + targeted-Shield visual
-> enemy inspectability / enemy dashboard
-> Science tactical-information pass
-> player Beam semantic target
-> enemy targeted Shield
```

### 1. OUR SHIP dashboard

Make the player's own combat state easy to read:

- hull and Power Core;
- installed/important modules;
- damaged/broken systems;
- active Shield target/state;
- important officer/task state where it changes decisions.

The targeted-Shield visual belongs here rather than in a temporary threat row.

### 2. Enemy inspectability

Basic enemy anatomy/state should be inspectable without a mandatory Science permission gate.

Provide enough real state to understand player actions while keeping deeper tactical knowledge available for Science.
Prefer a dedicated inspection surface over turning the permanent threat panel into an enemy spreadsheet.

### 3. Science tactical information

Give Science combat work that changes decisions. Do not invent filler actions merely for role symmetry.

Useful information must create tactical advantage beyond basic interface legibility.

### 4. Player Beam semantic target

Player Beam needs a concrete enemy node target. Start with the proven small vocabulary:

```text
HULL | DRIVE
```

Add more target kinds only when they have real domain identity and consequences.

### 5. Enemy targeted Shield

After player Beam target truth exists, implement enemy target choice/Shield resolution through the enemy's own perceived
information boundary. Enemy policy must not read hidden player attack truth merely because the engine contains it.

### Gate A check

The player should be able to answer quickly:

- what is happening to us?
- which responses are actionable?
- what is happening to the enemy?
- what basic enemy state can I inspect?
- what did my action accomplish?
- what additional decision did Science information create?

Then run a short focused combat smoke/playtest.

## Gate B — combat develops build space

### 6. Shared combat-effect vocabulary

Before several weapons gain special hit behavior, keep explicit distinctions between at least:

```text
officer stun       = officer unavailable for time
task interruption  = current work stops; officer can immediately work again
system broken      = semantic ship node unavailable until repaired
```

Do not collapse stun and interruption into one effect.

### 7. Weapon/build diversity

Add and tune the confirmed Basic Gun alongside other weapons so builds create distinct pressure through damage,
disruption, crew pressure, subsystem pressure and resource economy.

Do not lock speculative effect percentages or future node lists into this roadmap.

### 8. Combat Lab

Build lightweight deterministic combat-test tooling once the readable combat foundation is stable enough to compare
setups quickly.

Useful minimum:

- choose player/enemy loadout or preset;
- choose deterministic RNG seed;
- restart the same setup quickly;
- expose enough telemetry to compare duration, damage, resource use and threat outcomes.

### Gate B check

Before leaving Gate B:

- weapons should differ by decisions, not only damage numbers;
- several equipment combinations should produce meaningfully different play patterns;
- all officer roles that participate in combat should face real contention rather than artificial button-count symmetry;
- fights should resolve without long dead-air/attrition periods.

## Gate C — crew becomes the roguelite multiplier

Only after combat readability/build space works, add the deeper crew layer needed for serious run-phase testing:

- positive officer traits/upgrades;
- Morale as the single dynamic officer-condition value;
- negative traits and severe-dysfunction consequences;
- pairwise relationship deterioration/support;
- role-to-role synergies where they modify real interactions.

Prefer natural system interactions over arbitrary set bonuses.

## Serious internal combat matrix

After Gate C, test representative early/mid/end setups.

### Early

Weak equipment + fresh/basic crew + weak enemies. Combat should be simple, reasonably fast and losable through bad
choices.

### Mid

Several plausible builds + stronger enemies + some crew condition/perks. Different equipment/crew
combinations should
produce visibly different decisions.

### End

Strong/weak builds crossed with healthy/dysfunctional crew against dangerous enemies. Death should be a normal risk, but
a doomed fight should fail clearly rather than become a long attrition wall.

Track at least:

- combat duration;
- hull lost;
- ammo/resource/Core use;
- officer busy time;
- threat outcomes;
- damage/effects by source;
- obvious dead-air periods.

The target is not equal win rate. Good builds may feel powerful, bad builds may fail, and crew condition
should materially change how the same hardware performs.
