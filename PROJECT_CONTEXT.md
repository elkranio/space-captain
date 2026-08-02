# Space Captain — Project Context

Living handoff document for development of Space Captain.

Read this file at the start of every new development chat.

Update it at the end of the chat when any of the following changes:

- current implementation checkpoint;
- active gameplay contract;
- architecture;
- next intended task;
- important collaboration rules;
- latest verified commit.

Last updated: 2026-08-02

Latest verified `master`:

```text
3a75356b9dff1dcbb04486f9f9400c904ed1de6d
```

Current verification state:

```text
typecheck green
tests green
player sticky-mine offense runtime acceptance passed
outgoing sticky-mine presentation verified in runtime
combat lifecycle/refactor pass closed
player laser, missile and sticky-mine hull contracts green
next selected work: enemy behavior policy pass
```

---

# 1. Project

Space Captain is a comedic retro science-fiction bridge-command roguelite.

The player is the captain of an obsolete starship and gives commands to officers instead of directly controlling every ship system.

The central gameplay language is:

```text
enemy telegraphs a threat
→ player gathers information
→ player assigns a limited officer/system
→ player chooses an exact response or accepts risk
→ the result is shown clearly on the bridge
```

Combat should remain:

- time-and-decision based;
- readable;
- sparse;
- centered on officer allocation;
- mechanically simpler than a tactical simulator;
- driven by overlapping responsibilities and limited resources.

The game should not become:

- bullet hell;
- conventional real-time strategy;
- spreadsheet combat;
- a menu where the player only matches identical words;
- architecture built for hypothetical future features.

One command-capable enemy ship per encounter is the intended default.

---

# 2. Collaboration and delivery rules

Repository:

```text
elkranio/space-captain
```

Main branch:

```text
master
```

GitHub workflow:

- assistant uses GitHub as read-only;
- user edits, tests and pushes;
- before proposing code, assistant reads fresh `master`;
- after the user says changes were pushed, assistant checks the new HEAD and diff;
- never combine code from an old checkpoint with current repository state.

Conversation language:

```text
Russian
```

Preferred response style:

- direct;
- practical;
- critical when necessary;
- small coherent implementation atoms;
- no generic praise;
- no unnecessary architecture;
- no speculative refactors unless they reduce cognitive load now.

Code delivery:

- provide complete files by default for tests;
- provide complete files for small or nontrivial source files when patches are harder to reason about;
- several files in one atom are acceptable when they form one behavior;
- generated apply scripts are delivered as `.mjs` inside a ZIP;
- apply scripts use an exact HEAD guard;
- transformations must be fully validated before any source file is written;
- scripts self-delete only after successful apply.

Apply-script process:

1. Read fresh HEAD.
2. Search all affected usages and full-snapshot tests before writing the script.
3. Read exact factory/type contracts instead of inferring them from adjacent systems.
4. Prefer full-file rewrites for small files and tests.
5. Avoid broad regex replacements when the same field shape appears in several domain types.
6. Stage all edits in memory.
7. Validate exact replacement counts and final invariants.
8. Write only after all validation succeeds.
9. After revising an apply script, audit the whole script for stale identifiers and stale section markers.
10. When an apply fails, re-check the complete transform instead of patching only the reported line.
11. A range helper must document whether it preserves the end marker; never include a preserved marker again in the replacement.
12. Recovery scripts must repair only the failed invariant. Do not mix unrelated cleanup into a repair atom.

Meaning of common user messages:

```text
грин
```

The current atom passed the requested check.

```text
грин пас пуш
```

Typecheck/tests passed and the result was pushed. Read fresh `master` before continuing.

Art workflow:

- do not generate images unless explicitly requested;
- when asked for an image prompt, provide only the prompt;
- agree asset paths and manifest changes before implementation.

---

# 3. Technology

Core stack:

- Phaser 3;
- TypeScript;
- Vite;
- Vitest;
- minimal `p34t` Phaser wrapper/project foundation.

