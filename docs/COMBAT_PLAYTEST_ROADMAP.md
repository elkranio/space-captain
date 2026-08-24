# Space Captain — Combat Playtest Roadmap

This file contains combat milestones and playtest gates, not a dump of every possible mechanic.

The exact next working slice lives in `../CURRENT_HANDOFF.md`. Concrete deferred work lives in `BACKLOG.md`.

## Current foundation

Current landed foundation:

- mandatory player Science TRACK/IDENTIFY removed from normal incoming-threat readability;
- player and enemy Defense Turret current shot resolution is deterministic after successful work/loading;
- incoming Beam target truth is currently `HULL | DRIVE` and safe for immediate player presentation;
- player Drive integrity and Beam module damage are engine-owned;
- player targeted-Shield semantics and the current `HULL | DRIVE` picker are implemented;
- physical dual captain-display shell exists;
- clean combat header + 4x2 glyph threat dashboard is implemented;
- tintable Missile / Beam / Mine / SPAM threat glyph family is implemented;
- the four-pass stale/transport/structure/cognitive cleanup audit is closed.

The intended mechanics reconciliation is complete. `GAME_DESIGN.md` is the canonical design target;
`GAMEPLAY_CONTRACTS.md` remains current runtime truth.

## Gate A — first combat becomes structurally playable and readable

Current implementation order:

```text
chassis-owned ship slots + loadout mounts
-> encounter slot integrity / BROKEN operational gating
-> player Beam HULL | SLOT targeting
-> weak-player vs weak-enemy timing/balance smoke
-> OUR SHIP dashboard + enemy inspectability
-> Science tactical-information pass
-> migrate/deepen targeted Shield behavior as needed
```

### 1. Chassis slots and loadout shape

Make chassis define physical build shape instead of assuming one universal ship layout.

Baseline slot categories:

```text
WEAPON
DEFENSE
EQUIPMENT
```

A ship loadout/preset fills compatible chassis slots. Different chassis may expose different counts and combinations.

The persistent player ship must gain real chassis identity; the current debug-only `maxHull + four weapon fields` shape
must not become the new slot model.

### 2. Runtime slot damage and operational gating

Targetable slots/modules use encounter-local integrity with binary functionality:

```text
integrity > 0 -> OPERATIONAL
integrity = 0 -> BROKEN
```

A BROKEN slot disables the installed hardware. Keep this as one authoritative domain rule rather than duplicating
`slot not broken` checks through command handlers, AI and runners.

Hull remains separate. Power Core remains non-breakable/non-targetable.

### 3. Player Beam semantic targeting

Replace actor-wide player Beam resolution with a concrete semantic target:

```text
HULL
or
SLOT(slotId)
```

Beam consequences:

```text
HULL
    -> hullDamage

operational slot
    -> moduleDamage
    -> no Hull damage

hit that breaks slot
    -> no overkill spill

already BROKEN slot
    -> hullDamage * 2
```

The target is basic readable combat information. Engine command availability remains authoritative.

The existing incoming `HULL | DRIVE` Beam target is an early prototype of this model; migrate it only after the shared
slot target identity is stable rather than creating permanent parallel target systems.

### 4. First weak-fight baseline

Before adding more combat complexity, test a deliberately weak/basic player ship against a weak/basic enemy.

Acceptance target:

- reasonable play wins almost every time;
- the fight resolves quickly;
- "easy but long" is a failure;
- there are no long toothpick-vs-tree attrition stretches;
- basic/unupgraded weapon families are not obvious trap choices.

Especially compare Missile Launcher and Beam Cannon. Beam precision may create control value, but Missile direct Hull
pressure must remain a viable competing plan.

Do not demand identical DPS or equal solo time-to-kill from every weapon family. Viability means each family creates a
real useful combat plan without becoming strictly dominated.

### 5. OUR SHIP dashboard and enemy inspectability

Once slots are real domain state, make both sides readable from that truth instead of designing UI around temporary
`HULL | DRIVE` assumptions.

Player surface should expose:

- Hull and Power Core;
- installed slots/modules;
- damaged/BROKEN systems;
- active Shield target/state;
- important officer/task state where it changes decisions.

Enemy inspection should expose enough basic anatomy/loadout/slot state to understand player targeting without a
mandatory
Science permission gate.

Prefer dedicated inspection surfaces over turning the permanent threat panel into a spreadsheet.

### 6. Science tactical information

Give Science combat work that changes decisions. Do not invent filler actions merely for role symmetry.

Useful information must create tactical advantage beyond basic interface legibility.

### 7. Enemy targeted Shield

After shared slot target truth exists, implement/deepen enemy target choice and targeted Shield resolution through the
enemy's own perceived information boundary. Enemy policy must not read hidden player attack truth merely because the
engine contains it.

### Gate A check

The player should be able to answer quickly:

- what is happening to us?
- which responses are actionable?
- what is installed/broken on each ship?
- what can my Beam target and why?
- what did my action accomplish?
- is the first/basic fight fast enough to be fun rather than inevitable attrition?
- what additional decision did Science information create?

Then run a short focused combat smoke/playtest.

## Gate B — combat develops build space

### 8. Shared combat-effect vocabulary

Before several weapons gain special hit behavior, keep explicit distinctions between at least:

```text
officer stun       = officer unavailable for time
task interruption  = current work stops; officer can immediately work again
system broken      = semantic ship slot/module unavailable until repaired
```

Do not collapse stun and interruption into one effect.

### 9. Weapon/build diversity

Add and tune the confirmed Basic Gun alongside other weapons so builds create distinct pressure through damage,
disruption, crew pressure, subsystem pressure and resource economy.

Do not lock speculative effect percentages or future slot lists into this roadmap.

### 10. Combat Lab

Build lightweight deterministic combat-test tooling once the readable combat foundation is stable enough to compare
setups quickly.

Useful minimum:

- choose player/enemy chassis + loadout/preset;
- choose deterministic RNG seed;
- restart the same setup quickly;
- expose enough telemetry to compare duration, damage, resource use and threat outcomes.

### Gate B check

Before leaving Gate B:

- weapons should differ by decisions, not only damage numbers;
- several chassis/equipment combinations should produce meaningfully different play patterns;
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

Weak equipment + fresh/basic crew + weak enemies. Combat should be simple, short and strongly player-favored under
reasonable play. Bad choices can still create real Hull/ammo costs or a loss, but the opening fights must not be long
attrition walls.

### Mid

Several plausible builds + stronger enemies + some crew condition/perks. Different equipment/crew combinations should
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
