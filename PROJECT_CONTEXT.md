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

Last updated: 2026-07-31

Latest verified `master`:

```text
761414fbe96568c23f1851a40a6355d181da1437
```

Current state:

```text
typecheck green
tests green
runtime smoke test green
```

---

# 1. Project

Space Captain is a comedic retro science-fiction bridge-command game.

The player is the captain of an obsolete starship and gives commands to officers instead of directly controlling every ship system.

The central gameplay language is:

```text
enemy telegraphs a threat
→ player gathers information
→ player assigns a limited officer/system
→ player chooses an exact counter or accepts risk
→ the result is shown clearly on the bridge
```

The game should not become:

- bullet hell;
- conventional real-time strategy;
- spreadsheet combat;
- a menu where the player merely matches identical words;
- architecture built for hypothetical future features.

The intended experience is mostly about:

- time;
- incomplete information;
- officer allocation;
- prioritization;
- limited ship resources;
- accepting risk under pressure.

Combat should normally contain a small number of readable threats rather than many simultaneous projectiles.

---

# 2. Collaboration rules

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
- after the user says that changes were pushed, assistant checks the new HEAD and diff;
- never combine code from an old checkpoint with the current repository state.

Conversation language:

```text
Russian
```

Preferred response style:

- direct;
- practical;
- critical when necessary;
- small implementation atoms;
- no generic praise;
- no unnecessary architecture;
- no speculative refactors unless they reduce cognitive load now.

Code delivery:

- provide complete files by default for tests;
- provide complete files for nontrivial source changes when patching would be difficult to reason about;
- several files in one atom are acceptable when they form one coherent behavior;
- do not split one simple behavior into many tiny ceremonial steps;
- for generated apply scripts, package the `.mjs` file inside a ZIP.

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
- asset paths and manifest changes should be agreed before committing implementation.

---

# 3. Technology

Core stack:

- Phaser 3;
- TypeScript;
- Vite;
- Vitest;
- minimal `p34t` Phaser wrapper/project foundation.

Target game resolution:

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

# 4. Architecture principles

The repository separates engine code from Phaser/application code.

```text
src/engine
```

Contains gameplay/domain state and rules.

```text
src/app
```

Contains Phaser scenes, controllers, views, runtime integration and presentation events.

General rules:

- scenes should remain dumb containers;
- controllers coordinate flows;
- views display already prepared state;
- views should not read `GAME_RUNTIME` directly;
- engine rules should not depend on Phaser;
- persistent run state belongs to `GameRuntime`;
- encounter state is a mutable runtime snapshot used by `EncounterEngine`;
- engine emits encounter events through an outbox;
- app integration translates encounter events into persistent runtime updates and bridge-local presentation events;
- avoid multiple authoritative sources of the same runtime state;
- avoid duplicate parallel folder structures;
- prefer plain `string` IDs unless a stronger type clearly prevents mistakes;
- explicit code is preferred over generic frameworks when both are correct.

Content configuration belongs under:

```text
src/engine/content
```

Presentation asset manifests belong under:

```text
src/app/manifests
```

Refactors are justified when they:

- remove duplicated runtime truth;
- make ownership clearer;
- reduce jumps between files;
- reduce cognitive load;
- prevent a demonstrated bug.

Refactors are not justified merely because:

- a file is long;
- a more generic architecture might be useful later;
- several concrete systems could theoretically share a framework.

---

# 5. Visual direction

The visual target is original early-1990s Sierra VGA comedy science fiction, with the general atmosphere of Space Quest-era bridge interfaces.

Visual characteristics:

- chunky visible pixels;
- limited VGA-style color ramps;
- crisp nearest-neighbor edges;
- selective dithering;
- readable silhouettes;
- dark navy, purple and blue bridge interior;
- warm ivory/yellow reusable controls;
- humorous retro-industrial machinery.

Avoid:

- modern glossy science-fiction concept art;
- photorealistic military design;
- smooth anti-aliased rendering;
- tiny unreadable detail;
- debug-looking UI in normal gameplay.

Current flat status panels and labels are temporary prototype presentation.

---

# 6. Bridge, officers and tasks

The bridge has five main officer roles:

- Helm;
- Comms;
- Science;
- Weapons;
- Engineer.

Officer commands create officer tasks.

`OfficerTaskState` includes:

- task ID;
- task kind;
- officer role;
- source command ID;
- task-specific target data;
- label;
- progress visibility;
- elapsed and total duration;
- `canBeCancelledByPlayer`;
- `canBeInterruptedByDamage`.

Task duration may be `null` for indefinite tasks such as HAIL.

Officer availability is derived from current encounter state and tasks.