Target resolution:

```text
1280 × 720
```

Main scripts:

```bash
npm run typecheck
npm test
npm run dev
npm run build
npm run pack:tex
npm run pack:sfx
```

Main texture atlas key:

```text
atlas
```

Atlas frame names do not include `.png`.

---

# 4. Architecture and state ownership

The repository separates engine code from Phaser/application code.

```text
src/engine
```

Contains gameplay/domain state, rules, content and factories.

```text
src/app
```

Contains Phaser scenes, controllers, views, runtime integration and presentation events.

General rules:

- scenes remain dumb containers;
- controllers coordinate flows;
- views display prepared state;
- views do not read `GAME_RUNTIME` directly;
- engine rules do not depend on Phaser;
- persistent run state belongs to `GameRuntime`;
- encounter state is a mutable runtime snapshot owned by `EncounterEngine` / `EncounterStateStore`;
- engine emits encounter events through an outbox;
- app integration translates domain events into runtime updates and bridge presentation events;
- avoid multiple authoritative sources for the same mutable value;
- prefer explicit code over generic frameworks.

Current ship/content composition direction:

```text
ShipChassisDefinition → physical base
ShipPreset            → equipment/loadout
CrewPreset            → abstract roles
BehaviorPreset        → enemy policy
ShipNodeActorPreset   → composition
```

Current persistent player state includes:

- hull;
- main drive;
- point-defense charges;
- shield-generator state;
- installed weapon states;
- navigation;
- generated persistent anchors.

Current persistent universe state includes enemy ship actors until they are removed or destroyed.

Current combat ownership after the refactor pass:

- `EncounterStateStore.damageEnemyActorHull()` is the single mutation path for enemy hull damage from player laser, missile and sticky mines;
- `EncounterStateStore.findPlayerWeaponById()` is the shared runtime weapon lookup;
- player missile launches and sticky-mine attachments are queued only across the runner integration boundary;
- at the start of a combat step, pre-existing projectile/mine IDs are snapshotted;
- newly launched player combat objects are flushed before old objects resolve, but do not receive the current step's `deltaMs`;
- old objects advance by stable ID, so lethal cleanup can safely remove related objects during iteration;
- destroying an enemy actor resolves remaining player missiles/mines as `TARGET_LOST` before actor removal and `ENEMY_SHIP_DESTROYED`.

Do not replace these narrow ownership rules with a generic combat/effect framework.

---

# 5. Bridge, officers and tasks

The bridge has five officer roles:

- Helm;
- Comms;
- Science;
- Weapons;
- Engineer.

Officer commands create officer tasks.

Tasks include:

- task ID and kind;
- role;
- source command ID;
- task-specific target data;
- label;
- progress visibility;
- elapsed/total duration;
- cancellation/interruption flags.

Manual task cancellation is implemented.

Busy officer menus can show:

```text
CANCEL TASK
```

Cancellation rules are task-specific.

An open officer menu polls command availability approximately every 200 ms.

Current bridge/application structure includes:

- `BridgeController`;
- `BridgeEncounterController`;
- `BridgeEncounterEngineEventHandler`;
- `BridgeOfficerCommandMenuController`;
- `BridgeUiView`;
- encounter object/threat/VFX views.

The temporary status and telemetry panels are prototype UI, not the final diegetic captain desk.

---

# 6. Navigation and encounter-local state

Player navigation is persistent.

Implemented navigation/contact flows include:

- REQUEST DOCKING;
- HAIL;
- PLOT COURSE;
- FLY TO;
- DOCK;
- JUMP;
- jump-point creation;
- arrival/travel/jump presentation.

Combat objects are encounter-local:

- flying missiles;
- active laser attacks;
- sticky mines attached during the current encounter;
- directional shield deployments;
- spam channels;
- presentation-only effects.

Locked persistence rule:

```text
leave the zone / reconstruct the encounter
→ all active combat objects disappear
```

Do not persist combat projectiles or temporary combat effects.

