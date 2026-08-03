# Space Captain — Backlog

Deferred implementation work, design debts and reminders.

This file is not automatically the active sprint plan.

An item moves into active implementation only after it is selected explicitly.

Keep items concrete enough that they remain understandable in a future chat.

Last updated: 2026-08-03

---

# 1. Current selected work

Current selected slice:

```text
COMBAT STICKY-MINE LIFECYCLE EXTRACTION
```

Bridge V0.1 migration is complete and runtime-accepted:

- Comms/HAIL/request-docking cut;
- direct Helm `DOCK` at the current station;
- bridge shell and viewscreen geometry;
- four modular station/officer views with stable role hit areas;
- task label and optional progress on station monitors;
- touch-panel work pulses;
- mirrored `off / ready / busy / blocked` lights;
- readable role abbreviations on officer backs;
- removal of the obsolete old seat presentation and its station assets.

Combat action hints are runtime-accepted for the current V0.1 presentation.
Text density and a possible future icon replacement remain polish work, not a
blocker.

Implemented across the two snapshot refactor atoms:

- extracted `BridgeEncounterSnapshotSynchronizer` from
  `BridgeEncounterController`;
- centralized app-side collection and mapping of continuously changing combat
  read models;
- kept player-weapon snapshot persistence beside its bridge-status projection;
- kept navigation synchronization in explicit encounter lifecycle methods;
- preserved frame order: engine step → weapon sync → domain events → combat
  snapshots → station poll;
- added a transport-contract test for initial and per-frame snapshot mapping.
- added state-bound `EncounterSnapshotReader` without cached or duplicate state;
- centralized recursively detached app-facing engine reads;
- made encounter outbox detachment an invariant at `emit` time;
- removed duplicated projectile / mine / laser clone methods;
- made `ENCOUNTER_LOADED` and nested missile payloads stable snapshots;
- replaced tests' accidental mutable event dependency with one explicit
  test-only state handle;
- preserved gameplay rules, step order and persistence ownership.

Implemented in the previous refactor atom:

- identified `CombatRunner` as the first remaining production god-object;
- extracted queued player launches, player/enemy projectile creation, flight,
  impact, target loss and actor-target cleanup into `CombatMissileRunner`;
- kept enemy launcher targeting/cooldown and the top-level combat phase order in
  `CombatRunner`;
- centralized transient combat IDs and the mixed `M1 / L2 / M3` designation
  sequence in one encounter-local `CombatRuntimeIdentityFactory`;
- preserved the public `EncounterEngine` API and all gameplay behavior;
- added a focused identity-sequence regression test.

Implemented in the previous refactor atom:

- extracted queued player attachments, enemy dispenser phases, active fuses,
  detonation, target loss and actor-target cleanup into
  `CombatStickyMineRunner`;
- moved sticky-mine `TARGETING / DISPENSING / COOLDOWN` details out of the
  shared weapon-phase dispatcher;
- kept the locked top-level combat step order and public `EncounterEngine` API
  unchanged;
- preserved the existing mine contract suites for salvo catch-up, cooldown,
  interruption, same-step integration and target-loss cleanup.

Implemented in the previous refactor atom:

- extracted enemy laser targeting, charging, threat creation, shield/hull
  resolution, damage interruption and cooldown into `CombatLaserRunner`;
- kept player laser execution in `PlayerWeaponRunner`;
- preserved the shared combat phase order, mixed threat designation sequence
  and public `EncounterEngine` API;
- kept all laser timing, shield, damage and interruption contracts unchanged.

Implemented in the current refactor atom:

- extracted enemy targeting, channel start/timing, expiry, purge and cooldown
  into `CombatSpamRunner`;
- moved the now-unshared enemy missile targeting/cooldown phases into
  `CombatMissileRunner`;
- reduced `CombatRunner` to locked step order, concrete-family dispatch and
  explicit cross-system synchronization;
- preserved spam timing, purge, task-performance and task-cancellation
  contracts;
- kept the runners concrete; no generic attack-runner hierarchy was added.

Next gameplay slice:

- return to enemy defensive behavior;
- first candidate: enemy point defense against a player missile;
- keep the Engineer directional-shield response as the following slice;
- do not combine both defenses into one implementation atom.

