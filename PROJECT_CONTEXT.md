# Space Captain — Project Context

Living handoff document for development of Space Captain.

Read this file first in every new development chat.

Current read order:

```text
PROJECT_CONTEXT.md
BRIDGE_V01_HANDOFF.md
SYSTEM_MAP.md
ENEMY_BEHAVIOR_HANDOFF.md
GAMEPLAY_CONTRACTS.md
BACKLOG.md
COMMAND_PALETTE_ART_PLAN.md   only when palette work resumes
```

`BRIDGE_V01_HANDOFF.md` is the active-slice document.

Last updated:

```text
2026-08-03
```

Latest verified `master`:

```text
42e8133c246962092c60202e39291c4368e4e6e8
```

Last code-bearing commit reported green by the user:

```text
42e8133c246962092c60202e39291c4368e4e6e8
```

Current checkpoint:

```text
combat architecture cleanup complete
explicit physical player-weapon command identity complete
typecheck green
tests green
active work moved from enemy behavior to bridge V0.1 migration
bridge shell, station and four seated-officer assets imported
Comms/HAIL/request-docking cut complete
normal Helm DOCK is direct at the current station
bridge shell/viewscreen geometry complete and runtime-verified
four modular station/officer views complete in the current atom
old five-seat presentation removed
enemy behavior implementation is paused, not discarded
```

---

# 1. Project

Space Captain is a comedic retro science-fiction bridge-command roguelite.

The player is an incompetent captain serving aboard an obsolete service ship
and gives commands to officers instead of directly controlling every system.

Core combat language:

```text
enemy telegraphs a threat
→ player gathers information
→ player allocates a limited officer/system
→ player chooses a response or accepts risk
→ the result is shown clearly on the bridge
```

Combat should remain:

- time-and-decision based;
- sparse and readable;
- centered on officer allocation;
- mechanically simpler than a tactical simulator;
- driven by overlapping responsibilities and limited resources;
- focused on one command-capable enemy ship by default.

Do not turn the game into:

- bullet hell;
- conventional RTS;
- spreadsheet combat;
- menu matching;
- architecture for hypothetical future systems.

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

- assistant uses GitHub read-only;
- user applies, tests and pushes;
- read fresh `master` before every code atom;
- after the user says "pushed", verify fresh HEAD and exact changed files;
- never combine stale source snapshots with current repository state.

Language:

```text
Russian
```

Delivery style:

- direct and practical;
- critical when needed;
- small coherent atoms;
- complete tests/files where patches are harder to reason about;
- no architecture for architecture's sake;
- refactor only when current cognitive load becomes lower.

Apply scripts:

- `.mjs` inside ZIP;
- exact HEAD guard;
- clean tracked tree guard;
- stage all transforms in memory;
- validate all replacement counts and final invariants before writing;
- rollback on write failure;
- self-delete only after success.

Art workflow:

- development chats are prompt/discussion/code chats;
- do not invoke image generation in these chats;
- when asked for visual work, provide critique, prompts or an art plan only;
- agree asset paths and atlas frame names before coding;
- warn before any atom that requires a new sprite/frame.

---

# 3. Technology

Stack:

- Phaser 3;
- TypeScript;
- Vite;
- Vitest;
- minimal `p34t` project foundation.

Target screen:

```text
1280 × 720
```

Main atlas key:

```text
atlas
```

Atlas frame names omit `.png`.

Main checks:

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
BRIDGE V0.1 VISUAL / VIEW MIGRATION
```

Goal:

```text
replace the old five-seat bridge presentation
with a functional four-station bridge layout
before resuming enemy behavior and command-palette work
```

Start with:

```text
slice/export current art
→ save production PNG assets
→ lock atlas frame names
→ rebuild atlas
→ migrate bridge shell and station views
```

Do not start by rewriting enemy behavior.

Do not start by implementing the final command palette.

Detailed plan:

```text
BRIDGE_V01_HANDOFF.md
```

---

# 5. Locked bridge design direction

Playable officer roles are now exactly:

- Science;
- Helm;
- Weapons;
- Engineer.

Comms is removed as a gameplay role.

Reason:

- `REQUEST DOCKING` is ritual interaction with no meaningful decision;
- the current `HAIL` prototype has no required gameplay function;
- four strong roles reduce cognitive load and make station layout clearer.

Locked command ownership direction:

```text
HELM
→ navigation, fly, dock, jump

