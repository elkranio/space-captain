# Space Captain — Captain Dashboard Handoff

Active design/implementation handoff.

Last updated:

```text
2026-08-11
```

Repository checkpoint:

```text
2011518c8d492eb6b7a99d6d2fc79f429e780f30
```

Status:

```text
design direction selected
implementation not started
user will attach latest mockup in the next chat
```

---

# 1. Why the dashboard direction changed

The existing combat became harder to read than intended because the player was
implicitly asked to know:

```text
threat
→ correct officer
→ correct officer menu
→ correct command
→ target / subchoice
```

That makes the game test knowledge of the crew UI instead of testing captain
prioritization.

New direction:

```text
captain interacts with the situation
→ dashboard shows valid solution actions
→ action shows the officer who will execute it
```

The crew remains mechanically central because officer availability still
constrains which actions are possible.

The dashboard is not intended to automate the interesting decision.
It removes menu hunting.

---

# 2. Core UX principle

Normal commands should not require:

```text
select officer first
```

The player should primarily select:

```text
system / threat / encounter object / desired action
```

The UI then communicates:

```text
which officer performs it
```

Example:

```text
incoming missile
→ scan button + SCI
→ intercept button + WPN

broken engine
→ repair button + ENG

player spam projector
→ use button + SCI
```

Role ownership is learned naturally instead of being a prerequisite for basic
play.

---

# 3. Bridge versus dashboard

The bridge and dashboard now have deliberately different jobs.

Bridge:

- officers as characters;
- barks;
- reactions;
- work animation;
- task/activity presentation;
- viewscreen combat;
- environmental background noise.

Dashboard:

- ship state;
- current external situation;
- actionable decisions;
- command availability;
- compact progress/state signals.

Target:

```text
bridge = theatre
dashboard = decisions
```

Officer pop-up menus currently compete with barks, station feedback and crew
presence. The long-term goal is to remove them once the dashboard preserves all
required command functionality.

---

# 4. Stable dashboard geography

The current high-level layout is:

```text
┌──────────────────────────────────────────────────────┐
│                    BRIDGE                            │
│ crew / viewscreen / VFX / barks                     │
├──────────────────────┬───────────────────────────────┤
│ OUR SHIP             │ CURRENT CONTEXT               │
│ stable geography     │ dynamic encounter geography  │
└──────────────────────┴───────────────────────────────┘
```

Left side always means:

```text
our ship
```

Right side always means:

```text
the thing/situation we are currently dealing with
```

In combat, the right side is enemy-centric.

Future examples:

```text
anomaly
→ anomaly data + relevant actions

station
→ station/contact/docking data + relevant actions

neutral ship
→ contact data + relevant actions
```

Do not design all future contexts now.

---

# 5. Left panel — persistent ship telemetry

Top strip contains persistent player-ship facts.

Current intended items:

- hull;
- point-defense charges;
- shield-generator charges/state;
- engine/drive state.

Example:

```text
[HULL 3/3] [PD 4/4] [SHD 1] [ENGINE]
```

This is stable telemetry.

A damaged engine is itself the repair affordance:

```text
engine damaged
→ engine status becomes visually urgent
→ repair action becomes available
```

Do not keep a permanent `REPAIR ENGINE` button when nothing is broken.

Current engine supports drive:

```text
ONLINE
DISABLED
```

Do not invent a broader subsystem-damage model during the first dashboard slice.

---

# 6. Left panel — player weapons/tools

Current preferred layout:

```text
1 × N vertical list
```

Current four rows:

```text
MISSILE
LASER
MINES
SPAM
```

Reason:

- stable positional memory;
- compact;
- easier to scan changing ammo/cooldown than a 2×2 inventory grid;
- role buttons align on one edge;
- first three visibly share Weapons while spam visibly uses Science.

Base row:

```text
[ICON]  NAME + AMMO/COUNT                      [ACTION + ROLE]
```

Examples:

```text
[missile] MISSILE 4/5                          [crosshair WPN]
[laser]   LASER                                [crosshair WPN]
[mines]   MINES 3/12                           [crosshair WPN]
[spam]    SPAM                                 [use/fire SCI]
```

Ammo/count should sit immediately after the name.
Do not separate it into an invisible Excel column.

Important:

```text
SPAM → SCI
```

---

# 7. Left panel — system state language

Do not write large status strings such as:

```text
READY
RECHARGING
DAMAGED
REPAIRING
```

Use visual state.

Current preferred state channels:

## Ready

- neutral/default label;
- no progress bar;
- role-action button active/clickable.

## Cooldown / reload / charge

- neutral label;
- yellow progress bar directly under the weapon icon tile;
- progress bar width equals the icon tile width;
- role-action button disabled because the system itself is unavailable.

Think MMO skill cooldown readability, not a long dashboard bar.

## Current action / system actively being operated

