# Space Captain — Backlog

Deferred implementation work, design debts and reminders.

This file is not automatically the active sprint plan.

An item moves into active implementation only after it is selected explicitly.

Keep items concrete enough that they remain understandable in a future chat.

Last updated: 2026-07-31

---

# 1. Next selected work: cognitive refactor pass

The next development chat should begin with an audit, not an implementation script.

The purpose is:

```text
make the code easier to hold in working memory
```

The target is not maximum abstraction.

The target is:

- obvious ownership;
- obvious data flow;
- fewer unnecessary file jumps;
- fewer places that must change together;
- explicit, boring code;
- removal of accidental spaghetti.

## Audit procedure

Before proposing changes:

1. Read fresh `master`.
2. Read `PROJECT_CONTEXT.md`.
3. Read this file.
4. Inspect the actual current files.
5. Do not treat refactor ideas from the previous chat as verified facts.
6. Produce a short list of concrete problems with file-level evidence.
7. Agree on the order of atoms before editing.

Audit these areas:

### Mutable state ownership

Identify:

- which class owns each mutable encounter value;
- which class is allowed to mutate persistent runtime state;
- whether the same state is synchronized from more than one app class;
- whether any view or controller bypasses the intended owner.

The desired direction remains:

```text
engine mutation
→ encounter event
→ app/runtime synchronization
→ bridge presentation event
```

Do not force this shape where a synchronous completion callback is simpler and already clear.

### `EncounterEngine` ↔ `GameRuntime` synchronization

Verify whether runtime synchronization is split between:

- `BridgeEncounterController`;
- `BridgeEncounterEngineEventHandler`;
- any other integration class.

Look specifically at:

- navigation;
- drive;
- point-defense charges;
- shield-generator state;
- hull;
- newly created persistent anchors.

Do not introduce a new synchronizer class unless it clearly reduces the number of owners and file jumps.

### `BridgeEncounterController`

Check whether it currently owns too many unrelated responsibilities:

- bridge input;
- encounter lifecycle;
- runtime persistence;
- snapshot polling;
- scene transitions;
- presentation callbacks.

Possible outcomes include:

- moving one coherent responsibility out;
- introducing one small helper;
- leaving the class intact if splitting would create more jumps.

File size alone is not evidence.

### New-game startup data

Inspect:

- `create_new_run_state.ts`;
- `create_new_game_player.ts`;
- `NewGameUniverseFactory.ts`;
- relevant presets/catalogs.

Find genuinely scattered choices such as:

- selected starter ship preset;
- selected starting location;
- starting officers;
- persistent system instance IDs;
- selected enemy/node actor preset.

Centralize only top-level startup choices.

Do not move all universe geometry into one giant configuration object.

Also verify whether the same station state object is intentionally reused in more than one node.

### `EncounterEngine` facade

Check whether `EncounterEngine` contains domain work that belongs in:

- a pure query;
- an existing runner;
- officer-task logic;
- combat logic.

Likely audit candidates:

- laser threat snapshot construction;
- random task interruption;
- cloning helpers.

Do not make the engine indirect merely to reduce line count.

Keep the explicit subsystem `step()` order visible.

### `CombatRunner`

`CombatRunner` is large, but that alone is not a problem.

Do not split missile, laser and spam logic automatically.

Split only when there is a concrete gain such as:

- one subsystem can own a complete lifecycle;
- dependencies become fewer;
- shared weapon-phase rules stay readable;
- tests become more local;
- adding a new weapon no longer requires touching unrelated sections.

Avoid replacing one long linear file with a graph of tiny runners.

### `EncounterStateStore`

Keep one authoritative mutable encounter state owner unless the audit proves a real ownership conflict.

Do not split it into several stores merely because it is long.

Its current regional organization may be cognitively cheaper than multiple cross-store calls.

Potential cleanup is still allowed:

- clearer method names;
- local helper extraction;
- removal of duplicate lookup/validation code;
- moving static content creation out when it is truly content rather than mutation.

### Views and VFX ownership

Inspect whether root views have started accumulating complete child-effect implementations.

Candidate:

```text
BridgeVfxView
```

A split is justified when each child owns:

- its objects;
- its tweens;
- its event subscription;
- its cleanup.

Do not create child classes for effects that remain only a few obvious lines.

