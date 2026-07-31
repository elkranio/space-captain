# Space Captain — Backlog

Deferred implementation work, design debts and reminders.

This file is not the active sprint plan.

An item should move into active implementation only after it is selected explicitly.

Keep items concrete enough that they remain understandable in a future chat.

Last updated: 2026-07-31

---

# 1. Near-term combat debts

## Spam officer-task slowdown modifier

The initial Spam Projector weapon channels its attack but does not yet slow officer work.

Future contract:

- while at least one hostile spam channel is active, officer task progress is multiplied by a slowdown coefficient;
- apply the coefficient to elapsed progress instead of mutating task `durationMs`;
- the coefficient belongs to the Spam Projector definition;
- integrate this through the future task/modifier system instead of hard-coding spam inside `OfficerTaskRunner`;
- decide explicit stacking behavior before supporting several simultaneous spam channels.

Do not add an unused coefficient field before the modifier path exists.

---

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

The current executor validates availability before calling the handler, but the contract should eventually be locked by a focused test.

Not urgent because current typecheck, tests and runtime behavior are green.

---

## Point-defense cancellation UI

Engine task cancellation exists, but the player-facing cancellation flow is not yet designed.

Required contract is already decided:

```text
cancelled PD AIM
→ spent charge is not refunded
```

Need later:

- how the player selects an active task;
- whether all officer tasks can be cancelled;
- which tasks are non-cancellable;
- officer feedback after cancellation;
- keyboard/gamepad interaction;
- prevention of accidental cancellation.

Do not build a generic cancellation framework before the UI interaction is designed.

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

# 2. Missile and threat system

## Launcher identification persistence

Current Science identification applies to one active projectile.

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

This should compete with missile identification for Science time.

Avoid turning the result into a large spreadsheet.

---

## Multiple simultaneous missiles

Current combat philosophy prefers few readable threats.

Later tests should explore:

- two missiles with different time-to-impact;
- different spectral bands;
- one Science officer;
- one Weapons officer;
- limited point-defense charges;
- prioritization under time pressure.

Do not scale to large missile swarms.

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

# 3. Player defensive systems

## Helm evade fallback

When point defense is unavailable, Helm may later attempt an evade.

Possible characteristics:

- lower success chance than the correct point-defense beam;
- consumes Helm time;
- may change impact damage rather than fully avoid it;
- effectiveness may depend on engine state;
- should not become direct arcade steering.

No contract is currently locked.

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

## Directional shields

Future beam-threat counter.

The enemy beam asks a different defensive question than missiles:

```text
where should the ship defend?
```

Possible system:

- shield can protect one sector;
- enemy telegraphs firing direction;
- player assigns an officer/system before impact;
- shield positioning competes with other bridge work.

Do not implement before missile combat is stable.

---

# 4. Player offense

## Player weapon commands

The current vertical slice begins with enemy attack.

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
- beam weapon;
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

# 5. Ship damage and escape

## Engine disabled at combat start

Design idea:

The obsolete player ship may have its engine knocked out early in a fight.

Consequences:

- Engineer must repair it before escape;
- player may remain and fight instead;
- escape becomes a timed strategic option;
- the captain dashboard can show engine state.

Not implemented.

---

## Repair tasks

Engineer needs meaningful timed tasks.

Possible tasks:

- repair engine;
- restore shield system;
- stabilize hull;
- restore sensors;
- accelerate point-defense recharge outside combat.

Need prioritization and visible consequences.

Avoid generic health-bar healing with no bridge decision.

---

## Damage beyond hull

Current player damage model is hull only.

Possible later states:

- system disabled;
- reduced task speed;
- officer injured;
- console unavailable;
- temporary bridge hazard.

Add only when each state creates a meaningful command decision.

---

# 6. Ship status presentation

## Temporary status panel replacement

Current top-center panel displays:

```text
HULL
PD
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
- possibly shield sector;
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

# 7. Command UI

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

- persistent missile indicators;
- direct threat selection;
- reopening the last relevant officer menu;
- keyboard shortcuts;
- visual link from threat to available counter.

Avoid repeatedly reopening deep context menus.

---

## Command-menu polling test

The open officer menu polls available commands approximately every 200 ms.

Add or maintain regression coverage for cases such as:

- Science creates a jump point while Helm menu is open;
- a missile appears while Science/Weapons menu is open;
- point-defense charges reach zero while Weapons menu is open;
- an officer task finishes while the menu is open.

---

# 8. Encounter and navigation polish

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

- missile loadouts;
- launcher loadouts;
- enemy combat archetypes;
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

# 9. Test and architecture debts

## Persistence across encounter recreation

Add focused coverage proving that:

- spent point-defense charges persist in `GameRuntime`;
- recreating `EncounterEngine` receives the current persistent value;
- leaving/re-entering the bridge does not restore charges accidentally.

Current runtime flow appears correct, but a dedicated persistence regression test would protect the resource contract.

---

## Shared player ship status mapper

`BridgeController` and `BridgeEncounterEngineEventHandler` both construct the full player ship status payload.

A shared mapper/helper may become useful after more resources are added.

Do not extract it yet unless duplication grows or fields begin drifting.

---

## Encounter/runtime resource synchronization

Point-defense state intentionally exists in:

- persistent player ship state;
- encounter snapshot.

The encounter is authoritative while running.

Synchronization currently occurs through domain events.

When adding new mutable persistent combat resources, preserve this direction and avoid per-frame synchronization.

---

## Event naming review

Current event:

```text
PLAYER_POINT_DEFENSE_CHARGE_SPENT
```

is explicit and correct for the current behavior.

If many player-resource events appear later, consider whether a more general resource snapshot event is justified.

Do not generalize based on one resource.

---

# 10. Larger future systems

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

# 11. Design risks to keep visible

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
- multiple threats;
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
- charge-spend feedback.

---

# 12. Backlog maintenance

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