Accepted combat action-hint contract:

- show hints only during active combat;
- show hints only when the officer is free;
- derive hints from commands that are actually available now;
- display at most two short text lines on the idle monitor;
- use one centralized fixed-priority table;
- hide hints when a task starts and restore the latest snapshot when it clears;
- keep the current command menu unchanged;
- do not add selected-station treatment in this atom.

Locked V0.1 copy:

```text
SCI
> ANALYZE THREAT
> PURGE SPAM
> CLEAR MINE

ENG
> REPAIR DRIVE
> RAISE SHIELD
> CLEAR MINE

HELM
> ESCAPE
> CLEAR MINE

WPN
> ATTACK ENEMY
> INTERCEPT MISSILE
> CLEAR MINE
```

If more than two actions are available, choose by fixed urgency rather than
command-menu order. Defensive response to an active threat comes before cleanup,
repair, offense and escape.

After snapshot cleanup, return to enemy behavior and explicitly choose either
enemy point defense or the enemy Engineer directional-shield response.

`BRIDGE_V01_HANDOFF.md` remains as the completed migration reference.

---

# 2. Near-term combat follow-ups

## Enemy behavior policy pass — deferred until bridge V0.1 is playable

Player laser, missile and sticky-mine offense V0 are complete.

The active pass must decide how behavior presets choose work while crew roles remain constrained operators.

Candidate first vertical slices:

- enemy point defense against a player missile;
- enemy Engineer choosing a directional shield response to a player laser;
- a clear aggressive-versus-cautious priority difference using existing offense;
- deliberate failure or delay when the required defensive role is occupied.

The important rule is:

```text
enemy captain = policy
enemy crew roles = constrained operators
```

Implementation constraints:

- keep policy separate from weapon execution;
- keep role occupancy visible and consequential;
- do not hardcode a reaction inside player weapon code;
- do not build a generic utility-AI framework;
- preserve one command-capable enemy ship as the default combat read.

---

## Restore enemy SCIENCE / spam in the development encounter

The development enemy currently removes SCIENCE from local crew roles.

The Spam Projector remains installed but cannot operate.

Player missile runtime acceptance is complete. Restore SCIENCE when combined combat pressure becomes the selected task.

Then verify combined pressure:

- WEAPONS rotates missile / laser / sticky mines;
- SCIENCE can channel spam in parallel;
- player offensive commands compete with defensive work;
- enemy destruction clears spam and active hostile control state.

Do not rebalance timings before the complete loop can be played.

---

## Runtime verification of player weapon persistence

Automated tests cover persistent weapon state.

A manual runtime check remains deferred:

```text
fire a player weapon
→ reconstruct or re-enter Bridge during cooldown
→ weapon must not reset to READY
```

This is awkward to trigger and does not block the next selected work.

Perform it during a broader combat acceptance pass.

---

## Player laser TARGETING presentation

Current visible charge presentation begins at `CHARGING`.

The first 3000 ms `TARGETING` phase is communicated mainly through the Weapons task.

Possible improvement:

- subtle mount movement;
- targeting light;
- reticle lock;
- low-intensity pre-charge effect.

Keep this separate from the active enemy behavior pass.

---

## Player sticky-mine presentation and balance polish

Player sticky-mine offense V0 is complete.

Deferred presentation work:

- tune outgoing mine placement around the enemy sprite;
- optional launch flash at the player dispenser source;
- clearer detonation/hull-impact flash;
- target-lost disappearance effect;
- final captain-desk ammo/phase display for the dispenser.

Deferred balance work:

- enemy hull used for broader combat acceptance;
- salvo size / interval / fuse / cooldown tuning only after enemy behaviors can respond;
- resupply contract for finite mine ammunition.

Locked current baseline:

```text
capacity 6
salvo 3
interval 1000 ms
cooldown 15000 ms
fuse 7500 ms
damage 1
```

Do not reopen the completed mine lifecycle while doing presentation or balance.

---

# 3. Missile and threat system

## Actual BLUE missile content

Status:

```text
Not implemented
```

Current state:

- spectral bands support RED and BLUE;
- point defense supports RED BEAM and BLUE BEAM;
- current missile content used in prototype encounters is RED;
- starter player launcher is also RED.

Need to decide:

- separate missile definition;
- sprite reuse versus separate sprite;
- launcher loadouts;
- authored faction preference;
- deterministic versus selected/random loadout;
- how tests control missile band;
- whether prototype encounters deliberately demonstrate both bands.

Do not add BLUE only to make the menu symmetric without a content purpose.

---

## Launcher identification persistence

Current Science identification applies to one active threat.

Future direction:

- identify an enemy launcher;
- later missiles from the same launcher become known automatically;
- encounter-local launcher knowledge;
- possible long-term faction/ship knowledge later.

Keep separate concepts:

- projectile identification;
- launcher identification;
- enemy ship analysis;
- faction knowledge.

---

## Science: Analyze Enemy

After basic threat identification, Science should have meaningful offensive work.

Possible outputs:

- enemy weapon type;
- shield capability;
- launcher behavior;
- cooldown estimate;
- weak system;
- possible critical target;
- uncertain versus confirmed information.

This should compete with:

- threat identification;
- spam purging;
- other Science tasks.

Avoid turning enemy telemetry into a spreadsheet.

---

## Multiple simultaneous missiles

Future tests should explore:

- two missiles with different time-to-impact;
- different spectral bands;
- one Science officer;
- one Weapons officer;
- limited point-defense charges;
- an offensive opportunity competing with defense.

Do not scale toward swarms.

The intended decision is prioritization, not click speed.

---

## Player missile ammunition and resupply

The starter launcher currently begins full.

No resupply contract is defined.

Possible future sources:

- docking service;
- station purchase;
- mission-issued ammunition;
- cargo conversion;
- rare salvaged missiles.

Need to decide:

- whether ammo persists across all encounters;
- whether a run can become permanently missile-empty;
- how the final captain desk displays ammo;
- whether loaded missile type can be changed outside combat.

Do not add automatic refill unless prototype testing requires it explicitly.

---

## Player missile presentation polish

Status:

- dedicated incoming and outgoing missile sprites are implemented;
- manifest IDs are explicit;
- outgoing flight and perspective scaling are implemented;
- direct hull impact is runtime-verified;
- weapon ammunition and cooldown state are visible.

Deferred polish:

- launch flash at the player weapon source;
- short hull-impact flash;
- target-lost disappearance/self-destruction effect;
- optional tuning of flight path, scale curve and timing.

Locked rule:

```text
player missile impact has no shield-block presentation
```

Enemy shields do not interact with missiles.

Do not reopen the completed missile slice merely to add these effects. Select them as a presentation atom later.

---

# 4. Enemy combat behavior

## Enemy Engineer directional shields

Future contract:

```text
player laser telegraph reveals target sector
→ enemy policy checks Engineer availability
→ Engineer may deploy shield to a chosen sector
```

Questions:

- does the enemy know the exact sector immediately;
- can policy intentionally guess wrong;
- is shield deployment a timed officer task;
- how many shield charges does the enemy have;
- does defense compete with repairs;
- how is the decision exposed in telemetry.

Implement during the enemy defense behavior pass, not as a hardcoded reaction in player laser code.

---

## Enemy point defense

Player missiles currently have no enemy counter.

Later decisions:

- which enemies have point defense;
- finite charges or cooldown-only;
- exact versus probabilistic interception;
- whether Science analysis reveals capability;
- how point defense occupies enemy Weapons or another role;
- whether some factions cannot counter certain missile types.

Do not mirror the player RED/BLUE command system automatically.

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

Subsystem damage must create visible command consequences.

Avoid many hidden percentages.

---

## Retreat and surrender

Enemy destruction is implemented.

Future alternatives may include:

- retreat preparation;
- disabled-but-alive ship;
- surrender;
- boarding or salvage;
- mission requirement to avoid destruction.

These need authored encounter consequences before implementation.

---

## Opening disruption capability

Current prototype hostile engagement can trigger the opening disruption pulse.

Future content should decide whether the pulse belongs to:

- every hostile ship;
- a ship capability;
- an installed system;
- selected presets;
- scripted encounter openings.