- weapon/system name becomes yellow;
- role-action button becomes `engaged`;
- button remains visible but is not a second command.

## Officer busy elsewhere

- system may still be ready;
- icon/system state remains ready;
- role-action button is disabled due to operator availability;
- preserve enough role identity to distinguish this from a dead generic button.

Do not encode officer busy as weapon cooldown.

## Damaged system

Future UI contract, not current broad domain support:

- system label becomes red;
- no extra `!` symbol unless testing proves color alone insufficient;
- normal operator action is replaced by repair action:
  `[wrench ENG]`.

## Repairing system

Future UI contract:

- red system label;
- red progress bar under icon tile;
- `[wrench ENG]` button in engaged state.

---

# 8. Role-action button

The role element should be a real compact button, not merely a label.

Button contents:

```text
[action icon] ROLE
```

Examples:

```text
[crosshair] WPN
[wrench]    ENG
[scan]      SCI
[shield]    ENG
[maneuver]  HLM
```

The icon answers:

```text
what action
```

The role answers:

```text
who executes it
```

Required visual states:

```text
ACTIVE
DISABLED_SYSTEM
DISABLED_OFFICER_BUSY
ENGAGED_CURRENT_WORK
```

The button should be the strongest click affordance in the row.
The icon/name/ammo should remain calmer informational elements.

Do not make the entire row look like a huge button.

---

# 9. Right combat panel — combined enemy root

The enemy should be represented as one root contextual object rather than:

```text
separate enemy stats header
+ duplicate ENEMY CONTACT action row
```

Current intended root block may be slightly taller than a threat row and contain:

- enemy ship icon/sprite;
- hull;
- enemy crew knowledge;
- discovered intel/weakness badges;
- global Science scan/analyze action;
- global Helm evasive-maneuver action.

Concept:

```text
[enemy ship] HULL 3/4   crew/intel ...       [scan SCI] [evade HLM]
```

Important implementation reality:

- current player-facing enemy telemetry already exposes hull, drive, shield
  generator and weapon phases;
- current bridge telemetry does not expose the final desired crew/intel model;
- `ANALYZE ENEMY` is not yet a player command;
- mockup weakness badges are design placeholders.

Do not fake final player knowledge in the view.
The Science intel model needs an explicit gameplay slice later.

---

# 10. Right combat panel — threat rows

Threat rows should be lean.

Preferred grammar:

```text
[TIMER] [THREAT ICON] [THREAT NAME] [ACTION+ROLE] [ACTION+ROLE] ...
```

Timer is first because deadline is the most urgent datum.

Examples:

```text
15.5s [missile ?] UNKNOWN MISSILE [scan SCI] [crosshair WPN]
 9.3s [red missile] RED MISSILE   [crosshair WPN disabled]
 7.1s [laser L]    LASER LEFT     [scan SCI] [shield ENG]
 3.9s [mines x3]   STICKY MINES   [clear SCI] [clear ENG] [clear WPN] [clear HLM]
```

Do not repeat global Helm evade in every missile/laser row.

Threat icon rules:

- one unified icon family;
- same visual footprint;
- icon height only slightly larger than text height;
- missile drawn horizontally to fit;
- no large framed mini-art;
- no different-size icon zoo.

Action buttons:

- icon + role only where icon comprehension is sufficient;
- no long `IDENTIFY / DESTROY / RAISE SHIELD / EVADE / CLEAR` walls;
- disabled states remain in place;
- same action-role component language as the left panel.

---

# 11. Current threat data already available

Incoming missiles:

- ID;
- time to impact;
- spectral band only after identification.

Laser threats:

- ID;
- time to fire;
- target zone only after identification.

Sticky mines:

- individual mine ID;
- fuse;
- whether a mine is being cleared;
- whether it is the next clear target.

Important presentation decision:

```text
domain mines remain individual
dashboard may group them visually
```

If the dashboard shows:

```text
STICKY MINES x3
```

it must still execute the exact engine command/target currently available.
Do not create a new grouped domain object only for UI convenience.

Hostile spam also exists and must eventually receive a clean dashboard
representation/purge action.

---

# 12. Global evasive maneuver — proposed design, not implemented

Current design discussion strongly favors global evade over target-specific dodge.

Proposed semantics:

```text
click global HLM evade
→ Helm starts EVASIVE MANEUVER for X seconds
→ incoming weapon-related pressure is mitigated
→ our own weapon-related task progress is slowed while maneuvering
```

Current proposed affected incoming threats:

- missiles;
- lasers.

Current proposed exclusions:

- sticky mines;
- spam.

Reason:

- mines are already attached hazards;
- spam is electronic/crew pressure rather than an incoming shot.

Potential dependencies:

- duration/effect may depend on Helm traits;
- duration/effect may depend on engine/ship state.

Important:

- this is not implemented;
- exact mitigation model is not locked;
- exact duration is not locked;
- do not add maneuvering-thruster persistent state unless the mechanic proves
  it needs one.

