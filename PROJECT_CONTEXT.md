# Space Captain — Project Context

Living handoff document for development of Space Captain.

Read this file first in every new development chat.

Last updated:

```text
2026-08-11
```

Latest verified `master`:

```text
2011518c8d492eb6b7a99d6d2fc79f429e780f30
```

User-reported acceptance at this checkpoint:

```text
npm run typecheck — green
npm test          — green
runtime smoke     — green
```

Current read order:

```text
PROJECT_CONTEXT.md
CAPTAIN_DASHBOARD_HANDOFF.md
SYSTEM_MAP.md
GAMEPLAY_CONTRACTS.md
BACKLOG.md

ENEMY_BEHAVIOR_HANDOFF.md      when enemy behavior work resumes
BRIDGE_V01_HANDOFF.md          completed bridge migration reference
COMMAND_PALETTE_ART_PLAN.md    superseded historical reference only
```

---

# 1. Project

Space Captain is a comedic retro science-fiction bridge-command roguelite.

The player is a captain who does not directly operate every ship system.
The player reads the current situation, chooses an intent/solution, and a crew
member executes it.

Current core direction:

```text
situation appears
→ captain sees possible responses in the dashboard
→ captain chooses one response
→ the UI shows which officer will execute it
→ officer becomes occupied
→ bridge shows execution/reaction/result
```

The intended complexity comes from:

- limited officer availability;
- overlapping responsibilities;
- incomplete information;
- commitment to long tasks;
- limited charges/ammunition;
- multiple acceptable responses to one threat;
- offense competing with defense.

Avoid turning combat into:

- bullet hell;
- APM test;
- spreadsheet combat;
- one-to-one counter memorization;
- a role-menu knowledge exam;
- a tactical simulator with many hidden percentages.

---

# 2. Collaboration rules

Repository:

```text
elkranio/space-captain
```

Branch:

```text
master
```

Workflow:

- GitHub is read-only for the assistant;
- user applies, tests and pushes;
- read fresh `master` before every code atom;
- after the user says `pushed`, verify fresh HEAD and exact changed files;
- never build an atom from stale source snapshots;
- prefer small coherent atoms;
- architecture discussion before invasive code.

Language:

```text
Russian
```

Code delivery:

- `.mjs` apply script inside ZIP when repository edits are needed;
- exact HEAD guard for a normal atom;
- no clean-tree / dirty-tree guard unless explicitly requested;
- no destructive rollback infrastructure by default;
- validate exact source assumptions before writing;
- recovery/post-fix scripts must work on the expected dirty tree and touch only
  the failed invariant;
- user runs typecheck/tests/runtime and pushes.

Style:

- direct and practical;
- critical when needed;
- reduce cognitive load;
- no speculative frameworks;
- no tiny-file graph unless it makes current code simpler.

Art workflow:

- user will attach the chosen dashboard mockup in the next chat;
- do not infer exact pixel geometry from old generated concepts;
- agree asset/frame requirements before an atom that needs new art;
- current bridge art is functional prototype art, not final release art.

---

# 3. Technology

Stack:

- Phaser 3;
- TypeScript;
- Vite;
- Vitest;
- p34t project foundation.

Target screen:

```text
1280 × 720
```

Main atlas key:

```text
atlas
```

Common checks:

```bash
npm run typecheck
npm test
npm run dev
npm run build
npm run pack:tex
npm run pack:sfx
```

---

# 4. Current active slice

Active slice:

```text
CAPTAIN DASHBOARD
```

Goal:

```text
replace role-first officer command navigation
with a contextual captain command surface
```

The dashboard should make basic play possible without first selecting an
officer or memorizing which officer owns each command.

Current high-level screen grammar:

```text
upper bridge
→ crew / barks / reactions / physical combat / viewscreen

lower captain dashboard
→ decisions and ship/context information
```

Dashboard geography:

```text
LEFT
→ our ship

RIGHT
→ current external context
```

In combat:

```text
LEFT
→ persistent player telemetry
→ player systems / weapons
→ direct system actions

RIGHT
→ enemy root context
→ enemy information / discovered intel
→ incoming threats
→ contextual response actions
```

The dashboard is expected to become the normal command surface.
Officer context menus are now considered temporary legacy UI.

Detailed current design:

```text
CAPTAIN_DASHBOARD_HANDOFF.md
```

---

# 5. Locked bridge direction

Playable roles:

- Science;
- Weapons;
- Engineer;
- Helm.

Comms remains removed.

Bridge:

- captain POV;
- captain body not visible;
- four visible officers;
- large viewscreen;
- crew area should remain visually free for barks/reactions/activity;
- station monitors remain useful for task/activity feedback;
- normal combat commands should move away from pop-up officer menus.

Current role ownership relevant to dashboard:

```text
SCIENCE
→ threat identification
→ hostile spam purge
→ player spam projector
→ future enemy analysis / authored science actions

WEAPONS
→ point defense
→ missile
→ laser
→ sticky-mine dispenser
→ allowed mine clearing

ENGINEER
→ directional shield
→ drive repair
→ allowed mine clearing
→ future system repairs

HELM
→ fly / dock / jump
→ allowed mine clearing
→ future global evasive maneuver
→ future escape/navigation choices
```