Officer stations display:

- ready/busy/blocked lights;
- blinking activity label;
- optional progress bar.

Manual task cancellation is implemented.

Busy officer menus can show:

```text
CANCEL TASK
```

Cancellation rules are task-specific:

- cancellable tasks can be cancelled by the player;
- damage only selects tasks marked `canBeInterruptedByDamage`;
- cancelled/interrupted timed work loses its progress;
- resource costs already paid at task start are not refunded unless a future rule explicitly says otherwise.

An open officer command menu refreshes available commands by polling the engine approximately every 200 ms.

Officer commands should eventually be reachable with keyboard keys `1–5` and should remain gamepad-friendly.

---

# 7. Navigation and encounters

Player navigation state is persistent.

Encounter state is reconstructed from:

- current space node;
- persistent player navigation;
- persistent drive state;
- persistent point-defense state;
- persistent shield-generator state.

Implemented navigation/contact flows include:

- REQUEST DOCKING;
- HAIL;
- PLOT COURSE;
- FLY TO;
- DOCK;
- JUMP;
- jump-point creation;
- arrival/travel/jump presentation.

The obsolete player ship cannot create a stable jump window by itself.

Science locates a temporary natural spatial distortion and computes a navigational solution around it.

The current pseudo-3D travel presentation uses:

- horizontal panorama;
- parallax;
- step-like low-frame-rate motion;
- runtime encounter objects positioned using local coordinates and perspective depth.

Drive-dependent commands are currently:

```text
FLY TO
DOCK
JUMP
```

They require the main drive to be `ONLINE`.

Future maneuvering commands such as EVADE must not automatically require the main drive.

---

# 8. Current combat slice

Combat now contains three enemy weapon families:

- missile launcher;
- laser;
- spam projector.

Enemy weapons share a phase lifecycle built around states such as:

```text
READY
TARGETING
CHARGING / CHANNELING
COOLDOWN
```

The combat loop remains intentionally sparse and readable.

Encounter step order is explicit.

Officer tasks resolve before missile impact in the same step, so point defense wins an exact timing tie.

---

# 9. Missiles, identification and point defense

Incoming missiles initially appear unidentified.

Science command:

```text
IDENTIFY THREAT
```

Current duration:

```text
3000 ms
```

Identification reveals the missile spectral band:

```text
RED
BLUE
```

Weapons commands:

```text
RED BEAM
BLUE BEAM
```

Point-defense aiming duration:

```text
3000 ms
```

Correct beam band:

```text
HIT
```

Wrong beam band:

```text
MISS
```

Point-defense charges:

```text
4 / 4
```

Current charge contract:

```text
accepted point-defense command
→ charge is spent immediately
→ PLAYER_POINT_DEFENSE_CHARGE_SPENT event
→ PD AIM task begins
```

Additional rules:

```text
HIT
→ no additional charge is spent

MISS
→ no additional charge is spent

task cancelled
→ charge is not refunded

task interrupted by damage
→ charge is not refunded

target disappears before aim completes
→ charge is not refunded
→ no shot presentation occurs

command rejected
→ charge is not spent

0 charges
→ RED BEAM and BLUE BEAM are not offered
```

The encounter snapshot is authoritative while the encounter is running.

Runtime persistence is updated through encounter events rather than per-frame synchronization.

Current content limitation:

```text
Only RED missile content exists.
```

Therefore BLUE BEAM is currently always the wrong choice.

---

# 10. Lasers and directional shields

Enemy lasers:

- telegraph a charging threat;
- choose a target zone;
- become identifiable by Science;
- fire after their charge window;
- damage hull when unblocked.

Player shield zones:

```text
LEFT
CENTER
RIGHT
```

Engineer deploys a directional shield to one zone.

A matching shield blocks the laser and is consumed.

A mismatched or absent shield allows the laser to hit.

Shield-generator charges are persistent ship state and synchronize back into `GameRuntime`.

Shield charges regenerate according to the installed generator rules.

---

# 11. Spam projector

The hostile Spam Projector uses:

```text
READY
→ TARGETING
→ CHANNELING
→ COOLDOWN
```

Current timing:

```text
TARGETING: 3000 ms
CHANNELING: 20000 ms
COOLDOWN: 15000 ms
```

While a hostile spam channel is active:

- spam popups appear over the bridge viewscreen;
- officer task progress is slowed;
- several active channels use the strongest slowdown rather than stacking multiplicatively.

Science command:

```text
PURGE SPAM
```

Base purge duration:

```text
5000 ms
```

Because spam slows officer work, the effective first purge currently takes approximately:

```text
10000 ms
```