This mechanic should be designed before its code atom.

---

# 13. Combat complexity goal

The dashboard should expose multiple valid responses, not merely hide a
one-to-one counter table.

Bad target:

```text
missile
→ mandatory Science
→ mandatory Weapons
```

Better target:

```text
missile
→ identify for better information
→ intercept
→ global evade
→ potentially accept/mitigate impact

laser
→ identify
→ shield
→ global evade
→ potentially finish enemy first / accept damage
```

The interesting decision should be:

```text
which limited officer commitment is worth it now?
```

not:

```text
which menu contains the mandatory counter?
```

---

# 14. Dashboard contexts / tabs — provisional

Possible dashboard modes:

```text
COMBAT
NAV
SHIP / DAMAGE
```

Current idea:

- entering combat may automatically select `COMBAT`;
- leaving combat may automatically return to `NAV`;
- player can manually switch when needed;
- automatic context should help, not lock the player.

This is not yet a final tab spec.

Future `ESCAPE / BREAK CONTACT` must remain easy to reach during combat.
Do not bury it several screens deep.

---

# 15. Legacy UI that dashboard is intended to replace

Current `BridgeUiView` owns:

```text
BridgeShipStatusView
BridgeEnemyTelemetryView
BridgeOfficerContextMenuView
optional BridgeEnemyDebugPanelView
```

Current officer context menu:

- opens from station click;
- polls every 200 ms while open;
- contains command groups;
- also exposes manual task cancellation.

Long-term direction:

```text
dashboard command surface works
→ preserve cancellation equivalent
→ remove normal officer command context menu
```

Do not delete it before:

- dashboard can execute equivalent commands;
- cancellable tasks remain cancellable;
- navigation/noncombat commands have a replacement path.

Station combat hints will also become partially redundant.
After dashboard acceptance, reassess whether station monitors should return to
task/activity-only presentation.

---

# 16. Current command architecture to reuse

Do not create dashboard-only command rules.

Current availability:

```text
EncounterEngine.getAvailableCommands(role)
```

Current execution:

```text
BRIDGE_EVENT.OFFICER_COMMAND_SELECTED
→ BridgeEncounterController
→ EncounterEngine.executeCommand()
```

`getAvailableCommands(role)` returns no commands while that officer has a task.

Dashboard should map engine commands to:

```text
system rows
enemy root actions
threat rows
navigation/context actions
```

Mapping belongs in app/controller/presentation model code.
Availability remains engine-owned.

---

# 17. Current snapshot/transport facts

`BridgeEncounterSnapshotSynchronizer` currently emits:

- player weapon status;
- enemy ship telemetry;
- incoming missile snapshots;
- outgoing missile snapshots;
- outgoing mine snapshots;
- incoming sticky-mine snapshots;
- laser threat snapshots;
- player shield snapshot;
- enemy shield snapshots.

Known gap for the new left panel:

```text
BridgePlayerWeaponsStatusUpdatedPayload
currently maps:
- laser
- missile launcher
- spam projector

but not player sticky-mine dispenser
```

Dashboard work should fix the presentation model rather than add a special
view-side engine read.

Prefer a generic installed-player-system read model if it makes the current
dashboard simpler; do not build a universal equipment framework.

---

# 18. Suggested implementation sequence

Do not implement the full mockup in one atom.

Candidate sequence:

## Atom 21 — dashboard foundation / left read model

Possible scope:

- introduce `BridgeCaptainDashboardView` composition root;
- establish lower foreground geometry from the attached mockup;
- replace temporary player status presentation with the new left panel;
- include all four installed player weapon/tool rows;
- keep actions read-only or narrowly wire one action if needed;
- preserve old context menu temporarily.

## Next atom — role-action buttons

- derive active/disabled/engaged states from existing command availability +
  officer task state;
- route clicks through existing `OFFICER_COMMAND_SELECTED`;
- verify one player weapon end to end.

## Next atom — right threat model

- combined enemy root;
- timer-first missiles/lasers/mines;
- action-role button mapping;
- no global evade implementation yet unless explicitly selected.

## Cleanup atom

After dashboard commands cover old functionality:

- remove officer context menu;
- remove its 200 ms polling;
- preserve task cancellation through the new UI;
- reassess combat hints.

Exact atoms should be decided after fresh inspection and the user's attached
mockup.

---

# 19. Acceptance questions for the first playable dashboard

At 1280×720:

- does the bridge still have room to breathe?
- can weapon readiness be read without status words?
- can active versus disabled versus engaged role buttons be distinguished?
- can a new player understand who will execute a click?
- can 3–4 simultaneous threats remain readable?
- does timer priority read instantly?
- does UI remain understandable with fewer systems early in a run?
- do officer barks/reactions remain visually unobstructed?
- can all required actions be performed without opening an officer menu?
