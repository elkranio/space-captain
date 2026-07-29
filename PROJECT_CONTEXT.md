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

Last updated: 2026-07-29

Latest verified `master`:

```text
2a100671c087675790f02ce770ee80da9e92e21c
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
- do not split one simple behavior into many tiny ceremonial steps.

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
- encounter state is a runtime snapshot used by `EncounterEngine`;
- engine emits encounter events;
- app controllers translate encounter events into bridge-local presentation events;
- avoid multiple authoritative sources of the same runtime state;
- avoid duplicate parallel folder structures;
- prefer plain `string` IDs unless a stronger type clearly reduces mistakes.

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
- reduce cognitive load;
- prevent a demonstrated bug.

Refactors are not justified merely because a more generic architecture might be useful later.

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

The bridge ultimately contains living officers at their stations.

Current flat status panels and labels are temporary prototype presentation.

---

# 6. Bridge and officers

The bridge has the main officer roles:

- Helm;
- Comms;
- Science;
- Weapons;
- Engineer.

Officer commands create officer tasks.

Officer task state includes:

- task ID;
- officer role;
- source command ID;
- optional target ID;
- label;
- progress;
- duration;
- task-specific data where required.

Officer availability is derived from current encounter state and tasks.

Officer stations display:

- ready/busy/blocked lights;
- blinking activity label;
- optional progress bar for tasks where precise timing matters.

Progress bars are currently shown for:

- Science threat identification;
- Weapons point-defense aiming.

The progress bar is stable and does not blink with the activity label.

An open officer command menu refreshes available commands by polling the engine approximately every 200 ms.

Officer commands should eventually be reachable with keyboard keys `1–5` and should remain gamepad-friendly.

---

# 7. Navigation and encounters

Player navigation state is persistent.

Encounter state is reconstructed from:

- current space node;
- player navigation state;
- persistent player ship resources required by the encounter.

Implemented navigation/contact flows include:

- request docking;
- hail;
- plot course;
- fly to;
- docking;
- jump-point creation;
- travel presentation.

The obsolete player ship cannot create a stable jump window by itself.

Science locates a temporary natural spatial distortion and computes a navigational solution around it.

The current pseudo-3D travel presentation uses:

- horizontal panorama;
- parallax;
- step-like low-frame-rate motion;
- runtime encounter objects positioned using local coordinates and perspective depth.

---

# 8. Current combat slice

Combat currently begins from an enemy attack.

The enemy ship has a missile launcher.

Enemy missile flow:

```text
launcher ready
→ preparation / targeting
→ bridge alarm
→ missile launch
→ incoming missile appears on viewscreen
→ time to impact decreases
→ missile grows and drifts
→ impact
→ player hull damage
```

Current player hull:

```text
3 / 3
```

Current missile time to impact:

```text
12000 ms
```

Encounter step order resolves officer tasks before projectile impact.

Therefore point defense wins an exact timing tie with missile impact.

---

# 9. Threat identification

Incoming missiles initially appear unidentified.

Science has:

```text
IDENTIFY THREAT
```

Duration:

```text
3000 ms
```

Unknown missile HUD example:

```text
M1 08:7
```

Identified missile HUD example:

```text
M1 RED 05:6
```

Missiles currently use a spectral band:

```text
RED
BLUE
```

Science identification reveals the missile spectral band.

Future design:

- once an enemy launcher has been identified, later missiles from the same launcher may become automatically known;
- Science should later be able to analyze enemy systems instead of only identifying missiles.

---

# 10. Point defense

Weapons currently offers:

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

Result:

- stable colored beam;
- missile removed authoritatively by the engine;
- missile presentation disappears;
- beam fades.

Wrong beam band:

```text
MISS
```

Result:

- three short beam flashes;
- each flash has a nearby but different miss endpoint;
- missile remains active.

Point-defense charges:

```text
4 / 4
```

No point-defense recharge occurs during combat.

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
→ charge already spent
→ no additional charge is spent

MISS
→ charge already spent
→ no additional charge is spent

task cancelled
→ charge is not refunded

target disappears before aim completes
→ charge is not refunded
→ no shot presentation occurs

command rejected
→ charge is not spent

0 charges
→ RED BEAM and BLUE BEAM are not offered
```

The engine encounter state is authoritative during the encounter.

After a charge is spent:

- engine emits the remaining charge count;
- bridge integration synchronizes it into `GameRuntime`;
- the full player ship status snapshot is emitted immediately;
- the UI changes before or together with the start of `PD AIM`.

Current limitation:

```text
Only RED missile content exists.
```

Therefore BLUE BEAM is currently always the wrong choice.

---

# 11. Player ship status

A temporary top-center ship status panel displays:

```text
HULL  3/3        PD  4/4
```

The bridge uses one full snapshot event:

```text
PLAYER_SHIP_STATUS_UPDATED
```

Payload contains:

- current/max hull;
- current/max point-defense charges.

The panel root owns:

- common background;
- layout;
- event subscription;
- child lifecycle.

Children currently include:

```text
BridgeHullStatusView
BridgePointDefenseChargesView
```

The panel is intentionally temporary.

Long-term ship state should be represented by physical bridge consoles, officer stations or the captain dashboard rather than a permanent flat debug panel.

---

# 12. Current checkpoint

Latest completed atom:

```text
Point-defense charge is spent immediately when Weapons begins PD AIM.
```

Verified behavior:

- accepted RED/BLUE command immediately changes `PD 4/4` to `PD 3/4`;
- `PD AIM` starts after the charge event;
- HIT does not spend another charge;
- MISS does not spend another charge;
- cancellation does not refund the charge;
- disappearing target does not refund the charge;
- zero charges hide both point-defense commands;
- persistent runtime state receives the remaining charge count;
- status UI updates immediately;
- hull status flow still works;
- typecheck passes;
- tests pass;
- runtime smoke test passes.

Latest verified commit:

```text
2a100671c087675790f02ce770ee80da9e92e21c
```

---

# 13. Next likely task

Implement actual BLUE missile content.

Do not assume the exact implementation before reading fresh repository state and discussing the content contract.

Questions to resolve in the next chat:

- whether BLUE is a separate missile definition using the same sprite or a separate sprite;
- how enemy launchers select RED versus BLUE missiles;
- whether selection is deterministic, scripted or random;
- how tests control the selected missile band;
- whether the first prototype encounter should deliberately demonstrate both bands.

After BLUE missile content exists, RED and BLUE point-defense commands become a real symmetric decision instead of one correct option and one guaranteed miss.

---

# 14. End-of-chat update procedure

Before moving to a new chat:

1. Read fresh `master`.
2. Update `Latest verified master`.
3. Update `Current checkpoint`.
4. Update any changed gameplay contracts.
5. Update `Next likely task`.
6. Move deferred discoveries into `BACKLOG.md`.
7. Remove statements that are no longer true.
8. Push both documents with the final implementation checkpoint.

At the start of the next chat, the assistant should read:

```text
PROJECT_CONTEXT.md
BACKLOG.md
```

before proposing new implementation.
