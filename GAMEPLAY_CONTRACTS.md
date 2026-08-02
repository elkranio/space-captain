# Space Captain — Gameplay Contracts

Stable gameplay and information rules for the encounter-heavy part of
Space Captain.

This file records design contracts, not current implementation status.
Implementation checkpoints belong in `PROJECT_CONTEXT.md`.
Deferred work belongs in `BACKLOG.md`.
Architecture and ownership belong in `SYSTEM_MAP.md`.

Last reviewed against:

```text
29003f681c1c8ba0498cdb4d3edb5ed9f9a1eac5
```

Contract labels:

```text
LOCKED
```

Do not change during implementation without explicit design discussion.

```text
UNRESOLVED
```

A decision is required before code relies on one interpretation.

---

# 1. Core encounter language — LOCKED

```text
enemy telegraphs a threat
→ player gathers information
→ player assigns a limited officer/system
→ player chooses an exact response or accepts risk
→ result is shown clearly on the bridge
```

Combat is:

- real-time and decision-driven;
- sparse and readable;
- centered on officer allocation;
- mechanically simpler than a tactical simulator;
- built around overlapping responsibilities and limited resources.

Combat is not:

- bullet hell;
- RTS;
- a spreadsheet;
- a menu that only matches identical words;
- a generic simulation framework.

The default encounter contains one command-capable enemy ship.

---

# 2. State lifetime — LOCKED

Temporary combat objects are encounter-local:

- flying missiles;
- active laser attacks;
- sticky mines;
- directional shields;
- spam channels;
- temporary presentation effects.

```text
leave/reconstruct encounter
→ temporary combat objects disappear
```

Persistent player ship systems include:

- hull;
- drive;
- point-defense charges;
- shield-generator charges/regeneration;
- installed weapon phase/ammunition state;
- navigation.

Enemy ship identity persists in its node until destroyed.

---

# 3. Surviving enemy persistence — LOCKED RESET

A surviving enemy resets when its encounter is reconstructed.

```text
leave encounter and return
→ hydrate enemy again from persistent node actor
→ restore encounter hull, ammunition and system state
```

The persistent node actor keeps identity and baseline loadout, but non-lethal
encounter damage and resource spending are not written back.

Reset includes:

- hull;
- weapon ammunition and phases;
- drive and shield-generator encounter state;
- crew tasks;
- threat observations and Science reports;
- captain-policy runtime memory;
- opening-action usage;
- temporary combat objects.

A destroyed enemy is removed from the persistent node and does not return.

Player hull, ammunition, charges and navigation remain persistent.

This rule intentionally prevents hit-and-run repair loops against durable
targets. A future retreat/repair mechanic must be explicit gameplay and must
not arise from accidental partial synchronization.

---

# 4. Player hull ownership — LOCKED

Incoming damage is a gameplay-domain result.

The engine must determine:

- applied damage;
- remaining player hull;
- player destruction.

The app layer may persist and present that result, but must not own hull damage
rules or decide destruction from a raw damage event.

Current contract:

```text
incoming impact
→ engine mutates encounter player hull
→ engine emits applied result
→ persistence sync copies hull to GameRuntime
→ app presents damage / requests end scene on destroyed result
```

---

# 5. Officer occupation — LOCKED

Officer tasks represent work that requires an officer.

Weapon cooldown is autonomous and does not occupy the officer.

For weapon operations:

```text
TARGETING / CHARGING / CHANNELING / DISPENSING
→ operator occupied

COOLDOWN / READY
→ operator free
```

Manual cancellation and damage interruption remain task-specific.

No cancellation may create free ammunition, free charges or skipped cooldown.

---

# 6. Player missile offense — LOCKED

```text
READY launcher + ammo + live target
→ FIRE MISSILE
→ Weapons aims
→ launch spends one missile
→ Weapons becomes free
→ launcher cooldown proceeds autonomously
→ missile flies independently
```

Rules:

- each ready physical launcher is a separate command identified by its runtime
  `weaponId`;
- execution uses the selected launcher and never re-selects another ready one;
- cancellation before launch spends no ammunition;
- target loss before launch resets without spending ammunition;
- target loss after launch resolves the projectile without damage;
- enemy shields do not block missiles;
- enemy point defense is the intended missile counter;
- flying projectiles do not persist outside the encounter.

---

# 7. Player laser offense — LOCKED

```text
READY laser + live target
→ choose LEFT / CENTER / RIGHT
→ Weapons targets
→ laser charges
→ enemy shield may absorb
→ otherwise enemy hull takes damage
→ cooldown
```

Rules:

- laser shield interaction is zone-based;
- a matching enemy shield consumes a charge and blocks the shot;
- missiles and sticky mines do not use this shield interaction;
- target loss or interruption follows the task/weapon lifecycle contract;
- cooldown does not occupy Weapons.

---

# 8. Player sticky-mine offense — LOCKED

One command launches one salvo of separate mines.

Starter baseline:

