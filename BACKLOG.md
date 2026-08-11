# Space Captain — Backlog

Deferred implementation/design work and reminders.

Last updated:

```text
2026-08-11
```

This is not automatically the active sprint.

---

# 1. Current selected work

```text
CAPTAIN DASHBOARD
```

See:

```text
CAPTAIN_DASHBOARD_HANDOFF.md
```

Immediate work:

- place dashboard against real 1280×720 bridge geometry;
- implement left persistent player panel first;
- include missile, laser, mines and spam;
- expose action-role buttons without duplicating engine command rules;
- then build right combat context;
- preserve cancellation/noncombat functionality before removing old menu.

---

# 2. Dashboard implementation follow-ups

## Player weapon read model

Current bridge weapon payload does not include the player mine dispenser.

Need dashboard-ready representation for all installed current tools:

- missile;
- laser;
- mine dispenser;
- spam projector.

Do not make the view read engine state directly.

## Role-action button state

Need clear visual/data states:

- active/clickable;
- disabled because system unavailable;
- disabled because officer busy elsewhere;
- engaged/currently working.

System state and officer state must remain separate concepts.

## Task cancellation

Current officer context menu exposes manual cancellation for cancellable tasks.

Before menu removal:

- design dashboard cancellation affordance;
- preserve exact existing cancellation eligibility;
- do not add refunds or new cancellation rules.

## Officer context menu removal

After dashboard replacement is complete:

- remove station-click command menu flow;
- remove open-menu 200 ms polling;
- remove obsolete menu view/controller/events;
- keep only other station interaction if it has a real purpose.

Do not keep two permanent command UIs.

## Station combat hints

Current idle station monitors show combat action hints.

Likely future after dashboard:

- remove/reduce hints;
- keep task label/progress/activity;
- use bridge space for character barks/reactions.

Decide only after dashboard runtime test.

---

# 3. Dashboard contexts

## Combat

Active design.

## Navigation

Need a later context for:

- plot course;
- fly;
- dock;
- jump;
- escape/break contact.

Possible auto-switch:

```text
combat starts → COMBAT
combat ends   → NAV
```

Exact tab/mode UI not locked.

## Ship / damage

Possible later context if multiple repairable systems justify it.

Avoid a separate damage screen if direct clickable persistent system icons are
enough.

## Contact / neutral ship / station / anomaly

Design each from actual content requirements.
Do not prebuild a generic context framework now.

---

# 4. Global evasive maneuver

Proposed, not implemented.

Current direction:

- one global Helm task;
- lasts X seconds;
- mitigates missile/laser-style incoming pressure;
- does not solve mines/spam;
- slows player weapon-related task progress;
- may scale with Helm traits / engine state.

Need to lock:

- mitigation model;
- duration;
- offensive slowdown;
- cooldown/recovery;
- effect of damaged drive;
- UI engaged state.

Do not add maneuvering-thruster persistent state speculatively.

---

# 5. Escape flow

Not implemented.

Need:

- clear break-contact rule;
- whether it is Helm/navigation;
- preparation timing;
- interruption/pursuit consequences;
- dashboard location.

Escape must stay easy to reach in combat.

---

# 6. Combat UX / balance pass

Do not balance final timings until the dashboard is playable.

Questions to test:

- can a new player understand threat solutions without memorizing officer roles?
- does each major threat have more than one reasonable response?
- does combat become whack-a-mole despite better UI?
- are 3–4 simultaneous threats readable?
- how much time is needed once crew traits/slowness matter?
- is tactical pause still unnecessary?

Avoid solving depth by only adding more simultaneous threats.

---

# 7. Enemy intel / Science Analyze Enemy

Current mockups include:

- crew composition;
- shield weakness;
- no PD;
- drive damage.

These are not yet a final player-facing knowledge model.

Need explicit gameplay contract for:

- what is visible immediately;
- what Science scan reveals;
- uncertain/false/confirmed data;
- persistent encounter knowledge;
- launcher identification;
- vulnerabilities;
- how intel affects available actions.

Avoid enemy telemetry spreadsheet.

---

# 8. Enemy behavior future

Current defenses are implemented.

Future:

- visible aggressive/cautious behavior presets;
- intentional risk-taking;
- better PD beam selection from knowledge;
- subsystem priorities;
- retreat;
- surrender;
- faction doctrine;
- opening disruption capability ownership.

Do not rebuild policy architecture for this.

---

# 9. Weapon/content follow-ups

## BLUE missile content

Spectral system supports RED/BLUE, but prototype content remains mostly RED.

Decide actual gameplay/content purpose before adding symmetry for symmetry's
sake.

## Launcher identification persistence

Possible:

```text
identify launcher once
→ later missiles from same launcher known
```

Keep distinct from enemy-ship analysis and faction knowledge.

## Player ammo/resupply

Need run-level contract for missile and mine ammunition:

- docking purchase/service;
- mission supply;
- salvage;
- whether a run can go empty.

Do not auto-refill accidentally.

## Player laser presentation

Potential:

- targeting movement/light;
- pre-charge reticle;
- clearer transition before CHARGING.