The exception is the enemy ship actor itself:

```text
enemy ship survives travel/re-entry while alive
enemy ship is removed persistently when destroyed
```

---

# 7. Enemy combat 1.0

Enemy combat uses abstract crew roles and behavior policy.

Current offensive roles:

- WEAPONS serializes missile, laser and sticky-mine attacks;
- SCIENCE can operate spam independently when present.

Current scheduler properties:

- independent role availability;
- approximately 2000 ms role delay before offensive work;
- deterministic weapon selection for the current prototype;
- current WEAPONS rotation is missile → laser → sticky mines;
- weapon cooldown does not keep the role occupied;
- role remains occupied only while operator control is required.

Current development encounter intentionally removes enemy SCIENCE from its local crew roles.

Reason:

```text
keep spam isolated while player offense is being completed
```

The Spam Projector remains installed but cannot run without SCIENCE.

Enemy telemetry is shown in a temporary bridge panel.

It exposes enough state to test shields/hull and player offense without adding a floating HP bar over the ship.

Enemy behavior policy is the next selected work.

The existing `EnemyDecisionPolicy`, `EnemyTaskScheduler`, behavior presets and role constraints were deliberately left unchanged during the refactor pass.

Before editing them, lock the intended behavior grammar. Do not turn the deterministic prototype into either a generic AI framework or a set of hardcoded reactions.

---

# 8. Player defense

Implemented defensive responses include:

## Point defense

Weapons offers:

```text
RED BEAM
BLUE BEAM
```

Accepted point-defense commands spend a charge immediately when `PD AIM` begins.

Cancellation, interruption or disappearing targets do not refund the charge.

## Directional shields

Engineer deploys a shield to:

```text
LEFT
CENTER
RIGHT
```

A matching zone blocks an enemy laser and consumes the shield.

## Sticky mines

Sticky mines attach to the hull.

Any allowed officer can clear them.

The clear command automatically targets the mine nearest detonation.

The mechanic is intended to force cycling through officers rather than one permanent counter role.

## Drive disruption and repair

The hostile opening disruption pulse can disable the main drive.

Engineer can use:

```text
REPAIR ENGINE
```

Drive state persists in `GameRuntime`.

---

# 9. Player laser offense

Player Offense 1.0 laser flow is implemented:

```text
FIRE LASER
→ choose LEFT / CENTER / RIGHT
→ Weapons performs LASER AIM
→ player laser enters TARGETING
→ CHARGING
→ visible beam
→ enemy shield absorbs first
→ otherwise enemy hull takes damage
→ cooldown
```

Current lifecycle:

```text
TARGETING: 3000 ms
CHARGING: 12000 ms
COOLDOWN: 15000 ms
```

Player laser presentation includes:

- visible temporary player weapon mount;
- shared retro charge effect;
- beam from the player side to the selected enemy zone;
- blocked or hull-hit impact effect.

Current minor presentation limitation:

```text
the first TARGETING phase is represented mainly by the officer task;
the large visible charge effect begins at CHARGING
```

This is deferred and is not part of the enemy behavior pass.

---

# 10. Enemy destruction and encounter continuation

Enemy destruction flow is implemented and runtime-verified:

```text
enemy hull reaches 0
→ enemy actor removed from encounter state
→ enemy actor removed from persistent node state
→ enemy telemetry clears
→ hostile active laser/spam state clears
→ short pixel explosion
→ enemy sprite disappears
→ bridge interaction resumes
→ player remains in the current node/anchor
```

Enemy destruction does not transition to `EndScene`.

A short approximately 600 ms cinematic pause freezes encounter updates during the explosion.

Threat behavior after enemy destruction:

- already launched enemy missiles remain and continue;
- already attached sticky mines remain and continue;
- enemy tasks, weapons, spam and active charging lasers stop.

Runtime acceptance passed:

- enemy destroyed;
- FLY TO away/back does not resurrect it;
- JUMP away/back does not resurrect it.