```text
capacity: 6
salvo size: 3
launch interval: 1000 ms
cooldown: 15000 ms
mine fuse: 7500 ms
mine damage: 1
```

Rules:

- each ready physical dispenser is a separate command identified by its runtime
  `weaponId`;
- execution uses the selected dispenser and never re-selects another ready one;
- each mine has its own fuse and damage;
- damage is cumulative;
- each mine is spent at physical launch;
- a partial final salvo is allowed;
- first mine launches on the first weapon step, including `step(0)`;
- Weapons remains occupied until the final actual launch;
- task is not manually cancellable;
- incoming damage may interrupt the task;
- attached mines continue after interruption;
- unlaunched ammunition is preserved;
- interruption/target loss before first launch returns the dispenser to READY;
- interruption/target loss after any launch starts cooldown;
- cooldown begins after the final actually launched mine;
- no separate flight-domain object exists in V0;
- presentation may show a brief throw/flight;
- each mine immediately becomes attached in the domain and starts its fuse;
- enemy shields do not block sticky mines.

At zero ammunition:

```text
domain phase = READY
presentation status = EMPTY
```

There is no domain `EMPTY` phase.

---

# 9. Player defense — LOCKED

## Point defense

- Weapons selects the beam band;
- charge is spent when aiming begins;
- cancellation, interruption or target loss does not refund the charge;
- only incoming actor-sourced missiles are valid targets;
- point defense does not clear sticky mines or block lasers.

## Directional shield

- Engineer selects LEFT / CENTER / RIGHT;
- matching enemy laser zone is blocked;
- deployment is temporary;
- shield charges regenerate according to generator rules;
- the same shield system does not intercept missiles or sticky mines.

## Sticky-mine clearing

- any allowed officer may clear a mine;
- clear command targets the mine nearest detonation;
- the intended pressure is cycling through available officers;
- clearing an enemy-attached outgoing mine is not a player command.

---

# 10. Enemy information model — LOCKED

The enemy captain/policy does not receive unrestricted combat truth.

```text
objective threat
→ observation
→ Science work
→ report
→ policy decision
```

Definitions:

- objective threat: real projectile, attached mine or charging player weapon;
- observation: the enemy crew can currently notice it;
- report: Science interpretation used by policy.

Rules:

- observation stores stable references, not duplicated hidden parameters;
- Science reports may be false;
- false reports contain no reliability flag;
- policy must treat a report as the available truth;
- sticky mines may be directly observable without Science classification when
  the response does not require hidden type information;
- missing Science or busy Science can delay information and defense;
- policy may react only through crew roles and physically available systems.

---

# 11. Enemy work ownership — LOCKED

The enemy captain policy chooses work.

The scheduler does not invent strategic priorities.

Current grammar:

```text
policy selects intent
→ scheduler validates/starts it
→ crew-task runner owns operator lifecycle
→ weapon/effect runner owns physical lifecycle
```

Different behavior presets may change priorities and timing without replacing
this ownership chain.

Do not implement a behavior tree, utility-AI framework or omniscient scripted
reaction layer for Combat 1.0.

---

# 12. Enemy offensive behavior — CURRENT LOCKED BASELINE

Current prototype uses abstract crew roles:

- WEAPONS serializes missile, laser and sticky-mine attacks;
- SCIENCE may independently operate systems assigned to Science;
- unavailable roles cannot perform their work;
- cooldown does not keep a role occupied;
- a short role-specific delay may follow completed offensive work.

The deterministic offensive rotation is a prototype baseline, not the final
defensive policy grammar.

---

# 13. Enemy destruction — LOCKED

```text
enemy hull reaches zero
→ remaining player attacks targeting it resolve as TARGET_LOST
→ enemy actor is removed from encounter state
→ enemy actor is removed from persistent node state
→ enemy active tasks/weapons stop
→ destruction presentation runs
→ encounter continues
```

Already launched enemy missiles continue.

Already attached enemy sticky mines on the player continue.

Enemy destruction does not automatically end the encounter or move the player
to another scene.

---

# 14. Bridge command UI direction — LOCKED

The final command interaction should minimize search and reading during combat.

Rules:

- officer station shows current task and actionable status signals;
- commands live in a fixed-position icon palette;
- unavailable commands remain in place and become disabled;
- direct commands use one click;
- a second compact choice screen appears only for real choices;
- hover/focus explanation belongs in one dedicated subtitle strip;
- station, command palette, subtitle strip and viewscreen must not duplicate the
  same information.

Information ownership:

```text
station
→ signal and current task

command palette
→ action and availability

subtitle strip
→ explanation

viewscreen/captain desk
→ threat and ship state
```

The existing text menu is temporary and should not receive a deep incremental
redesign before the command-palette pass.

---

# 15. Design-change rule

A `LOCKED` contract may change only after explicit discussion of:

- player-facing reason;
- affected lifecycle;
- persistence consequences;
- officer occupation consequences;
- UI/telegraph consequences;
- required test changes.

Implementation convenience alone is not a gameplay reason.