SCIENCE
→ threat identification, analysis, spam work

WEAPONS
→ point defense and offensive weapons

ENGINEER
→ shields and repair
```

`REQUEST DOCKING`, `HAIL` and the current contact sequence/UI are removed.

Future contact/dialogue will be designed again when a real mission or content
requirement exists. It must not inherit the deleted officer-task flow by default.

Normal docking should not require a preliminary bureaucratic task.

Authored exceptions should be content/state:

```text
station contact gives a condition
→ map target/checkpoint is added
→ docking remains unavailable until condition is met
```

Normal `DOCK` is directly available from Helm at the current station when the
usual drive and bridge-idle requirements are satisfied.

---

# 6. Locked bridge V0.1 composition

Bridge camera:

- captain point of view;
- captain body is not visible;
- captain sprite is removed;
- lower foreground remains available for the future captain dashboard.

Visual structure:

- strict 16:9;
- large dominant panoramic viewscreen;
- four officer stations;
- shallow chevron layout;
- Helm and Weapons are the inner pair nearer the viewscreen;
- Science and Engineer are the outer pair slightly nearer the captain;
- no Comms station;
- no VIP chair in V0.1;
- dashboard is deferred;
- current debug/status panels remain until a real dashboard replaces them.

Exact left/right ordering of Helm and Weapons must follow the accepted composite
source during slicing. Do not infer a new order from old five-seat layouts.

Current art is functional placeholder art, not release art.

The target final vibe remains:

- early-1990s Sierra VGA;
- Space Quest V spirit;
- chunky readable pixel forms;
- slightly worn service ship;
- comedic retro sci-fi;
- not glossy modern sci-fi.

For V0.1, gameplay readability and modularity are more important than perfect
style matching.

---

# 7. Station V0.1 design

The station is a separate transparent sprite.

Current station contract:

- one compact console body;
- one large mostly unobstructed monitor;
- one dark idle screen base;
- one touch/control panel beneath the monitor;
- small unlit indicator recesses integrated near the control area;
- no chair;
- no officer;
- no active task icon baked into the asset;
- no progress bar baked into the asset;
- no active lights baked into the asset.

The touch panel replaces a literal keyboard.

Later, when an officer visually works, the view may draw simple animated
touches/pulses over the panel.

Officer/chair sprites are deferred because they currently add no mechanic:

- officers do not turn;
- they do not sleep;
- they do not visually argue;
- they do not leave the station;
- barks can be displayed over the station.

Do not create officer sprites merely to complete the picture.

Station monitor is the local task surface:

```text
idle
→ role-neutral idle screen

active task without visible progress
→ task icon / activity state

active task with visible progress
→ task icon + progress bar