### Test fixtures

Find repeated full payloads that fail whenever one field is added.

Current candidate:

```text
PLAYER_SHIP_STATUS_UPDATED
```

A focused fixture/builder is justified if it:

- provides explicit starter defaults;
- lets tests override only the relevant value;
- remains easier to read than handwritten payloads.

Do not create a universal test-data framework.

### Cleanup pass

After structural atoms are done, perform a final narrow cleanup:

- obsolete comments;
- comments describing already completed future work;
- double blank lines left by scripts;
- unused imports;
- dead helpers;
- inconsistent naming;
- duplicated error construction where a tiny local helper is clearer.

Do not mix this cleanup into behavior-changing atoms unless required.

## Refactor rules

Every refactor atom must:

- preserve gameplay behavior;
- have a single cognitive goal;
- include focused tests when behavior ownership moves;
- pass typecheck;
- pass tests;
- pass runtime smoke when app flow changes;
- be pushed and re-read before the next atom.

Prefer:

```text
one obvious owner
```

over:

```text
several flexible collaborators
```

Prefer:

```text
explicit sequence
```

over:

```text
generic registry / pipeline / effect graph
```

Prefer:

```text
small duplication that keeps behavior local
```

over:

```text
abstraction that forces constant jumping
```

## Refactor non-goals

Do not introduce during this pass:

- entity-component systems;
- generic resource frameworks;
- generic effect graphs;
- dependency injection containers;
- event-sourcing architecture;
- universal command scripting;
- speculative save migration;
- generalized modifier frameworks;
- large folder reorganizations without behavior-level benefit.

---

# 2. Near-term combat debts

## Actual BLUE missile content

Status:

```text
Not implemented
```

Current state:

- missile spectral bands support RED and BLUE;
- point defense supports RED BEAM and BLUE BEAM;
- existing missile content is RED;
- BLUE BEAM is currently always a miss.

Need to decide:

- separate missile definition;
- sprite reuse versus separate sprite;
- launcher loadout;
- deterministic or random band selection;
- test control over selection;
- encounter content demonstrating both bands.

---

## Rejected point-defense command regression test

Add an explicit engine regression test proving that a rejected or stale point-defense command does not spend a charge.

Potential cases:

- command submitted with zero charges;
- target no longer exists when command is submitted;
- Weapons is already busy;
- command target does not match an available command.

The executor currently validates availability before calling the handler, but the resource contract deserves one focused regression test.

---

## Zero-charge player feedback

At zero charges the point-defense commands currently disappear.

Consider whether the final UI should instead provide stronger feedback:

- disabled command with `NO CHARGES`;
- Weapons bark;
- red/empty resource indicator;
- alert when the last charge is spent.

Do not add this until the command-menu UX direction is clearer.

---

## Point-defense replenishment

Current combat contract:

```text
no recharge during combat
```

Future replenishment possibilities:

- docking service;
- station purchase;
- Engineering recharge outside combat;
- consumable capacitor packs;
- automatic refill between prototype encounters.

Lore direction:

Point-defense charges are charged pulse capacitors rather than physical ammunition.

Need to decide where persistence and replenishment rules live.

---

## Which enemies have an opening disruption pulse

Current prototype behavior gives the opening pulse to hostile encounter ships through engagement logic.

Future content should decide whether the pulse belongs to:

- every hostile ship;
- a ship definition capability;
- a specific installed system;
- selected encounter presets;
- scripted encounter openings.

Do not leave universal pulse behavior accidental once enemy variety appears.

The one-shot-per-source encounter rule can remain even if capability becomes content-driven.

---

## Opening pulse presentation polish

Current effect is intentionally simple:

- violet additive flash;
- horizontal interference band;
- no camera shake.

Possible later polish:

- sound effect;
- bridge light flicker;
- slightly more irregular static;
- clearer timing before `ENGINE` turns red;
- source-direction hint only if it helps gameplay.

Avoid making it look like physical hull impact.

---

# 3. Missile and threat system

## Launcher identification persistence

Current Science identification applies to one active threat.

Future direction:

- identify an enemy launcher;
- later missiles from the same launcher become known automatically;
- launcher knowledge may persist for the encounter;
- possibly persist after previous encounters with the same faction or ship type.