Do not leave universal pulse behavior accidental once enemy variety expands.

---

# 5. Player offense beyond basic laser/missile

## Science-enabled critical attacks

Science analysis may unlock:

- named weak point;
- increased damage;
- disabling a system;
- improved hit result;
- a special target choice.

The player should make an explicit command decision based on the information.

Avoid passive percentage buffs with no visible choice.

---

## Further offensive weapon beyond laser / missile / sticky mines

Sticky mines now provide the third distinct player offense.

Any later fourth weapon must create a new officer/resource decision rather than another reskinned cooldown attack.

This is not near-term work.

---

## Friendly-fire and collateral consequences

Possible mission pressure:

- target near a station;
- cargo/VIP aboard enemy;
- capture requirement;
- civilian ship misidentification.

Do not add until missions need it.

---

# 6. Player defensive systems

## Rejected point-defense command regression

Add a focused engine test proving rejected or stale commands do not spend a charge.

Candidate cases:

- zero charges;
- target removed before execution;
- Weapons already busy;
- command no longer appears in availability.

Current executor validates availability before the handler, but the resource contract deserves explicit coverage.

---

## Zero-charge point-defense feedback

At zero charges, point-defense commands disappear.

Possible final feedback:

- disabled command with `NO CHARGES`;
- Weapons bark;
- empty/red resource indicator;
- warning when the last charge is spent.

Wait for the final command-menu/captain-desk UX direction.

---

## Point-defense replenishment

Current rule:

```text
no recharge during combat
```

Lore direction:

Point-defense charges are pulse capacitors rather than physical ammunition.

Possible replenishment:

- docking service;
- Engineering recharge outside combat;
- consumable capacitor pack;
- automatic prototype refill between missions.

---

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

No final contract is locked.

---

## Maneuvering-thruster system

Only introduce persistent maneuvering-thruster state if EVADE or damage rules need it.

Do not add it speculatively.

---

# 7. Ship damage, repair and escape

## Repair tasks beyond the main drive

`REPAIR ENGINE` is implemented.

Future Engineer work may include:

- restore shield generator;
- stabilize hull;
- restore sensors;
- restore maneuvering thrusters;
- clear bridge hazards;
- accelerate resource recovery outside combat.

Each repair should create a visible decision and compete for Engineer time.

Avoid generic health-bar healing.

---

## Escape flow

A complete escape flow is not implemented.

Need to decide:

- which command initiates escape;
- whether FLY TO or JUMP acts as escape;
- whether enemy attacks interrupt preparation;
- whether pursuit continues into another node;
- how victory/escape is recorded.

---

## Damage beyond hull

Possible future consequences:

- system disabled;
- reduced task speed;
- officer injured;
- console unavailable;
- temporary bridge hazard;
- cargo/VIP damage.

Add only when the state creates a meaningful command decision.

---

# 8. Ship status and telemetry presentation

## Captain dashboard

Long-term direction:

- captain seen from behind;
- physical desk/dashboard integrated into the bridge;
- hull;
- point-defense charges;
- shield charges;
- engine state;
- weapon/ammunition state;
- attack warning lamps;
- one enemy telemetry screen.

The current flat status and enemy telemetry panels are temporary.

Do not remove them until the diegetic replacement preserves timing and readability.

---

## Enemy telemetry ownership

Enemy telemetry currently supports the player offense prototype.

Future questions:

- what Science must reveal;
- which values are always known;
- how shield/hull changes animate;
- how subsystem damage is represented;
- how destroyed/retreating state clears;
- whether telemetry remains readable with one enemy only.

Avoid floating HP bars over ordinary ships.

---

## Living officers at stations

Long-term goals:

- officers physically occupy stations;
- activity reflected in animation/state;
- stress, injury and personality are visible;
- station UI remains readable;
- reactions provide feedback without text spam.

---

# 9. Command UI

## Combat command palette redesign

This work follows the enemy behavior pass.

Agreed direction:

- officer station = where to look;
- command palette = what can be done;
- bottom subtitle strip = explanation;
- viewscreen/captain desk = threats and general ship state.

Station layer:

