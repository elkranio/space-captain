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
- rebuilt first-person bridge shell exists with physical officer monitors, viewscreen and dual lower dashboards;
- MY SHIP header / Power Core / exact 4x3 grid / narrow BRIDGE-HULL special-column geometry is landed;
- all seven current standard MY SHIP equipment tiles are landed with content-driven titles, operational state,
  resources/progress where relevant and integrity;
- MY SHIP equipment placement is authoritative from chassis slots + persistent mounts rather than array/family order;
- player Beam Cannon now spends shared Power Core when charging begins;
- the MY SHIP BRIDGE/HULL special column still contains placeholder-only content;
- the right dashboard and old large threat-action presentation are still legacy/superseded rather than the intended
  persistent ENEMY SHIP board + compact threat monitor;
- tintable Missile / Beam / Mine / SPAM threat glyph family is implemented;
- the four-pass stale/transport/structure/cognitive cleanup audit is closed.

The intended mechanics reconciliation is complete. `GAME_DESIGN.md` is the canonical design target;
`GAMEPLAY_CONTRACTS.md` remains current runtime truth.

## Gate A — first combat becomes structurally playable and readable

Current implementation order:

```text
LANDED: chassis-owned ship slots + persistent loadout mounts
-> LANDED: normalized Debug Start loadout + chassis-aware content editor
-> LANDED: generalized encounter equipment-integrity foundation
-> LANDED: new bridge shell + MY SHIP dashboard geometry
-> LANDED: all seven standard MY SHIP equipment tiles
-> LANDED: authoritative chassis-slot/mount placement for the 4x3 grid
-> NOW: real BRIDGE special-column state
-> HULL special-column state / target surface
-> persistent ENEMY SHIP slot board
-> compact top-center threat monitor migration
-> finish BROKEN / repair operational behavior required by the board
-> player Beam HULL | SLOT direct targeting on the real dashboard
-> shared incoming Beam / targeted-Shield slot target model
-> weak-player vs weak-enemy timing/balance smoke
-> Science tactical-information pass
-> deepen enemy targeted Shield behavior as needed
```

Precision targeting intentionally moved **after** the combat-board prototype. The target contract should be built against
the actual visible HULL / BRIDGE / equipment-slot surfaces rather than the superseded dashboard.

Current strict layout reference:

`reference/combat_bridge_layout_2026-08-25.png`

### 1. Chassis slots and loadout shape — LANDED

Chassis now define physical build shape instead of assuming one universal ship layout.

Current slot categories:

```text
DRIVE
WEAPON
DEFENSE
UTILITY
```

A ship loadout fills compatible chassis slots. Persistent mounts preserve stable slot identity. Debug Start uses the same
normalized loadout idea and has a chassis-aware equipment editor.

### 2. Runtime equipment integrity and operational gating — PARTIAL

Generalized encounter-local integrity is landed for Drive, Defense Turret, Shield Generator and weapons. Full BROKEN
operational gating / repair behavior across every family is still follow-up work.

Targetable slots/modules use encounter-local integrity with binary functionality:

```text
integrity > 0 -> OPERATIONAL
integrity = 0 -> BROKEN
```

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

### 4. Shared target model for incoming Beam / Shield

After the slot target identity is stable, migrate the temporary player-side `HULL | DRIVE` incoming Beam / targeted-Shield
vocabulary to the same semantic ship-target model where appropriate.

Keep the physical resolution order already proven by the current implementation. Do not create a permanent parallel
target taxonomy only because the old incoming path landed first.

### 5. Persistent dual ship combat board — PARTIAL

Once slots are real domain state, both ships stay visible during combat:

```text
LEFT  = MY SHIP
RIGHT = ENEMY SHIP
```

MY SHIP continuously exposes installed slots, integrity/BROKEN state, activity/readiness/resources and the systems the
player can operate.

ENEMY SHIP continuously exposes basic Hull, installed slots, integrity/BROKEN state and obvious activity. Basic enemy
anatomy must not require opening a separate inspection screen or pausing the fight.

Science may later add deeper decision-changing information; it does not gate the permanent basic enemy board.

The panels should share visual grammar without being forced into identical data density.

Current presentation progress:

- MY SHIP physical dashboard geometry is landed;
- all seven current standard equipment tiles are landed;
- equipment titles use catalog `shortName`;
- the 4x3 grid is populated from authoritative chassis slot/mount coordinates;
- the narrow BRIDGE/HULL special column is still placeholder-only;
- ENEMY SHIP is not yet rebuilt as the persistent mirrored slot board.

### 6. Direct targeting + compact threat strip

Prefer one interaction language:

```text
select own system
-> highlight valid targets
-> select target
```

Target surfaces depend on the selected system:

- Beam -> enemy Hull / targetable slot;
- Defense Turret -> concrete Missile threat;
- targeted Shield -> own targetable slot;
- Missile Launcher -> enemy ship / Hull.

The engine still owns legality. Views highlight only engine-resolved targets.

Incoming threats move out of the large right-side action grid into a compact, high-priority strip. One concrete threat
remains one icon/object; independent Missiles/Mines are not aggregated. The strip shows identity and urgency/progress and
marks threats already being handled.

Threat cells do not carry permanent mitigation buttons. They become target surfaces when the selected player system
requires a concrete threat.

### 7. First weak-fight baseline

Test a deliberately weak/basic player ship against a weak/basic enemy only after the intended dual-board/strip
interaction is usable.

Acceptance target:

- reasonable play wins almost every time;
- the fight resolves quickly;
- "easy but long" is a failure;
- there are no long toothpick-vs-tree attrition stretches;
- both ships and incoming urgency remain readable without basic-info modal hopping;
- basic/unupgraded weapon families are not obvious trap choices.

Especially compare Missile Launcher and Beam Cannon. Beam precision may create control value, but Missile direct Hull
pressure must remain a viable competing plan.

Do not demand identical DPS or equal solo time-to-kill from every weapon family. Viability means each family creates a
real useful combat plan without becoming strictly dominated.

### 8. Science tactical information

Give Science combat work that changes decisions. Do not invent filler actions merely for role symmetry.

Useful information must create tactical advantage beyond basic interface legibility.

### 9. Enemy targeted Shield

After shared slot target truth exists, implement/deepen enemy target choice and targeted Shield resolution through the
enemy's own perceived information boundary. Enemy policy must not read hidden player attack truth merely because the
engine contains it.

### Gate A check

The player should be able to answer quickly:

- what is happening to us?
- which responses are actionable?
- what is installed/broken on each ship without opening a basic-inspection modal?
- which own system did I select and what are its valid targets?
- which threat is most urgent / already being handled?
- what can my Beam target and why?
- what did my action accomplish?
- is the first/basic fight fast enough to be fun rather than inevitable attrition?
- what additional decision did Science information create?

Then run a short focused combat smoke/playtest.

## Gate B — combat develops build space

### 10. Shared combat-effect vocabulary

Before several weapons gain special hit behavior, keep explicit distinctions between at least:

```text
officer stun       = officer unavailable for time
task interruption  = current work stops; officer can immediately work again
system broken      = semantic ship slot/module unavailable until repaired
```

Do not collapse stun and interruption into one effect.

### 11. Weapon/build diversity

Add and tune the confirmed Basic Gun alongside other weapons so builds create distinct pressure through damage,
disruption, crew pressure, subsystem pressure and resource economy.

Do not lock speculative effect percentages or future slot lists into this roadmap.

### 12. Combat Lab

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