---

# 11. Player weapon persistence

Installed player weapon state is synchronized from the encounter snapshot back into `GameRuntime`.

Mutable state includes values such as:

- phase;
- phase elapsed time;
- missile and sticky-mine ammunition.

`GameRuntime.setPlayerShipWeaponStates()` verifies that the installed loadout is not silently replaced:

- same count;
- same runtime IDs;
- same weapon kinds;
- same weapon definitions.

The runtime persistence contract is covered by tests.

Manual runtime verification of bridge reconstruction during an active weapon cooldown remains deferred because it requires an awkward setup.

---

# 12. Missile model and presentation boundary

`MissileCombatProjectileState` supports both sources:

```ts
source:
    | { kind: 'actor'; actorId: string }
    | { kind: 'player_ship' }
```

Incoming-threat rules remain strict:

```text
actor-sourced missile
→ targeted at player ship
→ may appear in Science identification and player point-defense commands
```

Player missiles use a separate presentation contract:

- `PLAYER_MISSILE_LAUNCHED`;
- `PLAYER_MISSILE_RESOLVED`;
- `OUTGOING_MISSILE_ADDED`;
- `OUTGOING_MISSILES_UPDATED`;
- `OUTGOING_MISSILE_REMOVED`.

Incoming and outgoing missile views do not share lifecycle events.

Current atlas frames:

```text
combat/missiles/generic_incoming_00
combat/missiles/generic_outgoing_00
```

The outgoing sprite is authored nose-up and is rotated by the view along its trajectory.

Flying missiles remain encounter-local.

---

# 13. Player missile offense

Player missile offense V0 is implemented and runtime-verified.

Current flow:

```text
launcher READY + ammo > 0 + live enemy
→ Weapons chooses FIRE MISSILE
→ Weapons performs MISSILE AIM
→ cancellation before launch spends no ammo
→ launch spends one missile
→ Weapons becomes free immediately
→ launcher enters cooldown
→ missile flies independently
→ live target takes direct hull damage
→ existing enemy destruction flow may trigger
```

Locked impact rule:

```text
enemy shield generator does not interact with missiles
point defense is the missile counter
```

Enemy point defense is not implemented yet.

Target-loss rules:

- target disappears during aiming → cancel/reset, no ammunition spent;
- target disappears after launch → projectile disappears without damage.

Persistence rules:

- launcher phase, phase elapsed time and ammunition persist through player weapon synchronization;
- the flying projectile does not persist outside the encounter.

Starter launcher:

```text
runtime id: missile_launcher_player_00
weapon: missile_launcher_00
loaded missile: red_00
capacity: 5
```

Player weapon status is visible in the temporary bridge panel:

```text
LASER READY / AIM / CHG / CD
MISSILE current/max READY / AIM / CD / EMPTY
```

The UI-only `EMPTY` label means:

```text
domain phase READY + ammoCount 0
```

There is no separate domain `EMPTY` phase.

---

# 14. Player sticky-mine offense

Player sticky-mine offense V0 is implemented and runtime-verified.

Current flow:

```text
dispenser READY + ammo > 0 + live enemy
→ Weapons chooses FIRE MINES
→ non-cancellable MINE SALVO task begins
→ first mine launches on the next encounter step, including step(0)
→ one mine is spent at each physical launch
→ mines launch at 1000 ms intervals
→ Weapons remains busy until the final actual launch
→ dispenser enters cooldown
→ each attached mine keeps its own fuse
→ each detonation deals direct enemy hull damage
→ cumulative detonations may destroy the target
```

Starter dispenser contract:

```text
capacity: 6
salvo size: 3
launch interval: 1000 ms
post-salvo cooldown: 15000 ms
mine fuse: 7500 ms
mine damage: 1
```

A final partial salvo is valid when fewer mines remain than the configured salvo size.

Interruption and target-loss contract:

- before the first mine launches → ammunition unchanged, dispenser returns to `READY`, no cooldown;
- after at least one mine launches → already attached mines continue, unlaunched ammunition is preserved, dispenser enters `COOLDOWN`, Weapons becomes free;
- manual player cancellation is never allowed;
- damage may interrupt the active salvo;
- attached mines targeting a destroyed actor resolve as `TARGET_LOST` during actor cleanup.

Domain/presentation boundary:

```text
physical launch
→ ammo -1
→ mine immediately attaches in domain state
→ fuse begins
→ presentation may show a short visual flight to a stable enemy slot
```

There is no separate mine flight state in V0.

Incoming player-hull mines and outgoing enemy-hull mines remain separate presentation flows.

---

# 15. Current checkpoint

Latest completed work:

```text
PLAYER STICKY-MINE OFFENSE V0
+
COMBAT LIFECYCLE / COGNITIVE-LOAD REFACTOR PASS
```

Completed and verified:

- player sticky-mine content, dispenser preset/factory validation and starter loadout;
- FIRE MINES command and non-cancellable Weapons salvo task;
- per-launch ammunition spend, partial final salvos and post-launch cooldown rules;
- independent attached mine fuses and cumulative direct hull damage;
- target-loss and damage-interruption contracts;
- dedicated outgoing sticky-mine events, snapshots and Phaser views;
- stable enemy-space mine slots and encounter-local cleanup;
- immediate actor-dependent player projectile/mine cleanup;
- safe same-step ordering when a new launch and an old lethal object share a step;
- stable-ID advancement after lethal cleanup;
- centralized enemy hull mutation;
- centralized player weapon lookup;
- shared current enemy ship command query;
- shared anchored combat test support;
- typed player-weapon target task guard;
- typecheck green;
- tests green.

Latest verified commit:

```text
3a75356b9dff1dcbb04486f9f9400c904ed1de6d
```

The refactor pass is closed.

Do not continue opportunistic cleanup before enemy behavior work. Remaining presentation, balance and UI items live in `BACKLOG.md`.

---

# 16. Next selected slice

Next selected work:

```text
ENEMY BEHAVIORS — POLICY PASS
```

Important starting facts:

- enemy offense already runs through behavior presets, `EnemyDecisionPolicy` and `EnemyTaskScheduler`;
- WEAPONS currently uses deterministic missile → laser → sticky-mine rotation;
- SCIENCE can run spam independently when the role exists;
- the current development enemy intentionally omits SCIENCE;
- role occupancy and weapon cooldowns already constrain enemy actions;
- the refactor pass deliberately did not alter enemy scheduling or policy.

At the start of the next chat:

1. Read fresh `PROJECT_CONTEXT.md` and `BACKLOG.md`.
2. Inspect behavior presets, `EnemyDecisionPolicy`, `EnemyTaskScheduler`, enemy weapon runners and existing tests.
3. Describe the current decision flow before proposing changes.
4. Lock the behavior grammar on paper.
5. Select one vertical behavior slice before code.

Likely questions for the design pass:

- what makes two enemy behavior presets play differently;
- how policy prioritizes offense versus defense;
- which enemy role operates point defense and directional shields;
- whether a busy role causes delayed defense, deliberate failure or a fallback;
- what information the player sees before and after an enemy decision.

Locked direction:

```text
enemy captain = policy
enemy crew roles = constrained operators
```

Do not implement the command UI redesign during this slice. It follows enemy behavior work.

---

# 17. End-of-chat update procedure

Before moving to a new chat:

1. Read fresh `master`.
2. Update latest verified master.
3. Update current checkpoint.
4. Update changed gameplay contracts.
5. Update next selected work.
6. Move deferred discoveries into `BACKLOG.md`.
7. Remove statements that are no longer true.
8. Update or remove the active handoff file when its slice closes.
9. Push the documentation with the final implementation checkpoint.

At the start of the next chat, read:

```text
PROJECT_CONTEXT.md
BACKLOG.md
```

Then inspect fresh `master` before proposing code.