- show the current task/progress;
- show small persistent actionable lights;
- Weapons should distinguish offense availability from point-defense availability;
- threat-blocked and generally unavailable states must read differently.

Command palette:

- fixed icon positions, preferably one horizontal row;
- unavailable commands remain visible but disabled;
- commands never disappear or reorder merely because state changed;
- direct commands use one click;
- a second compact screen appears only for a real choice such as laser sector or point-defense band;
- multiple physical launchers remain separate icons with their own ammo/cooldown;
- hover/focus writes a short explanation into the dedicated bottom strip;
- two decisions are acceptable; menu hunting is not.

Timing to test after the UI and behavior grammar exist:

```text
missile / laser response windows: approximately 18–20 s
enemy role decision delay: approximately 3–4 s
```

Do not add tactical pause or slow motion before testing the clearer UI and gentler timings.

Do not incrementally decorate the current text menu. Design the complete interaction flow first.

---

## Keyboard officer shortcuts

Planned mapping:

```text
1–5
```

Need:

- stable role order;
- input blocking during transitions;
- menu close behavior;
- visible focus;
- compatibility with debug/text input.

---

## Gamepad support

Design officer command navigation for:

- directional selection;
- confirm/cancel;
- switching officers;
- target selection;
- active task cancellation.

Avoid precise mouse-only interaction.

---

## Persistent threat access

Critical threat actions should take one or two decisions.

Potential improvements:

- persistent threat indicators;
- direct threat selection;
- reopen last relevant officer menu;
- keyboard shortcuts;
- visible link from threat to available response.

---

## Command-menu polling regression coverage

Maintain coverage for open menus while state changes:

- a threat appears;
- point-defense reaches zero;
- officer task finishes;
- drive is disabled/repaired;
- spam expires;
- enemy is destroyed;
- player launcher enters cooldown or becomes empty.

---

# 10. Encounter and persistence rules

## Combat objects remain encounter-local

Locked rule:

```text
leave zone / reconstruct encounter
→ missiles, mines, shields, laser attacks and spam disappear
```

Do not add save/runtime persistence for these objects.

Installed player systems and surviving universe actors remain persistent.

---

## Enemy actor removal regression

Current runtime acceptance confirms destroyed enemies do not return after FLY TO or JUMP.

Maintain automated coverage around:

- encounter actor removal;
- persistent current-node actor removal;
- telemetry clearing;
- no `EndScene` transition.

---

## Travel presentation polish

Potential improvements:

- rotation-to-movement transition;
- ship-bracing feedback;
- object parallax;
- dust activation timing;
- consistent arrival framing;
- old-engine vibration.

---

## Ship sprite scale consistency

Prefer authoring sprites at intended display size.

Avoid a generalized distance-scaling system unless it improves gameplay readability.

---

# 11. Test and architecture debts

## Full player ship fixtures

A focused helper now exists:

```text
tests/engine/encounter/combat_test_support.ts
```

It owns only:

- anchored starter combat setup;
- loaded encounter state;
- current enemy actor;
- typed installed player weapon lookup.

Commands, steps and assertions remain local to each test.

Further fixture work is justified only when a new repeated setup appears. Do not generalize this into a universal fixture framework.

---

## Player weapon-array tests

`setPlayerShipWeaponStates()` requires the complete installed loadout.

Tests changing one weapon should preserve all untouched weapons explicitly.

Prefer a small local mapping helper over one-element arrays that accidentally replace the loadout.

---

## Shared player ship status mapper

`BridgeController` and `BridgeEncounterEngineEventHandler` construct the full player status payload.

Verify whether a small pure mapper would reduce drift.

Do not extract a broad status framework.

---

## Encounter/runtime synchronization ownership

Persistent state now includes weapon states in addition to:

- navigation;
- hull;
- drive;
- point defense;
- shield generator;
- generated anchors.

Keep one obvious synchronization owner per mutation path.

Avoid:

- views reading runtime;
- broad per-frame synchronization;
- duplicate controller/handler ownership;
- generic persistence frameworks.

---

## CombatRunner size