Need a clear distinction between:

- projectile identification;
- launcher identification;
- enemy ship analysis;
- faction knowledge.

---

## Science: Analyze Enemy

After basic threat identification, Science should have other meaningful work.

Possible outputs:

- enemy weapon type;
- launcher spectral behavior;
- cooldown estimate;
- weak system;
- possible critical target;
- uncertain versus confirmed information.

This should compete with threat identification and spam purging for Science time.

Avoid turning the result into a large spreadsheet.

---

## Multiple simultaneous threats

Current combat philosophy prefers few readable threats.

Later tests should explore:

- missile plus laser;
- missile plus spam;
- two missiles with different time-to-impact;
- different spectral bands;
- one Science officer;
- one Weapons officer;
- one Engineer;
- limited defensive resources.

Do not scale to large swarms.

The intended question is:

```text
Which threat do I spend time and resources on?
```

not:

```text
Can I click fast enough?
```

---

## Missile HUD polish

Current HUD is functional.

Possible polish:

- clearer identified/unknown state;
- color treatment for RED/BLUE;
- stronger time-to-impact urgency;
- more readable bracket frame;
- better scaling at small missile sizes;
- clear destroyed/missed feedback;
- avoid the HUD competing with the missile sprite.

---

## Incoming missile movement polish

Current movement uses step-based growth and imperfect drift.

Potential improvements:

- hand-authored drift patterns;
- clearer depth progression;
- better final approach;
- no smooth modern tween look;
- maintain approximately 12 fps retro motion;
- prevent missile movement from covering important UI.

---

# 4. Player defensive systems

## Helm evade fallback

Future EVADE should use maneuvering thrusters rather than the main drive.

Therefore:

```text
main drive DISABLED
≠ EVADE unavailable
```

Possible outcome model:

```text
MISS
GLANCING
DIRECT
```

Possible characteristics:

- lower reliability than the exact counter;
- consumes Helm time;
- may reduce damage rather than fully avoid it;
- may depend on maneuvering-thruster condition;
- should not become direct arcade steering.

No final contract is locked.

---

## Maneuvering-thruster system

If EVADE is implemented, decide whether maneuvering thrusters are:

- always available baseline hardware;
- a persistent ship system with state;
- damageable;
- repairable;
- limited by charges/heat;
- represented separately from the main drive.

Do not introduce the system before EVADE needs it.

---

## Shield decisions beyond one laser

Directional shields are implemented for one active zone.

Future questions:

- can several laser threats overlap;
- can the shield be redeployed while active;
- does redeployment consume another charge;
- should Science identification reveal zone early enough;
- should some lasers penetrate or overload shields;
- how shield choice competes with drive repair and other Engineer work.

Keep the system readable.

---

## Universal countermeasure technology

Lore/design idea:

The old player ship may possess unusual universal countermeasure hardware.

Possible consequences:

- player can eventually load different countermeasure programs;
- some enemy factions lack counters for certain missile types;
- trading posts can reprogram launcher/countermeasure firmware;
- changing configuration may take time;
- currently loaded supplies may be sold or replaced.

This belongs after the basic combat loop proves fun.

---

# 5. Player offense

## Player weapon commands

Player offensive actions are not yet implemented.

Potential loop:

- Weapons prepares attack;
- Science analyzes enemy;
- identified weak points enable better attacks;
- attacking competes with point defense for Weapons time;
- limited resources prevent automatic firing.

Avoid conventional cooldown-button combat with no officer decisions.

---

## Enemy subsystem damage

Possible future targets:

- missile launcher;
- laser;
- spam projector;
- engines;
- shields;
- sensors;
- communications.

Subsystem damage should create understandable tactical consequences.

Avoid a large simulation with many hidden percentages.

---

## Critical hits and Science knowledge

Science analysis may unlock:

- named weak point;
- increased hit probability;
- higher damage;
- disabling a specific system.

The player should make a visible command decision based on the information.

---

# 6. Ship damage, repair and escape

## Repair tasks beyond the main drive

`REPAIR ENGINE` is implemented.

Future Engineer work may include:

- restore shield generator;
- stabilize hull;
- restore sensors;
- restore maneuvering thrusters;
- clear bridge hazards;
- accelerate point-defense recharge outside combat.