Important:

```text
player SPAM is operated by SCIENCE
```

The current spam projector channels for 20 seconds and applies a crew-progress
slowdown to the targeted enemy.

---

# 6. Current combat capability

Player offense implemented:

- missile launcher;
- laser;
- sticky-mine dispenser;
- spam projector operated by Science.

Player defense implemented:

- RED/BLUE point defense;
- directional shield;
- sticky-mine clearing;
- drive repair.

Enemy offense implemented:

- missile;
- laser;
- sticky mines;
- spam.

Enemy defensive/response behavior implemented:

- point-defense interception of player missiles;
- directional Engineer shield response to player laser;
- sticky-mine clearing;
- Science identification;
- Science purging of player spam;
- crew slowdown from active spam;
- crew-role occupation and offense/defense competition.

Enemy behavior is still prototype policy, not final personality AI.

Current policy still needs future work around:

- visible behavior-preset differences;
- retreat/surrender;
- subsystem targeting/damage;
- more intentional risk-taking;
- broader encounter goals.

---

# 7. Current architecture checkpoint

The recent cleanup sequence is complete.

Important completed structural work:

- combat folder grouped by responsibility;
- `BridgeCombatView` is the bridge combat-presentation composition root;
- `EncounterStateStore` is now a public facade over focused internal stores;
- player weapon families have concrete runners;
- enemy behavior has focused policy/scheduler/intel modules;
- snapshot transport and detached reads are centralized.

Current `EncounterStateStore` internal split:

```text
state/
├─ EncounterStateStore.ts
├─ actors/EncounterActorStore.ts
├─ navigation/EncounterNavigationStore.ts
├─ player/PlayerShipStore.ts
└─ officer_tasks/OfficerTaskStore.ts
```

Current bridge UI is still temporary:

```text
BridgeUiView
├─ BridgeShipStatusView
├─ BridgeEnemyTelemetryView
├─ BridgeEnemyDebugPanelView      optional debug
└─ BridgeOfficerContextMenuView   legacy command surface
```

The dashboard should replace the temporary status/telemetry presentation and,
after equivalent command/cancel functionality exists, the officer context menu.

Do not reopen the completed combat/state refactors while building dashboard UI.

Read:

```text
SYSTEM_MAP.md
```

before changing controller/transport ownership.

---

# 8. Important current UI facts

Current engine command availability already exists as:

```text
EncounterEngine.getAvailableCommands(role)
```

Current command execution already exists as:

```text
Bridge UI intent
→ BRIDGE_EVENT.OFFICER_COMMAND_SELECTED
→ BridgeEncounterController
→ EncounterEngine.executeCommand(...)
```

The captain dashboard should reuse this command path.
Do not duplicate gameplay availability rules in views.

Current continuous snapshots already expose much of the data needed for the
dashboard:

- player hull / drive / PD / shield generator;
- player weapon states;
- enemy telemetry;
- incoming missiles + time to impact + identification;
- laser threats + time to fire + identified target zone;
- sticky mines + fuse state;
- player/enemy shields.

Known presentation gap:

- the current bridge player-weapon payload does not include the player sticky
  mine dispenser;
- final enemy crew/intel/weakness information is not yet a proper player-facing
  knowledge model.

Do not fake final Science intel semantics in the view.

---

# 9. Immediate next execution order

Start the next chat with:

```text
1. user attaches latest dashboard mockup
2. inspect fresh master
3. compare mockup geometry to current 1280×720 bridge layers
4. lock first dashboard implementation atom
5. implement one coherent vertical slice
6. typecheck / tests / runtime
7. push
```

Recommended implementation order:

```text
A. dashboard composition + left player panel
B. player system action-button state model
C. combat right-side enemy/threat panel
D. dashboard command routing through existing engine commands
E. preserve task cancellation, then retire officer context menu
F. remove/rethink station combat hints after dashboard proves readable
G. navigation/contact/anomaly contexts later
```

Do not attempt every context in the first dashboard atom.

---

# 10. Design items deliberately not locked yet

Open:

- exact dashboard pixel dimensions;
- exact tab/mode presentation;
- exact active/disabled/engaged button art;
- whether tabs are `COMBAT / NAV / SHIP` or another set;
- where `ESCAPE / BREAK CONTACT` ultimately lives;
- global evasive-maneuver numbers;
- final Science enemy-intel model;
- final weapon/system damage model;
- keyboard/gamepad navigation;
- dashboard task-cancel affordance.

The next chat should not accidentally turn mockup placeholders into domain
contracts.

---

# 11. End-of-chat procedure

Before the next move:

1. read fresh `master`;
2. update latest verified commit;
3. update current active slice;
4. update `CAPTAIN_DASHBOARD_HANDOFF.md`;
5. update `SYSTEM_MAP.md` if ownership changed;
6. update `GAMEPLAY_CONTRACTS.md` if a design contract changed;
7. move deferred findings into `BACKLOG.md`;
8. update behavior/bridge reference docs only when their facts changed.
