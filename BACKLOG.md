# Space Captain — Backlog

Deferred implementation work, design debts and reminders.

This file is not automatically the active sprint plan.

An item moves into active implementation only after it is selected explicitly.

Keep items concrete enough that they remain understandable in a future chat.

Last updated: 2026-08-01

---

# 1. Current selected work

Current selected slice:

```text
PLAYER MISSILE OFFENSE
```

The active contract and implementation order are kept in:

```text
PLAYER_MISSILE_HANDOFF.md
```

Do not duplicate the active atom plan here.

When the slice closes:

- remove or archive the handoff file;
- update `PROJECT_CONTEXT.md`;
- move only genuinely deferred discoveries back into this backlog.

---

# 2. Immediate follow-up after player missile

## Enemy defense behavior pass

Do not add enemy countermeasures inside the first player missile slice.

The later behavior pass should decide how enemy policy uses available defensive roles and systems.

Candidate responses:

- enemy point defense against player missiles;
- enemy Engineer choosing a shield sector during player laser telegraph;
- enemy role conflicts between offense and defense;
- policy differences between cautious/aggressive ships;
- deliberate failure when the required role is occupied.

The important rule is:

```text
enemy captain = policy
enemy crew roles = constrained operators
```

Avoid special-case scripted reactions disconnected from the shared combat grammar.

---

## Restore enemy SCIENCE / spam in the development encounter

The development enemy currently removes SCIENCE from local crew roles.

The Spam Projector remains installed but cannot operate.

Restore SCIENCE after the player missile slice and its runtime acceptance are complete.

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

This is awkward to trigger and does not block the current missile implementation.

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

Do not mix this into player missile work.

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

## Outgoing missile art and presentation polish

The first player missile view needs a dedicated outgoing sprite.

Draw it only when the view atom is ready so the required:

- direction;
- size;
- launch point;
- target scale;
- frame name;
- atlas path

are known.

Potential presentation elements:

- launch flash at the player mount;
- step-based flight;
- enemy impact;
- shield block;
- target-lost self-destruction.

Avoid reusing the incoming missile sprite blindly if perspective/readability differ.

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

## Additional offensive weapon

After laser and missile are complete, a third player weapon should not be another reskinned cooldown attack.

It should create a different officer/resource decision.

Candidates require design first.

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

Adding the second installed weapon caused several full-snapshot tests to change.

Potential focused helpers:

- explicit starter player ship fixture;
- explicit starter weapon loadout fixture;
- small override functions.

A helper is justified only if it reduces churn while keeping expected state visible.

Do not build a universal fixture framework.

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

`CombatRunner` is large.

Do not split it because of line count.

A split is justified only when a subsystem can own a complete lifecycle with fewer dependencies and fewer unrelated edits.

Avoid replacing a linear file with a graph of tiny runners.

---

## Apply-script reliability

Recent failures came from:

- broad field-pattern replacement;
- incomplete usage inventory;
- inferred factory input;
- stale one-weapon test assumptions;
- a guard that checked the wrong literal.

Required discipline:

1. inspect exact files;
2. search all usages and full snapshots;
3. read factory/type contracts;
4. stage all transformations;
5. validate before writing;
6. use targeted anchors or full-file rewrites;
7. keep recovery atoms narrow.

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