## Player missile presentation

Deferred:

- launch flash;
- hull impact flash;
- target-loss disappearance;
- flight/scale tuning.

## Player sticky-mine presentation

Deferred:

- outgoing placement tuning;
- launch flash;
- detonation feedback;
- target-loss effect.

---

# 10. Player defense follow-ups

## Point-defense rejected-command regression

Add focused test proving rejected/stale command does not spend an extra charge.

Candidate cases:

- zero charges;
- target removed;
- role busy;
- command no longer available.

## Zero-charge feedback

Dashboard should clearly show empty PD without requiring text walls.

## Point-defense replenishment

Current combat rule:

```text
no recharge during combat
```

Future out-of-combat replenishment not designed.

## Repair tasks beyond drive

Future only when systems can really be damaged:

- weapon/system repair;
- shield generator;
- sensors;
- other meaningful failures.

No generic health repair bar.

---

# 11. Enemy subsystem damage

Not implemented.

Possible target systems:

- launcher;
- laser;
- spam projector;
- engine;
- shield;
- sensors.

Each damaged subsystem must produce a visible command consequence.

This will interact directly with the new dashboard system-row language.

---

# 12. Enemy retreat / surrender

Not implemented.

Possible future states:

- retreat preparation;
- surrender;
- disabled-but-alive;
- capture/salvage.

Needs mission consequences first.

---

# 13. Persistence/runtime follow-ups

## Manual player weapon persistence smoke

Automated tests cover weapon state.

Deferred manual check:

```text
fire weapon
→ reconstruct/re-enter Bridge during cooldown
→ weapon must remain in current phase
```

## Combat objects remain encounter-local

Keep locked:

```text
leave/reconstruct encounter
→ missiles/mines/laser threats/shields/spam channels disappear
```

## Enemy destruction regression

Maintain:

- destroyed enemy removed from encounter;
- persistent node actor removed;
- does not return;
- telemetry clears;
- no automatic EndScene transition.

---

# 14. Bridge/art follow-ups

## Final bridge art

Current bridge is functional prototype art.

Final target:

- stronger Sierra/Space Quest VGA vibe;
- more humor/personality;
- less Star Trek cleanliness;
- viewscreen stays strong;
- crew remains readable;
- dashboard does not dominate the screenshot.

## Enemy ship art

Current concept direction:

- near-frontal but slightly angled;
- readable bridge/viewscreen area;
- four clear hardpoints suitable for VFX origins;
- weapon housings relatively universal rather than literal missile/mine props.

## Player system/dashboard icons

Need production icon family:

- same visual footprint;
- restrained color;
- status through label/progress/button states rather than rainbow frames.

---

# 15. Navigation/travel presentation

Potential polish:

- turn-to-flight transition;
- parallax;
- dust timing;
- arrival framing;
- old-engine vibration.

Avoid generalized distance scaling unless gameplay needs it.

---

# 16. Architecture/process debts

## Dashboard model ownership

Avoid a god `BridgeCaptainDashboardView`.

Likely split only after real pressure:

```text
BridgeCaptainDashboardView
→ composition/lifecycle

left/right subviews
→ rendering

controller/mapper
→ prepared dashboard state
```

Do not build a generic dashboard framework before noncombat context #2 exists.

## EncounterEngine callback cycle

Current callback cycle remains:

- CombatRunner → officer-task damage interruption;
- OfficerTaskRunner → spam purge / mine cleanup.

Stable for now.
Do not add more sibling callback wiring casually.

## Test fixtures

Keep `combat_test_support.ts` focused.
Do not generalize into universal fixtures.

## Apply-script discipline

- fresh source inventory;
- exact anchors;
- stage/validate before write;
- no dirty-tree guard by default;
- no destructive rollback by default;
- narrow recovery atoms.

---

# 17. Larger future systems

## Crew stress/fatigue

Should create story/decision pressure, not routine stat maintenance.

## R&R

Possible resorts/stations/shore leave and crew incidents.

## Factions

Prefer authored identity via:

- weapons;
- defense technology;
- doctrine;
- retreat policy;
- social consequences.

## Missions

Combat should serve mission pressure:

- delivery;
- limited supply;
- damaged ship;
- hostile territory;
- crew conflict;
- capture/destruction constraints.

---

# 18. Design risks

## Counter-table combat

Risk:

```text
see threat
→ press mandatory counter
```

Mitigate through:

- officer contention;
- multiple viable responses;
- incomplete information;
- limited resources;
- offensive opportunity cost;
- commitment.

## UI Boeing effect

Stress-case screenshots may contain:

- several threats;
- several player systems;
- enemy intel;
- damage.

Mitigation:

- stable left geography;
- timer-first threat rows;
- icon + role action buttons;
- restrained palette;
- start runs with fewer systems/threats;
- contextual modes rather than one permanent mega-panel.

## Prototype UI becoming permanent

Do not preserve old context menu/status layout merely because it already works.

## Over-generalization

Do not build:

- ECS;
- DI container;
- generic effect graph;
- universal command language;
- universal dashboard component framework;
- speculative save migration.