blocked/interrupted
→ clear local state treatment
```

The station body, monitor UI and interaction/activity overlays must remain
separate concerns.

---

# 8. Current architecture checkpoint

The architecture cleanup before command-palette work is complete.

Implemented and locked:

1. gameplay/persistence contracts documented;
2. player hull is authoritative in `EncounterState`;
3. applied hull results are synchronized exactly into `GameRuntime`;
4. surviving enemy hull/ammo/system state resets from node actor baseline on
   encounter reconstruction;
5. destroyed enemy actors remain removed persistently;
6. `EnemyDecisionPolicy.selectWork()` is the single enemy-work decision owner;
7. `EnemyTaskScheduler` validates/starts policy intents but owns no strategic
   priorities;
8. `doesShipWeaponPhaseRequireOperator()` is the shared crew-occupation query;
9. `CombatRunner.step()` exposes explicit phase order;
10. `BridgeEncounterRuntimeSynchronizer` owns event-driven persistence writes;
11. `BridgeEncounterEngineEventHandler` owns presentation/scene flow only;
12. physical missile launchers and mine dispensers preserve exact `weaponId`
    through availability, validation and execution.

Current readable combat phase order:

```text
capture
→ integrate
→ perceive
→ resolve existing objects
→ perceive
→ decide
→ execute
→ finalize
```

Do not reopen these ownership decisions during the visual migration.

Read:

```text
SYSTEM_MAP.md
GAMEPLAY_CONTRACTS.md
```

before touching combat order, enemy cognition or persistence.

---

# 9. Enemy behavior checkpoint

Enemy behavior foundation is implemented.

Current information chain:

```text
objective player threat
→ EnemyThreatObserver
→ actor-local observation
→ enemy Science task
→ EnemyScienceIntelResolver
→ report, possibly wrong
→ EnemyDecisionPolicy
```

Current policy behavior:

- selects one `EnemyWorkIntent` for a requested role;
- Science prioritizes unresolved missile/laser observations;
- otherwise each role selects an available weapon;
- weapon selection uses role-local round-robin in loadout order;
- completed offensive tasks apply a role-local delay;
- unavailable weapons are skipped;
- cooldown does not keep the crew role occupied.

Current scheduler roles:

```text
WEAPONS
SCIENCE
```

Actual defensive behavior is not implemented yet.

Missing:

- enemy point defense against player missiles;
- enemy directional shield response against player lasers;
- enemy sticky-mine clearing;
- meaningful differences between behavior presets;
- priority grammar for offense versus defense;
- intentional delay/failure when the needed role is busy.

The current development encounter still omits enemy Science, so spam remains
disabled there.

Detailed resume document:

```text
ENEMY_BEHAVIOR_HANDOFF.md
```

---

# 10. Current combat capability

Player offense V0 implemented:

- laser;
- missile;
- sticky-mine dispenser.

Player defense implemented:

- RED/BLUE point defense;
- directional shield;
- sticky-mine clearing by allowed officers;
- main-drive repair.

Enemy offense implemented:

- missile;
- laser;
- sticky mines;
- spam system exists but is disabled in the development encounter without
  Science.

Enemy destruction and persistence behavior are implemented.

Combat objects remain encounter-local.

Surviving enemy mutable combat state resets on encounter reconstruction.

Destroyed enemy actors do not return.

---

# 11. Command palette checkpoint

Architecture blockers for the palette are closed.

The palette itself is not implemented.

The old text context menu and polling flow still exist.

Current plan is deferred until after bridge V0.1 migration.

Important current decisions:

- four officer roles only;
- stable icon positions;
- unavailable commands remain visible but disabled;
- direct action is one click;
- a compact second row appears only for a real choice;
- each installed physical launcher/dispenser keeps its own slot;
- exact physical `weaponId` is already available in command targets;
- station monitor displays current task/progress;
- palette displays available actions;
- future captain actions remain outside officer palettes;
- the final captain dashboard is not part of the current art migration.

Updated plan:

```text
COMMAND_PALETTE_ART_PLAN.md
```

---

# 12. Next execution order

Use this order unless a fresh repo inspection exposes a blocker:

```text
A. art-only preparation — complete
   - export bridge shell
   - export station base
   - confirm transparency and dimensions
   - lock atlas paths/frame IDs
   - pack atlas

B. Comms gameplay cut — complete in the current atom
   - remove REQUEST DOCKING flow
   - make normal DOCK direct when eligible
   - remove HAIL/contact flow and rebuild it later from real requirements
   - remove Comms from playable officer roster and tests

C. bridge shell migration — complete
   - replace old bridge background/shell
   - preserve viewscreen/world/VFX layering and bounds
   - keep temporary debug status panels

D. four-station view migration — complete in the current atom
   - one reusable station view
   - four role placements
   - stable role hit areas
   - remove old fifth-seat presentation

E. station activity UI
   - task icon
   - optional progress
   - touch-panel work animation
   - ready/busy/blocked/selected treatment
   - bark anchors

F. runtime acceptance
   - navigation
   - contact
   - missile/laser/mines
   - task lifecycle
   - open menus / command access
   - enemy destruction
   - 1280×720 readability

G. resume command palette or enemy behavior
   - decide explicitly after the new bridge is playable
```

Do not combine all stages into one giant atom.

---

# 13. End-of-chat procedure

Before moving again:

1. read fresh `master`;
2. update latest verified commit;
3. update current active slice;
4. update `BRIDGE_V01_HANDOFF.md`;
5. update `ENEMY_BEHAVIOR_HANDOFF.md` only if behavior code changed;
6. move deferred findings into `BACKLOG.md`;
7. remove statements that are no longer true;
8. push docs with the final code/art checkpoint.
