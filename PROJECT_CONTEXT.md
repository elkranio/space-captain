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

Last updated: 2026-08-01

Latest verified `master`:

```text
66e5caadd0594cc0bc81dc3f429be9cce020b946
```

Current verification state:

```text
typecheck green
tests green
latest loadout-only atom does not require runtime smoke
enemy destruction / no-resurrection runtime acceptance passed
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

Apply-script process after the recent missile-source/loadout work:

1. Read fresh HEAD.
2. Search all affected usages and full-snapshot tests before writing the script.
3. Read exact factory/type contracts instead of inferring them from adjacent systems.
4. Prefer full-file rewrites for small files and tests.
5. Avoid broad regex replacements when the same field shape appears in several domain types.
6. Stage all edits in memory.
7. Validate exact replacement counts and final invariants.
8. Write only after all validation succeeds.

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

Future enemy defensive policy is deferred.

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

This is deferred, not part of the missile slice.

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
- missile ammunition.

`GameRuntime.setPlayerShipWeaponStates()` verifies that the installed loadout is not silently replaced:

- same count;
- same runtime IDs;
- same weapon kinds;
- same weapon definitions.

The runtime persistence contract is covered by tests.

Manual runtime verification of bridge reconstruction during an active weapon cooldown remains deferred because it requires an awkward setup.

---

# 12. Generic missile model

`MissileCombatProjectileState` now uses a generic source:

```ts
source:
    | { kind: 'actor'; actorId: string }
    | { kind: 'player_ship' }
```

Missile target already supports player ship or actor targets.

Existing incoming-missile behavior remains actor-sourced.

Science identification and point-defense command filters explicitly accept only:

```text
actor-sourced missile
→ targeted at player ship
```

A future player missile must not appear as an incoming threat.

The current bridge handler for `MISSILE_LAUNCHED` still assumes an actor-sourced incoming missile and rejects a player source.

The player missile slice must address this event/presentation boundary deliberately rather than passing a player projectile through the incoming-missile path unchanged.

---

# 13. Starter player missile launcher

The starter ship now has two installed weapons:

```text
laser_player_00
missile_launcher_player_00
```

The missile launcher uses:

```text
MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00
```

Current launcher state at new game:

```text
kind: missile_launcher
weaponId: missile_launcher_00
loadedMissileId: red_00
ammoCount: 5
phase: ready
phaseElapsedMs: 0
```

Initialization goes through `MissileLauncherFactory`.

The player ship preset points to a launcher preset rather than duplicating missile/ammunition content.

Typecheck and tests are green.

No player missile command or projectile lifecycle has been implemented yet.

---

# 14. Current checkpoint

Latest completed atoms:

```text
generic missile source
→ starter player missile launcher in loadout
```

Verified:

- existing enemy missiles still use actor source;
- threat identification ignores player-sourced missiles;
- point defense ignores player-sourced missiles;
- projectile snapshots detach nested source/target/identification objects;
- starter ship creates a fully loaded RED launcher;
- launcher state is fresh for every new run;
- full player weapon arrays are preserved by runtime persistence tests;
- laser command tests preserve the untouched launcher;
- typecheck passes;
- tests pass.

Latest verified commit:

```text
66e5caadd0594cc0bc81dc3f429be9cce020b946
```

---

# 15. Next selected slice

Next task:

```text
PLAYER MISSILE OFFENSE
```

Locked gameplay direction:

```text
launcher READY + ammo > 0 + live enemy
→ Weapons can choose FIRE MISSILE
→ Weapons performs missile aiming
→ cancellation before launch spends no ammo
→ launch spends one missile
→ Weapons becomes free immediately
→ launcher enters cooldown
→ projectile flies independently toward the enemy
→ enemy shield absorbs first
→ otherwise hull takes damage
→ normal enemy destruction flow may trigger
```

Target rules:

- one current hostile actor;
- no target-zone choice for the first missile version;
- if the target disappears during aiming, the task ends without spending ammo;
- if the target disappears after launch, the outgoing missile self-destructs/disappears;
- shield state is checked at impact, not launch.

Persistence rules:

- launcher mutable state persists through existing player weapon synchronization;
- the flying missile is encounter-local and must not persist.

Out of scope for this slice:

- enemy point defense;
- enemy evasive behavior;
- enemy Engineer shield decisions;
- general enemy defense policy;
- missile resupply;
- multiple player missile types;
- final outgoing-missile art until the view atom.

Detailed handoff and implementation order:

```text
PLAYER_MISSILE_HANDOFF.md
```

---

# 16. End-of-chat update procedure

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
PLAYER_MISSILE_HANDOFF.md
```

Then inspect fresh `master` before proposing code.