Natural channel expiry cancels a purge task whose target channel no longer exists.

Seven retro spam popup assets currently exist under:

```text
assets/raw/images/combat/spam
```

---

# 12. Player main drive and opening disruption pulse

Player drive state:

```text
ONLINE
DISABLED
```

The drive is persistent player ship state and is copied into the encounter snapshot.

Hostile ships currently perform an opening disruption pulse:

- hostile ships pulse when an encounter becomes interactive;
- a ship that changes from neutral to enemy pulses at that transition;
- each source ship can use the pulse only once per encounter;
- simultaneous hostile ships all consume their one-shot pulse;
- only the first `ONLINE → DISABLED` transition causes drive disruption consequences.

Drive disruption:

- sets the player drive to `DISABLED`;
- cancels active officer tasks whose source command requires an online drive;
- rolls an interrupted FLY TO navigation state back to its original anchor;
- synchronizes both drive and navigation into `GameRuntime`;
- emits a bridge presentation event.

Engineer command:

```text
REPAIR ENGINE
```

Duration:

```text
12000 ms
```

Repair behavior:

- task is cancellable;
- task can be interrupted by damage;
- cancellation/interruption loses all progress;
- successful completion restores the drive to `ONLINE`;
- repaired state persists in `GameRuntime`.

Opening pulse presentation:

- short violet additive flash;
- horizontal interference band across the viewscreen;
- no physical camera shake.

---

# 13. Player ship status

A temporary top-center ship status panel displays:

```text
HULL
PD
SHD
ENGINE
```

The bridge uses one full snapshot event:

```text
PLAYER_SHIP_STATUS_UPDATED
```

Payload contains:

- current/max hull;
- drive status;
- current/max point-defense charges;
- current/max shield-generator charges.

Current drive presentation:

```text
ONLINE   → ENGINE text is white
DISABLED → ENGINE text is red
```

The panel root owns:

- common background;
- layout;
- event subscription;
- child lifecycle.

Current child views:

```text
BridgeHullStatusView
BridgePointDefenseChargesView
BridgeShieldChargesView
BridgeDriveStatusView
```

The panel is intentionally temporary.

Long-term ship state should be represented by physical bridge consoles, officer stations or the captain dashboard rather than a permanent flat status strip.

---

# 14. Current checkpoint

Latest completed slice:

```text
Persistent main drive
+ Engineer repair
+ opening hostile disruption pulse
+ drive status HUD
+ disruption VFX
```

Verified behavior:

- persistent player drive exists;
- encounter receives a drive snapshot;
- FLY TO, DOCK and JUMP require an online drive;
- REPAIR ENGINE restores a disabled drive after 12 seconds;
- cancelled/interrupted repair loses progress;
- hostile ships pulse once per encounter;
- neutral-to-enemy transition triggers the same pulse flow;
- pulse cancels drive-dependent tasks;
- interrupted travel returns to the original anchor;
- drive/navigation persist into `GameRuntime`;
- ENGINE status updates immediately;
- disruption VFX plays;
- typecheck passes;
- tests pass;
- runtime smoke test passes.

Latest verified commit:

```text
761414fbe96568c23f1851a40a6355d181da1437
```

---

# 15. Next task

The next task is not another gameplay feature.

The next task is:

```text
COGNITIVE REFACTOR PASS
```

Goals:

- make ownership easier to understand;
- reduce unnecessary jumps between files;
- identify duplicated orchestration;
- identify state synchronized by several owners;
- centralize genuinely scattered startup configuration;
- remove obsolete comments and formatting debris;
- keep code explicit and intentionally boring.

Before changing code:

1. read fresh `master`;
2. read `PROJECT_CONTEXT.md`;
3. read `BACKLOG.md`;
4. audit the current code without treating previous-chat guesses as facts;
5. agree on a concrete ordered list of refactor atoms.

The detailed refactor instructions and candidate audit areas are in `BACKLOG.md`.

Do not:

- split files merely because they are long;
- create frameworks for hypothetical features;
- refactor several independent areas in one unreviewable batch;
- change gameplay behavior accidentally during cleanup.

---

# 16. End-of-chat update procedure

Before moving to a new chat:

1. Read fresh `master`.
2. Update `Latest verified master`.
3. Update `Current checkpoint`.
4. Update any changed gameplay contracts.
5. Update `Next task`.
6. Move deferred discoveries into `BACKLOG.md`.
7. Remove statements that are no longer true.
8. Push both documents with the final implementation checkpoint.

At the start of the next chat, the assistant should read:

```text
PROJECT_CONTEXT.md
BACKLOG.md
```

and then inspect fresh `master` before proposing implementation.