Each repair must create a visible decision and compete for Engineer time.

Avoid generic health-bar healing.

---

## Escape flow

The main drive can now be disabled and repaired, but a complete escape flow is not implemented.

Need to decide:

- which command initiates escape;
- whether jump or FLY TO is the escape action;
- whether an enemy can interrupt escape preparation;
- how encounter victory/escape is resolved;
- whether enemies can pursue into the next node.

---

## Damage beyond hull

Current direct damage model still mainly resolves into hull loss plus task interruption.

Possible later states:

- system disabled;
- reduced task speed;
- officer injured;
- console unavailable;
- temporary bridge hazard.

Add only when each state creates a meaningful command decision.

---

# 7. Ship status presentation

## Temporary status panel replacement

Current top-center panel displays:

```text
HULL
PD
SHD
ENGINE
```

It is intentionally temporary.

Long-term presentation candidates:

- captain's physical table;
- bridge console indicators;
- Weapons station resource display;
- Engineer station ship-damage display;
- warning lamps;
- diegetic gauges.

Do not remove the temporary panel until the replacement communicates the same information reliably.

---

## Captain dashboard

Long-term scene idea:

- player seen from behind in captain chair;
- physical command table rather than a flat modern screen;
- attack warning lamp;
- hull state;
- engine state;
- point-defense charge count;
- shield-generator charges;
- possibly active shield zone;
- important ship-wide alerts.

Visual design should remain Sierra-style and readable.

---

## Living officers at stations

Current officer presentation is still prototype-oriented.

Long-term goals:

- officers visibly occupy stations;
- activity reflected through animation/state;
- stress, injury and personality visible;
- station UI remains readable over character presentation;
- officer reactions provide feedback without excessive text.

---

# 8. Command UI

## Keyboard officer shortcuts

Planned mapping:

```text
1–5
```

Each key should select/open the corresponding officer station.

Need:

- stable role order;
- input blocking during transitions;
- menu close behavior;
- visible focus;
- compatibility with text/debug input.

---

## Gamepad support

Officer-command navigation should be designed for:

- directional selection;
- confirm;
- cancel;
- switching officers;
- selecting grouped targets;
- active task cancellation.

Avoid UI interactions requiring precise mouse positioning.

---

## Persistent threat access

The player should be able to reach critical threat actions in one or two decisions.

Potential improvements:

- persistent missile/laser indicators;
- direct threat selection;
- reopening the last relevant officer menu;
- keyboard shortcuts;
- visual link from threat to available counter.

Avoid repeatedly reopening deep context menus.

---

## Command-menu polling regression coverage

The open officer menu polls available commands approximately every 200 ms.

Maintain regression coverage for cases such as:

- Science creates a jump point while Helm menu is open;
- a threat appears while Science/Weapons menu is open;
- point-defense charges reach zero while Weapons menu is open;
- an officer task finishes while the menu is open;
- drive becomes disabled or repaired while Helm/Engineer menus are open;
- spam channel expires while Science menu is open.

---

# 9. Encounter and navigation polish

## Ship sprite scale consistency

Current direction:

- ship sprites should preferably be authored at appropriate display size;
- avoid per-object scaling hacks;
- decide later whether all ships are displayed 1:1;
- perspective/depth scaling should only be introduced if it improves gameplay readability.

Do not add a generalized distance-scaling system prematurely.

---

## Encounter content presets

Continue moving literal encounter configuration into reusable content presets where it reduces duplication.

Candidates:

- mixed missile loadouts;
- enemy combat archetypes;
- disruption-capable ships;
- node actors;
- station encounters;
- combat encounter variants.

Do not create generic factories without at least two real uses.

---

## Travel presentation polish

Potential improvements:

- better transition between rotation and forward movement;
- ship-bracing feedback;
- object parallax;
- dust activation exactly at flight start;
- consistent arrival framing;
- old-engine vibration.

---

# 10. Test and architecture debts

## Persistence across encounter recreation

Maintain focused coverage proving that persistent combat resources survive encounter recreation:

- spent point-defense charges;
- shield-generator charges/regeneration state;
- drive disabled/repaired state;
- navigation rollback after disruption.

Leaving and re-entering the bridge must not restore resources accidentally.

---

## Full player ship status fixture

`PLAYER_SHIP_STATUS_UPDATED` now contains:

- hull;
- drive;
- point defense;
- shield generator.

Several app tests hand-write the same complete payload.

During the cognitive refactor pass, consider a focused test fixture with explicit starter defaults and small overrides.

Do not build a universal fixture framework.

---

## Shared player ship status mapper

`BridgeController` and `BridgeEncounterEngineEventHandler` both construct the full player ship status payload.

The field count has grown enough that drift is now a realistic risk.

During the refactor audit, verify whether one small pure mapper would reduce duplication without hiding the payload.

---

## Encounter/runtime synchronization ownership

Persistent state currently includes:

- navigation;
- hull;
- drive;
- point defense;
- shield generator;
- generated persistent anchors.

The encounter snapshot is authoritative while running.

During the refactor audit, verify that each mutation has one obvious app-side synchronization owner.

Avoid:

- per-frame synchronization;
- views reading runtime;
- controllers and event handlers both owning the same resource;
- broad generic persistence frameworks.

---

## Event naming review

Current explicit events include resource-specific and behavior-specific names such as:

```text
PLAYER_POINT_DEFENSE_CHARGE_SPENT
PLAYER_SHIP_DRIVE_STATE_CHANGED
PLAYER_SHIP_DRIVE_DISRUPTED
```

Keep explicit events while they make behavior clearer.

Only generalize if several events truly share the same contract and consumers.

---

# 11. Larger future systems

## Crew stress and fatigue

Future crew layer:

- officers accumulate stress/fatigue;
- command performance and behavior may change;
- downtime becomes meaningful;
- the captain may choose whom to monitor.

This should create story and decision pressure, not routine stat maintenance.

---

## R&R locations

Content-first future system:

- space resorts;
- stations;
- shore leave;
- several days of downtime;
- captain may rest or monitor one crew member;
- unmonitored officers can trigger absurd but serious consequences.

Example consequences discussed:

- Comms develops alcoholism;
- Engineer insults a species and creates a diplomatic incident;
- Weapons develops a personal vendetta.

Not part of the current combat prototype.

---

## Factions and sector-specific enemies

Future enemy variety may come from:

- faction missile preferences;
- disruption technology;
- missing countermeasure technology;
- different launcher firmware;
- different willingness to retreat;
- social and diplomatic consequences.

Prefer authored faction identity over random stat variation.

---

## Content-driven missions

Possible mission pressures:

- timed delivery;
- limited resupply;
- damaged systems;
- hostile faction territory;
- crew conflict;
- station access restrictions;
- choosing whether to spend rare defensive resources now.

The combat system should support mission context rather than exist as an isolated arena.

---

# 12. Design risks to keep visible

## Menu matching

Primary combat risk:

```text
read RED
→ click RED
```

can become trivial word matching.

Mitigation should come from:

- limited time;
- limited charges;
- competing officer tasks;
- incomplete information;
- multiple threat types;
- offensive opportunities;
- meaningful fallback options.

Do not solve this merely by adding more colors.

---

## Too many simultaneous threats

More objects do not automatically create more depth.

Maintain:

- readable telegraphs;
- enough time to understand;
- small number of consequential decisions;
- clear feedback.

---

## Over-generalization

Do not build:

- universal resource framework;
- generic effect graph;
- highly abstract command scripting;
- large entity-component system;
- speculative save migration;
- generalized targeting framework beyond current needs.

Add abstraction after repeated concrete usage demonstrates the need.

---

## Prototype UI becoming permanent accidentally

Temporary UI should remain clearly identified as temporary.

Before removing it, ensure the diegetic replacement preserves:

- readability;
- update timing;
- current/max values;
- damage feedback;
- charge-spend feedback;
- drive-disabled feedback;
- shield state feedback.

---

# 13. Backlog maintenance

At the end of each development chat:

- add newly discovered deferred work;
- remove completed items;
- update items whose design contract changed;
- avoid duplicating the active checkpoint from `PROJECT_CONTEXT.md`;
- keep speculative ideas in the larger-future sections;
- keep near-term concrete debts near the top.

When selecting the next task:

1. read `PROJECT_CONTEXT.md`;
2. read this file;
3. inspect fresh `master`;
4. choose one coherent atom;
5. do not opportunistically fix unrelated backlog items.