`CombatRunner` was the first justified god-object split after the snapshot
cleanup. The complete missile-object lifecycle now belongs to
`CombatMissileRunner`; the complete sticky-mine lifecycle now belongs to
`CombatStickyMineRunner`; the complete incoming-laser lifecycle now belongs to
`CombatLaserRunner`; the complete hostile-spam lifecycle now belongs to
`CombatSpamRunner`. Enemy launcher phases also belong to
`CombatMissileRunner`. `CombatRunner` retains the locked step order, concrete
runner dispatch and explicit cross-system synchronization.

Do not split it because of line count.

A split is justified only when a subsystem can own a complete lifecycle with fewer dependencies and fewer unrelated edits.

Avoid replacing a linear file with a graph of tiny runners.

The planned concrete lifecycle split is complete. Do not continue splitting the
orchestrator by line count, and do not replace the four concrete runners with a
generic attack-runner hierarchy.

---

## Apply-script reliability

Recent failures came from:

- broad field-pattern replacement;
- incomplete usage inventory;
- inferred factory input;
- stale one-weapon test assumptions;
- a guard that checked the wrong literal;
- a range replacement that preserved its end marker while the replacement duplicated it;
- a recovery script that mixed the required repair with unrelated cleanup.

Required discipline:

1. inspect exact files;
2. search all usages and full snapshots;
3. read factory/type contracts;
4. stage all transformations;
5. validate before writing;
6. use targeted anchors or full-file rewrites;
7. document whether a range helper preserves its end marker;
8. never repeat a preserved marker inside the replacement;
9. keep recovery atoms narrow and repair only the failed invariant.

This is a process debt, not an architecture feature.

---

# 12. Larger future systems

## Crew stress and fatigue

Future crew layer:

- officers accumulate stress/fatigue;
- command performance and behavior changes;
- downtime becomes meaningful;
- captain chooses whom to monitor.

This should create story and decision pressure, not routine stat maintenance.

---

## R&R locations

Possible content:

- space resorts;
- stations;
- shore leave;
- several days of downtime;
- captain rests or monitors one crew member;
- unmonitored crew can trigger absurd but serious consequences.

Examples discussed:

- Comms develops alcoholism;
- Engineer insults a species and creates a diplomatic incident;
- Weapons develops a personal vendetta.

---

## Factions and sector-specific enemies

Future enemy identity may come from:

- missile preferences;
- defensive technology;
- disruption capability;
- launcher firmware;
- retreat policy;
- social/diplomatic consequences.

Prefer authored faction identity over random stat variation.

---

## Content-driven missions

Possible pressures:

- timed delivery;
- limited resupply;
- damaged systems;
- hostile territory;
- crew conflict;
- station access restrictions;
- rare resource use;
- capture versus destruction requirements.

Combat should serve mission context rather than exist as an isolated arena.

---

# 13. Design risks

## Menu matching

Risk:

```text
read RED
→ click RED
```

can become trivial.

Mitigation should come from:

- limited time;
- limited charges/ammo;
- competing officer tasks;
- incomplete information;
- different threat families;
- offensive opportunities;
- meaningful fallback choices.

Do not solve this merely by adding colors.

---

## Too many simultaneous threats

More objects do not automatically create depth.

Maintain:

- readable telegraphs;
- enough comprehension time;
- few consequential decisions;
- clear results.

---

## Over-generalization

Do not build:

- universal resource framework;
- generic effect graph;
- ECS;
- dependency injection container;
- universal command scripting;
- speculative save migration;
- generalized modifier system;
- generic targeting framework beyond demonstrated needs.

---

## Prototype UI becoming permanent

Temporary UI must remain marked as temporary.

A diegetic replacement must preserve:

- readability;
- update timing;
- current/max values;
- damage feedback;
- resource-spend feedback;
- engine/shield state;
- enemy destruction clearing.

---

# 14. Backlog maintenance

At the end of each development chat:

- add newly discovered deferred work;
- remove completed items;
- update changed contracts;
- avoid duplicating the active checkpoint;
- keep speculative ideas in future sections;
- keep near-term concrete debts near the top.

When selecting work:

1. read `PROJECT_CONTEXT.md`;
2. read this file;
3. read any active handoff file;
4. inspect fresh `master`;
5. choose one coherent atom;
6. do not opportunistically fix unrelated backlog items.
